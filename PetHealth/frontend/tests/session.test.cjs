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
    module,
    exports: module.exports,
    require: (name) => {
      if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
      return imports[name];
    },
    process: { env: { EXPO_PUBLIC_API_URL: "https://api.example.com" } },
    AbortController,
    setTimeout,
    clearTimeout,
    ...globals,
  }, { filename: file });
  return module.exports;
}

function setupSession({ token = "saved-token", response, failure, storageFailure } = {}) {
  const client = loadTypeScript("src/api/client.ts");
  const saved = new Map();
  if (token) saved.set("petHealth.sessionToken", token);
  const removed = [];
  const assignedTokens = [];
  let requests = 0;
  const storage = {
    getItem: async (key) => saved.get(key) ?? null,
    setItem: async (key, value) => {
      if (storageFailure === "write") throw new Error("Storage unavailable");
      saved.set(key, value);
    },
    multiRemove: async (keys) => {
      if (storageFailure === "remove") throw new Error("Storage unavailable");
      keys.forEach((key) => {
        removed.push(key);
        saved.delete(key);
      });
    },
  };
  const session = loadTypeScript("src/auth/session.ts", {
    "@react-native-async-storage/async-storage": storage,
    "../api/client": {
      ApiError: client.ApiError,
      setSessionToken: (value) => assignedTokens.push(value),
      api: {
        getCurrentUser: async () => {
          requests += 1;
          const error = failure?.(client.ApiError);
          if (error) throw error;
          return response ?? { id: "user-1", name: "Test User" };
        },
      },
    },
  });
  return { session, saved, removed, assignedTokens, requests: () => requests };
}

test("valid saved session restores the user and retains the token", async () => {
  const state = setupSession();
  const restored = await state.session.restoreSavedSession();
  assert.equal(restored.status, "restored");
  assert.equal(restored.user.id, "user-1");
  assert.equal(state.saved.get("petHealth.sessionToken"), "saved-token");
  assert.equal(JSON.parse(state.saved.get("petHealth.sessionUser")).name, "Test User");
  assert.deepEqual(state.removed, []);
});

test("network failure retains the session and retry can restore it", async () => {
  let disconnected = true;
  const state = setupSession({ failure: () => {
    if (disconnected) return new Error("Network unavailable");
    return null;
  } });
  await assert.rejects(state.session.restoreSavedSession(), /Network unavailable/);
  assert.equal(state.saved.get("petHealth.sessionToken"), "saved-token");
  assert.deepEqual(state.removed, []);
  disconnected = false;
  const restored = await state.session.restoreSavedSession();
  assert.equal(restored.status, "restored");
});

for (const status of [400, 403, 404, 429, 500, 503]) {
  test(`HTTP ${status} does not discard a saved session`, async () => {
    const state = setupSession({ failure: (ApiError) => new ApiError("Request failed", status) });
    await assert.rejects(state.session.restoreSavedSession(), (error) => error.status === status);
    assert.equal(state.saved.get("petHealth.sessionToken"), "saved-token");
    assert.deepEqual(state.removed, []);
  });
}

test("HTTP 401 clears expired or invalid credentials", async () => {
  const state = setupSession({ failure: (ApiError) => new ApiError("Session expired", 401) });
  const restored = await state.session.restoreSavedSession();
  assert.equal(restored.status, "expired");
  assert.equal(state.saved.has("petHealth.sessionToken"), false);
  assert.deepEqual(state.removed.sort(), ["petHealth.sessionToken", "petHealth.sessionUser"].sort());
  assert.equal(state.assignedTokens.at(-1), null);
});

test("profile cache write failure does not delete a valid token", async () => {
  const state = setupSession({ storageFailure: "write" });
  await assert.rejects(state.session.restoreSavedSession(), /Storage unavailable/);
  assert.equal(state.saved.get("petHealth.sessionToken"), "saved-token");
  assert.deepEqual(state.removed, []);
});

test("first launch with no token makes no authenticated request", async () => {
  const state = setupSession({ token: null });
  assert.equal((await state.session.restoreSavedSession()).status, "missing");
  assert.equal(state.requests(), 0);
});

test("explicit sign out clears the token and user cache", async () => {
  const state = setupSession();
  state.saved.set("petHealth.sessionUser", "cached user");
  await state.session.clearSavedSession();
  assert.equal(state.saved.size, 0);
  assert.equal(state.assignedTokens.at(-1), null);
});

test("failed sign out reports the storage error", async () => {
  const state = setupSession({ storageFailure: "remove" });
  await assert.rejects(state.session.clearSavedSession(), /Storage unavailable/);
  assert.equal(state.saved.get("petHealth.sessionToken"), "saved-token");
  assert.deepEqual(state.assignedTokens, []);
});

test("API errors retain HTTP status even with a non-JSON backend response", async () => {
  const client = loadTypeScript("src/api/client.ts", {}, {
    fetch: async () => ({ ok: false, status: 401, statusText: "Unauthorized", json: async () => { throw new Error("HTML response"); } }),
  });
  await assert.rejects(client.api.getCurrentUser(), (error) => error instanceof client.ApiError && error.status === 401);
});

test("session check times out without being classified as an invalid token", async () => {
  let cleared = false;
  const client = loadTypeScript("src/api/client.ts", {}, {
    fetch: (_, options) => new Promise((resolve, reject) => {
      options.signal.addEventListener("abort", () => reject(new Error("Aborted")));
    }),
    setTimeout: (callback, delay) => {
      assert.equal(delay, 15000);
      queueMicrotask(callback);
      return 1;
    },
    clearTimeout: () => { cleared = true; },
  });
  await assert.rejects(client.api.getCurrentUser(), (error) => /timed out/.test(error.message) && !(error instanceof client.ApiError));
  assert.equal(cleared, true);
});
