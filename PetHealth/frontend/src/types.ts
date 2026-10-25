//Pet Form Field Data - Object Type 
export type Pet = {
  id: string;
  userId?: string;
  name: string;
  species: "Dog" | "Cat";
  breed: string;
  age: number;
  sex: string;
  photoUri?: string | null;
  weightKg: number;
  spayedNeutered: boolean;
  status: 'Healthy' | 'Checkup Due';
};

export type User = {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  picture?: string;
  provider?: "google" | string;
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
  id: string;//User Id
  petId: string;//Pet Id
  name: string;//Pet Name
  severity: "mild" | "moderate" | "severe";//
  category: "Digestive" | "Skin" | "Mobility" | "Appetite";//
  durationDays: number;//Used for dropdown menu selection '2 days'
  notes: string;//Notes section
  recordedAt: string;//Time / Date recorded in Database
};

export type WeightEntry = {
  id: string;//User Id
  petId: string;//petId
  weightKg: number;//Store Weight in kg
  recordedAt: string;//Time / Date Recorded in database
  notes?: string;//Notes section
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
