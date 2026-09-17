// Placeholder for the new pet screen wireframe.
export type PetForm = { 
    photoUri?: string; 
    name: string; 
    species: 'dog'|'cat';
    breed: string;
    age: string; // string due to TextInput outputs string!
    weight: string;
    gender: 'male'|'female';
    status: 'spayed'|'intact';
}