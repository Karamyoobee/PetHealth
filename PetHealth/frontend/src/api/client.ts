import type {
  AssistantConversation,
  AssistantReply,
  AuthSession,
  Medication,
  MedicationTemplate,
  Pet,
  PredictiveFlag,
  Reminder,
  Symptom,
  User,
  VeterinaryProvider,
  VetVisit,
  WeightEntry,
} from "../types";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5000";
let sessionToken: string | null = null;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function setSessionToken(token: string | null) {
  sessionToken = token;
}

async function requestJson<T>(path: string, options: RequestInit = {}, timeoutMs = 45000): Promise<T> {
  // Keep sign-in headers and connection errors consistent across the screens.
  let response: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    try {
      response = await fetch(`${API_URL}${path}`, {
        ...options,
        signal: options.signal ?? controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
          ...options.headers,
        },
      });
    } catch (error) {
      if (controller.signal.aborted) {
        throw new Error("The request timed out. Please check your connection and try again.");
      }
      throw new Error(`Cannot reach backend at ${API_URL}. ${error instanceof Error ? error.message : ""}`.trim());
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new ApiError(String(error.error ?? "Request failed"), response.status);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function postJson<T>(path: string, body: unknown): Promise<T> {
  return requestJson<T>(path, { method: "POST", body: JSON.stringify(body) });
}

function reminderContext() {
  let timezone: string | undefined;
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {}
  return { timezone, timezoneOffset: new Date().getTimezoneOffset() };
}

function reminderQuery() {
  const context = reminderContext();
  return `?timezone=${encodeURIComponent(context.timezone ?? "")}&timezoneOffset=${context.timezoneOffset}`;
}

export const api = {
  health: () => requestJson<{ status: string }>("/health"),
  databaseHealth: () => requestJson<{ status: string; database?: string }>("/health/db"),
  getTodaySummary: (date: string, timezoneOffset: number) =>
    requestJson<{ date: string; counts: { vaccinations: number; medications: number; vetVisits: number } }>(
      `/api/home/today?date=${encodeURIComponent(date)}&timezoneOffset=${timezoneOffset}`
    ),

  googleLogin: (idToken: string, allowRegistration: boolean) =>
    postJson<AuthSession>("/api/auth/google", {
      idToken,
      allowRegistration,
    }),
  passwordLogin: (email: string, password: string) =>
    postJson<AuthSession>("/api/auth/password/login", { email, password }),
  requestRegistrationCode: (name: string, email: string, password: string) =>
    postJson<{ message: string; challengeId: string }>("/api/auth/register/request-code", { name, email, password }),
  verifyRegistration: (email: string, challengeId: string, code: string) =>
    postJson<AuthSession>("/api/auth/register/verify", { email, challengeId, code }),
  requestPasswordCode: (email: string) =>
    postJson<{ message: string; challengeId: string }>("/api/auth/password/request-code", { email }),
  resetPassword: (email: string, challengeId: string, code: string, password: string) =>
    postJson<{ message: string }>("/api/auth/password/reset", { email, challengeId, code, password }),

  listUsers: () => requestJson<User[]>("/api/users"),
  getCurrentUser: () => requestJson<User>("/api/users/me", {}, 15000),
  updateCurrentUser: (user: Partial<Pick<User, "name" | "email" | "phone">>) =>
  requestJson<User>("/api/users/me", { method: "PATCH", body: JSON.stringify(user) }),
  deleteCurrentUser: () => requestJson<void>("/api/users/me", { method: "DELETE" }),
  listCurrentUserPets: () => requestJson<Pet[]>("/api/users/me/pets"),

  listPets: () => requestJson<Pet[]>("/api/pets"),
  createPet: (pet: Omit<Pet, "id" | "status">) => postJson<Pet>("/api/pets", pet),
  updatePet: (petId: string, pet: Partial<Omit<Pet, "id">>) =>
    requestJson<Pet>(`/api/pets/${petId}`, { method: "PATCH", body: JSON.stringify(pet) }),
  deletePet: (petId: string) => requestJson<void>(`/api/pets/${petId}`, { method: "DELETE" }),

  listVetVisits: (petId: string) => requestJson<VetVisit[]>(`/api/pets/${petId}/vet-visits`),
  createVetVisit: (petId: string, visit: Omit<VetVisit, "id" | "petId">) =>
    postJson<VetVisit>(`/api/pets/${petId}/vet-visits`, visit),
  // These saved choices are requested for the selected pet only.
  listVeterinarians: (petId: string) => requestJson<VeterinaryProvider[]>(`/api/pets/${petId}/veterinarians`),
  clearVeterinarians: (petId: string) => requestJson<void>(`/api/pets/${petId}/veterinarians`, { method: "DELETE" }),

  listMedications: (petId: string) => requestJson<Medication[]>(`/api/pets/${petId}/medications`),
  createMedication: (petId: string, medication: Omit<Medication, "id" | "petId" | "doseLog">) =>
    postJson<Medication>(`/api/pets/${petId}/medications`, { ...reminderContext(), ...medication }),
  // Medication names, purposes, and dosages are saved per pet.
  listMedicationTemplates: (petId: string) => requestJson<MedicationTemplate[]>(`/api/pets/${petId}/medication-templates`),
  clearMedicationTemplates: (petId: string) => requestJson<void>(`/api/pets/${petId}/medication-templates`, { method: "DELETE" }),
  addDoseLog: (medicationId: string, dose: Medication["doseLog"][number]) =>
    requestJson<Medication>(`/api/medications/${medicationId}/doses`, {
      method: "PATCH",
      body: JSON.stringify(dose),
    }),

  listReminders: (petId: string) => requestJson<Reminder[]>(`/api/pets/${petId}/reminders${reminderQuery()}`),
  listAllReminders: () => requestJson<Reminder[]>(`/api/reminders${reminderQuery()}`),
  getNotificationConfig: () => requestJson<{ enabled: boolean; projectId: string | null }>("/api/notifications/config"),
  registerNotificationDevice: (device: { installationId: string; installationSecret: string; token: string; platform: string }) =>
    postJson<{ mode: "push" }>("/api/notifications/devices", { ...reminderContext(), ...device }),
  unregisterNotificationDevice: (device: { installationId: string; installationSecret: string }) =>
    postJson<void>("/api/notifications/devices/unregister", device),
  createReminder: (petId: string, reminder: Omit<Reminder, "id" | "petId">) =>
    postJson<Reminder>(`/api/pets/${petId}/reminders`, { ...reminderContext(), ...reminder }),
  actOnReminder: (reminderId: string, action: "complete" | "snooze" | "read", snoozeMinutes?: number, snoozeUntil?: string) =>
    postJson<Reminder>(`/api/reminders/${reminderId}/actions`, { action, snoozeMinutes, snoozeUntil }),
  dismissReadReminders: (petId: string) => postJson<void>(`/api/pets/${petId}/reminders/dismiss-read`, {}),
  updateReminder: (reminderId: string, reminder: Partial<Omit<Reminder, "id" | "petId">>) =>
    requestJson<Reminder>(`/api/reminders/${reminderId}`, {
      method: "PATCH",
      body: JSON.stringify(reminder),
    }),

  listSymptoms: (petId: string) => requestJson<Symptom[]>(`/api/pets/${petId}/symptoms`),
  createSymptom: (petId: string, symptom: Omit<Symptom, "id" | "petId">) =>
    postJson<Symptom>(`/api/pets/${petId}/symptoms`, symptom),

  listWeights: (petId: string) => requestJson<WeightEntry[]>(`/api/pets/${petId}/weights`),
  createWeight: (petId: string, weight: Omit<WeightEntry, "id" | "petId">) =>
    postJson<WeightEntry>(`/api/pets/${petId}/weights`, weight),

  listBreeds:(species: "dog" | "cat") =>
    requestJson<string[]>(`/api/breeds?species=${species}`),

  listPredictiveFlags: (petId: string) =>
    requestJson<PredictiveFlag[]>(`/api/pets/${petId}/predictive-flags`),
  createPredictiveFlag: (petId: string, flag: Omit<PredictiveFlag, "id" | "petId">) =>
    postJson<PredictiveFlag>(`/api/pets/${petId}/predictive-flags`, flag),

  getPetSummary: (petId: string) => requestJson<Record<string, unknown>>(`/api/pets/${petId}/summary`),
  getAssistantChat: (petId: string, before?: string) =>
    requestJson<AssistantConversation>(`/api/assistant/pets/${petId}/chat${before ? `?before=${encodeURIComponent(before)}` : ""}`),
  clearAssistantChat: (petId: string, version: number) =>
    requestJson<{ conversationVersion: number }>(`/api/assistant/pets/${petId}/chat?version=${version}`, { method: "DELETE" }),
  askHealthAssistant: (petId: string, message: string, conversationVersion: number, requestId: string) =>
    postJson<AssistantReply>("/api/assistant/chat", { petId, message, conversationVersion, requestId, ...reminderContext() }),
  reportUrl: (petId: string) => `${API_URL}/api/pets/${petId}/report.pdf`,
  getReportRequest: (petId: string) => ({
    url: `${API_URL}/api/pets/${encodeURIComponent(petId)}/report.pdf`,
    headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {} as Record<string, string>,
  }),
};
