const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function loadTypeScript(file, imports = {}, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, jsx: ts.JsxEmit.React },
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

function setupScreen(file = "App.tsx", props = {}, api = {}, exportName = "default") {
  const states = [];
  const effects = [];
  const pendingEffects = [];
  const alerts = [];
  let stateIndex = 0;
  let effectIndex = 0;
  const react = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    useState: (initial) => {
      const index = stateIndex++;
      if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;
      return [states[index], (value) => { states[index] = typeof value === "function" ? value(states[index]) : value; }];
    },
    useCallback: (callback) => callback,
    useMemo: (callback) => callback(),
    useRef: (initial) => react.useState({ current: initial })[0],
    useEffect: (callback, dependencies) => {
      const index = effectIndex++;
      if (!effects[index] || dependencies.some((value, key) => value !== effects[index].dependencies[key])) {
        pendingEffects.push(() => {
          effects[index]?.cleanup?.();
          effects[index] = { dependencies, cleanup: callback() };
        });
      }
    },
  };
  const imports = {};
  const source = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TSX);
  for (const statement of parsed.statements) {
    if (!ts.isImportDeclaration(statement) || !statement.importClause) continue;
    const clause = statement.importClause;
    const values = { __esModule: true };
    if (clause.name) values.default = clause.name.text;
    for (const binding of clause.namedBindings?.elements ?? []) values[binding.name.text] = binding.name.text;
    imports[statement.moduleSpecifier.text] = values;
  }
  const native = {
    ...imports["react-native"],
    Alert: { alert: (...args) => alerts.push(args) },
    StyleSheet: { create: (styles) => styles },
    Platform: { OS: "android" },
    StatusBar: { currentHeight: 0 },
    BackHandler: { addEventListener: () => ({ remove() {} }) },
  };
  Object.assign(imports, {
    react,
    "react-native": native,
    "@theme": { colors: {}, spacing: {}, radius: {} },
    "../../theme": { colors: {}, spacing: {}, radius: {} },
    "expo-web-browser": { maybeCompleteAuthSession() {} },
    "expo-auth-session/providers/google": { useIdTokenAuthRequest: () => [null, null, async () => {}] },
    "@react-native-async-storage/async-storage": { setItem: async () => {} },
    "./src/api/client": { api, setSessionToken() {} },
    "../../../api/client": { api },
    "../../api/client": { api },
    "./src/auth/session": {
      restoreSavedSession: async () => ({ status: "restored", user: { id: "owner", name: "Owner" } }),
      clearSavedSession: async () => {},
    },
  });
  const Component = loadTypeScript(file, imports)[exportName];
  const render = () => {
    stateIndex = 0;
    effectIndex = 0;
    let tree = Component(props);
    while (typeof tree.type === "function") tree = tree.type(tree.props);
    pendingEffects.splice(0).forEach((effect) => effect());
    return tree;
  };
  return {
    render, alerts,
    ready: async () => {
      render();
      await new Promise((resolve) => setImmediate(resolve));
      return render();
    },
  };
}

function screenProps(tree, type, accessibilityLabel) {
  if (!tree || typeof tree !== "object") return undefined;
  if ((tree.type === type || tree.type?.name === type) && (!accessibilityLabel || tree.props.accessibilityLabel === accessibilityLabel)) return tree.props;
  for (const child of (tree.props?.children ?? []).flat(Infinity)) {
    const props = screenProps(child, type, accessibilityLabel);
    if (props) return props;
  }
}

test("Home weight tracking selects a real pet and returns to Home", async () => {
  const app = setupScreen();
  const home = screenProps(await app.ready(), "HomeScreen");
  assert.ok(home.availableScreens.includes("weights"));
  home.onNavigate("weights");
  screenProps(app.render(), "MyPetsScreen").onSelectPet("pet-b");
  const tracker = screenProps(app.render(), "WeightDashboard");
  assert.equal(tracker.petId, "pet-b");
  tracker.onBack();
  assert.ok(screenProps(app.render(), "HomeScreen"));
});

test("symptom history uses the saved pet when the form changes pets", async () => {
  const app = setupScreen();
  screenProps(await app.ready(), "HomeScreen").onNavigate("symptoms", "pet-a");
  screenProps(app.render(), "LogSymptom").onSaved("pet-b");
  const history = screenProps(app.render(), "MyLogSymptom");
  assert.equal(history.petId, "pet-b");
  history.onBack();
  assert.ok(screenProps(app.render(), "HomeScreen"));
});

for (const [action, list, addAction, form] of [
  ["onVetVisits", "VetVisitForm", "onScheduleVisit", "ScheduleVisitScreen"],
  ["onMedications", "MedicationForm", "onAddMedication", "AddMedicationScreen"],
]) {
  test(`${list} retains the selected pet through its add form and profile return`, async () => {
    const app = setupScreen();
    screenProps(await app.ready(), "HomeScreen").onNavigate("pets", "pet-a");
    screenProps(app.render(), "PetProfileScreen")[action]();
    assert.equal(screenProps(app.render(), list).petId, "pet-a");
    screenProps(app.render(), list).onSelectPet("pet-b");
    screenProps(app.render(), list)[addAction]();
    assert.equal(screenProps(app.render(), form).petId, "pet-b");
    screenProps(app.render(), form).onSubmit("pet-c");
    const records = screenProps(app.render(), list);
    assert.equal(records.petId, "pet-c");
    records.onBack();
    assert.equal(screenProps(app.render(), "PetProfileScreen").petId, "pet-c");
  });
}

test("Alerts can navigate to Timeline and back to Pets", async () => {
  const app = setupScreen();
  screenProps(await app.ready(), "HomeScreen").onNavigate("reminders");
  screenProps(app.render(), "ReminderForm").onNavigate("timeline");
  screenProps(app.render(), "Timeline").onNavigate("pets");
  assert.ok(screenProps(app.render(), "MyPetsScreen"));
});

test("opening Delete Pet does not delete records until the confirmation is accepted", async () => {
  const deleted = [];
  let returned = false;
  const profile = setupScreen("src/features/pets/screens/PetProfileScreen.tsx", {
    petId: "pet-a", onDeleted: () => { returned = true; },
  }, {
    listCurrentUserPets: async () => [{ id: "pet-a", name: "Saved pet" }],
    deletePet: async (id) => deleted.push(id),
  });
  screenProps(await profile.ready(), "PhotoHeader").onDelete();
  const options = profile.alerts.at(-1)[2];
  options.find((button) => button.text === "Delete Pet").onPress();
  assert.deepEqual(deleted, []);
  assert.equal(returned, false);
  await profile.alerts.at(-1)[2].find((button) => button.text === "Delete").onPress();
  assert.deepEqual(deleted, ["pet-a"]);
  assert.equal(returned, true);
});

function screenText(tree) {
  if (typeof tree === "string" || typeof tree === "number") return String(tree);
  return (tree?.props?.children ?? []).flat(Infinity).map(screenText).join(" ");
}

test("Timeline loads saved records for the selected pet without mixing pets", async () => {
  const requested = [];
  const timeline = setupScreen("src/components/Timeline/timeline_view.tsx", { onBack() {}, onNavigate() {} }, {
    listCurrentUserPets: async () => [{ id: "pet-a", name: "First pet" }, { id: "pet-b", name: "Second pet" }],
    listVetVisits: async (id) => { requested.push(id); return [{ id: "visit", appointmentDate: "2026-10-20", clinicName: "Saved clinic" }]; },
    listMedications: async (id) => { requested.push(id); return [{ id: "medicine", startDate: "2026-10-21", name: "Saved medicine" }]; },
    listSymptoms: async (id) => { requested.push(id); return [{ id: "symptom", recordedAt: "2026-10-22", name: `Saved symptom ${id}` }]; },
    listWeights: async (id) => { requested.push(id); return [{ id: "weight", recordedAt: "2026-10-23", weightKg: 12.5 }]; },
  });
  await timeline.ready();
  await new Promise((resolve) => setImmediate(resolve));
  let tree = timeline.render();
  assert.deepEqual(requested, ["pet-a", "pet-a", "pet-a", "pet-a"]);
  assert.match(screenText(tree), /Saved clinic/);
  assert.match(screenText(tree), /Saved medicine/);
  assert.match(screenText(tree), /Weight: 12.5 kg/);
  assert.ok(screenText(tree).indexOf("Weight: 12.5 kg") < screenText(tree).indexOf("Saved clinic"));
  screenProps(tree, "PetSelector").onSelectPet("pet-b");
  timeline.render();
  await new Promise((resolve) => setImmediate(resolve));
  tree = timeline.render();
  assert.match(screenText(tree), /Saved symptom pet-b/);
  assert.doesNotMatch(screenText(tree), /Saved symptom pet-a/);
  assert.deepEqual(requested.slice(4), ["pet-b", "pet-b", "pet-b", "pet-b"]);
});

for (const password of ["a!", "a".repeat(256) + "#", "letters without symbols"]) {
  test(`registration validates special characters for a ${password.length}-character password`, async () => {
    const requests = [];
    const auth = setupScreen("src/features/auth/AuthScreens.tsx", { mode: "register", busy: false }, {
      requestRegistrationCode: async (...args) => {
        requests.push(args);
        return { challengeId: "registration-code", message: "Verification code requested" };
      },
    }, "AuthScreen");
    let tree = await auth.ready();
    screenProps(tree, "TextInput", "Name").onChangeText("Owner");
    screenProps(tree, "TextInput", "Email").onChangeText("new@example.com");
    screenProps(tree, "TextInput", "Password").onChangeText(password);
    screenProps(tree, "TextInput", "Confirm password").onChangeText(password);
    tree = auth.render();
    assert.equal(screenProps(tree, "TextInput", "Password").maxLength, undefined);
    assert.equal(screenProps(tree, "TextInput", "Confirm password").maxLength, undefined);
    await screenProps(tree, "TouchableOpacity").onPress();
    tree = auth.render();
    if (password.includes("!") || password.includes("#")) {
      assert.equal(requests.length, 1);
      assert.equal(requests[0][2], password);
      assert.ok(screenProps(tree, "TextInput", "Registration verification code"));
    } else {
      assert.equal(requests.length, 0);
      assert.match(screenProps(tree, "ErrorText").error, /special character/);
      assert.match(screenText(tree), /Include at least one special character/);
    }
  });
}
