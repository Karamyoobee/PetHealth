export type Pet = {
  id: string;
  userId?: string;
  name: string;
  species: "Dog" | "Cat";
  breed: string;
  age: number;
  sex: string;
  weightKg: number;
  spayedNeutered: boolean;
};

export type User = {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
};

export type VetVisit = {
  id: string;
  petId: string;
  appointmentDate: string;
  clinicName: string;
  veterinarianName: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  followUpDate: string;
};

export type Medication = {
  id: string;
  petId: string;
  name: string;
  dosage: string;
  instructions: string;
  schedule: string;
  startDate: string;
  endDate: string;
  reminderTime: string;
  doseLog: { status: "taken" | "missed"; takenAt: string; notes?: string }[];
};

export type Reminder = {
  id: string;
  petId: string;
  type: "medication" | "weight" | "symptom" | "checkup" | "refill" | "follow-up" | "custom";
  title: string;
  scheduledFor: string;
  repeat: "none" | "daily" | "weekly" | "monthly";
  enabled: boolean;
};

export type Symptom = {
  id: string;
  petId: string;
  name: string;
  severity: "low" | "medium" | "high";
  notes: string;
  recordedAt: string;
};

export type WeightEntry = {
  id: string;
  petId: string;
  weightKg: number;
  recordedAt: string;
  notes?: string;
};

export type PredictiveFlag = {
  id: string;
  petId: string;
  type: string;
  title: string;
  message: string;
  severity: "low" | "medium" | "high";
  createdAt: string;
  resolved: boolean;
};
