import type { Medication, Pet, PredictiveFlag, Reminder, Symptom, VetVisit, WeightEntry } from "../types";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5000";
const USER_ID = process.env.EXPO_PUBLIC_USER_ID ?? "demo-user";

async function requestJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": USER_ID,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(String(error.error ?? "Request failed"));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

function postJson<T>(path: string, body: unknown): Promise<T> {
  return requestJson<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export const api = {
  health: () => requestJson<{ status: string }>("/health"),
  databaseHealth: () => requestJson<{ status: string; database?: string }>("/health/db"),

  listPets: () => requestJson<Pet[]>("/api/pets"),
  createPet: (pet: Omit<Pet, "id">) => postJson<Pet>("/api/pets", pet),
  updatePet: (petId: string, pet: Partial<Omit<Pet, "id">>) =>
    requestJson<Pet>(`/api/pets/${petId}`, { method: "PATCH", body: JSON.stringify(pet) }),
  deletePet: (petId: string) => requestJson<void>(`/api/pets/${petId}`, { method: "DELETE" }),

  listVetVisits: (petId: string) => requestJson<VetVisit[]>(`/api/pets/${petId}/vet-visits`),
  createVetVisit: (petId: string, visit: Omit<VetVisit, "id" | "petId">) =>
    postJson<VetVisit>(`/api/pets/${petId}/vet-visits`, visit),

  listMedications: (petId: string) => requestJson<Medication[]>(`/api/pets/${petId}/medications`),
  createMedication: (petId: string, medication: Omit<Medication, "id" | "petId" | "doseLog">) =>
    postJson<Medication>(`/api/pets/${petId}/medications`, medication),
  addDoseLog: (medicationId: string, dose: Medication["doseLog"][number]) =>
    requestJson<Medication>(`/api/medications/${medicationId}/doses`, {
      method: "PATCH",
      body: JSON.stringify(dose),
    }),

  listReminders: (petId: string) => requestJson<Reminder[]>(`/api/pets/${petId}/reminders`),
  createReminder: (petId: string, reminder: Omit<Reminder, "id" | "petId">) =>
    postJson<Reminder>(`/api/pets/${petId}/reminders`, reminder),

  listSymptoms: (petId: string) => requestJson<Symptom[]>(`/api/pets/${petId}/symptoms`),
  createSymptom: (petId: string, symptom: Omit<Symptom, "id" | "petId">) =>
    postJson<Symptom>(`/api/pets/${petId}/symptoms`, symptom),

  listWeights: (petId: string) => requestJson<WeightEntry[]>(`/api/pets/${petId}/weights`),
  createWeight: (petId: string, weight: Omit<WeightEntry, "id" | "petId">) =>
    postJson<WeightEntry>(`/api/pets/${petId}/weights`, weight),

  listPredictiveFlags: (petId: string) =>
    requestJson<PredictiveFlag[]>(`/api/pets/${petId}/predictive-flags`),
  createPredictiveFlag: (petId: string, flag: Omit<PredictiveFlag, "id" | "petId">) =>
    postJson<PredictiveFlag>(`/api/pets/${petId}/predictive-flags`, flag),

  getPetSummary: (petId: string) => requestJson<Record<string, unknown>>(`/api/pets/${petId}/summary`),
  reportUrl: (petId: string) => `${API_URL}/api/pets/${petId}/report.pdf`,
};
