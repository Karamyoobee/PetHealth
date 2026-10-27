const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function loadTypeScript(file, imports = {}, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  });
  const module = { exports: {} };
  vm.runInNewContext(compiled.outputText, {
    module, exports: module.exports, require: (name) => imports[name],
    process: { env: { EXPO_PUBLIC_API_URL: "https://api.example.com" } },
    AbortController, setTimeout, clearTimeout, ...globals,
  }, { filename: file });
  return module.exports;
}

function setupExport({ status = 200, failure, available = true, platform = "android" } = {}) {
  const events = [];
  const client = loadTypeScript("src/api/client.ts");
  client.setSessionToken("private-session-token");
  const fileSystem = {
    cacheDirectory: "file:///cache/",
    makeDirectoryAsync: async (directory) => events.push(["directory", directory]),
    createDownloadResumable: (url, uri, options) => ({
      downloadAsync: async () => {
        events.push(["download", url, options]);
        if (failure) throw new Error("Network unavailable");
        return { status, uri };
      },
      cancelAsync: async () => {},
    }),
    deleteAsync: async (directory) => events.push(["delete", directory]),
  };
  const sharing = {
    isAvailableAsync: async () => available,
    shareAsync: async (uri, options) => events.push(["share", uri, options]),
  };
  const report = loadTypeScript("src/features/reports/exportReport.ts", {
    "react-native": { Platform: { OS: platform } },
    "expo-file-system": fileSystem,
    "expo-sharing": sharing,
    "../../api/client": client,
  }, {
    fetch: async (url, options) => {
      events.push(["fetch", url, options]);
      return { status, blob: async () => ({ type: "application/pdf" }) };
    },
    URL: { createObjectURL: () => "blob:report", revokeObjectURL: () => {} },
    document: {
      createElement: () => ({ click: () => events.push(["click"]), remove: () => {} }),
      body: { appendChild: (link) => events.push(["link", link]) },
    },
  });
  return { report, events };
}

test("native report export authenticates, shares a PDF, and removes its temporary file", async () => {
  const { report, events } = setupExport();
  await report.exportPetReport({ id: "pet-1", name: "Bella / Friends" });
  const download = events.find(([event]) => event === "download");
  assert.equal(download[1], "https://api.example.com/api/pets/pet-1/report.pdf");
  assert.equal(download[2].headers.Authorization, "Bearer private-session-token");
  assert.ok(!download[1].includes("private-session-token"));
  const share = events.find(([event]) => event === "share");
  assert.ok(share[1].endsWith("Bella-Friends-health-report.pdf"));
  assert.equal(share[2].mimeType, "application/pdf");
  assert.equal(events.at(-1)[0], "delete");
});

for (const status of [401, 404, 503]) {
  test(`HTTP ${status} is never shared as a PDF and temporary files are removed`, async () => {
    const { report, events } = setupExport({ status });
    await assert.rejects(report.exportPetReport({ id: "pet-1", name: "Bella" }), (error) => error.status === status);
    assert.ok(!events.some(([event]) => event === "share"));
    assert.equal(events.at(-1)[0], "delete");
  });
}

test("failed downloads clean up and can be retried", async () => {
  const { report, events } = setupExport({ failure: true });
  await assert.rejects(report.exportPetReport({ id: "pet-1", name: "Bella" }), /Network unavailable/);
  assert.equal(events.at(-1)[0], "delete");
});

test("unavailable sharing does not download private records", async () => {
  const { report, events } = setupExport({ available: false });
  await assert.rejects(report.exportPetReport({ id: "pet-1", name: "Bella" }), /not available/);
  assert.equal(events.length, 0);
});

test("browser download uses the session header and the PDF filename", async () => {
  const { report, events } = setupExport({ platform: "web" });
  await report.exportPetReport({ id: "pet-1", name: "Bella" });
  assert.equal(events.find(([event]) => event === "fetch")[2].headers.Authorization, "Bearer private-session-token");
  assert.equal(events.find(([event]) => event === "link")[1].download, "Bella-health-report.pdf");
  assert.ok(events.some(([event]) => event === "click"));
});
