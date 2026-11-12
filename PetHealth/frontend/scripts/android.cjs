const { execFile, spawn } = require("node:child_process");
const { existsSync } = require("node:fs");
const path = require("node:path");
const { promisify } = require("node:util");

const run = promisify(execFile);
const sdkPaths = [
  process.env.ANDROID_HOME,
  process.env.ANDROID_SDK_ROOT,
  process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Android", "Sdk"),
];
const adbName = process.platform === "win32" ? "adb.exe" : "adb";
const adb = sdkPaths.filter(Boolean).map((sdk) => path.join(sdk, "platform-tools", adbName))
  .find((file) => existsSync(file)) || adbName;
const androidStudioJavaHome = process.platform === "win32"
  ? path.join(process.env.ProgramFiles || "C:\\Program Files", "Android", "Android Studio", "jbr")
  : null;
const javaHome = androidStudioJavaHome && existsSync(path.join(androidStudioJavaHome, "bin", "java.exe"))
  ? androidStudioJavaHome
  : process.env.JAVA_HOME;
let checking = false;
let stopping = false;
let reportedError = false;

async function connectBackend() {
  // USB forwarding can disappear after reconnecting, even while Metro is running.
  if (checking || stopping) return;
  checking = true;
  try {
    const { stdout } = await run(adb, ["devices"], { timeout: 5000, windowsHide: true });
    const devices = stdout.split(/\r?\n/).map((line) => line.trim().split(/\s+/))
      .filter(([serial, state]) => serial && state === "device")
      .map(([serial]) => serial);
    for (const serial of devices) {
      if (stopping) break;
      try {
        const { stdout: forwards } = await run(adb, ["-s", serial, "reverse", "--list"], { timeout: 5000, windowsHide: true });
        const connected = forwards.split(/\r?\n/).some((line) => {
          const fields = line.trim().split(/\s+/);
          return fields[1] === "tcp:5000" && fields[2] === "tcp:5000";
        });
        if (!connected && !stopping) {
          await run(adb, ["-s", serial, "reverse", "tcp:5000", "tcp:5000"], { timeout: 5000, windowsHide: true });
          console.log("Backend USB forwarding restored on port 5000.");
        }
      } catch {
        // A device can disconnect during a check. Try again on the next check.
      }
    }
    reportedError = false;
  } catch {
    if (!reportedError && !stopping) {
      console.warn("Could not check USB forwarding. Check that Android platform-tools are installed.");
      reportedError = true;
    }
  } finally {
    checking = false;
  }
}

async function startAndroid() {
  const expoCli = require.resolve("expo/bin/cli");
  await connectBackend();
  console.log("USB backend reconnection is active. Keep this terminal and your backend running.");
  const timer = setInterval(connectBackend, 3000);
  // Prefer Android Studio's Java so a separate system Java installation cannot break Gradle.
  const environment = javaHome ? {
    ...process.env,
    JAVA_HOME: javaHome,
    PATH: `${path.join(javaHome, "bin")}${path.delimiter}${process.env.PATH || ""}`,
  } : process.env;
  const expo = spawn(process.execPath, [expoCli, "run:android", ...process.argv.slice(2)], {
    cwd: path.resolve(__dirname, ".."),
    env: environment,
    stdio: "inherit",
    windowsHide: true,
  });
  const stop = () => {
    stopping = true;
    clearInterval(timer);
  };
  process.once("SIGINT", () => { stop(); expo.kill("SIGINT"); });
  process.once("SIGTERM", () => { stop(); expo.kill("SIGTERM"); });
  expo.once("error", (error) => {
    stop();
    console.error(`Could not start Android: ${error.message}`);
    process.exitCode = 1;
  });
  expo.once("close", (code, signal) => {
    stop();
    process.exitCode = code ?? (signal === "SIGINT" ? 130 : 1);
  });
}

startAndroid().catch((error) => {
  console.error(`Could not start Android: ${error.message}`);
  process.exitCode = 1;
});
