import { Pet, WeightEntry, Symptom } from "../../../types";

export type EngineFlagging={
    category: "Weight" | 'Heart' | 'Dental',
    level: 'ok'|'concern' |'watch',
    reason: string,
}