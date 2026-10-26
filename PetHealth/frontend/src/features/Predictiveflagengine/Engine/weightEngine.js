//Weight - Predictive Flagging Engine 

//Set main threshold's for weight flagging check..
const WATCH_THRESHOLD = 0.05; //5% 
const ELEVATED_THRESHOLD = 0.10;//10%

//Search function for breed and sex of pet (matching the below pet breeds...)
function getIdealPetrange(breed, sex){
    const range = weight_breed[breed]?.[sex];

    if(!range){
        throw new Error('Unkown breed or sex: '+breed+" "+sex);
    }
    
    return range;
}

//Second Function (Main Function & Validation check of pet selected or checked through predictive flagging engine)
function retrieveWeightStatus(breed,sex,currentKg){
    if(typeof currentKg !== "number" || currentKg <= 0)
    {throw new Error("Weight must be a positive number only!");}

    //Collect range out of minimum and maximum in one line 
    const {min, max} = getIdealPetrange(breed, sex);

    //Deviation check
    let deviation = 0; 
    let position = "within";
     
    if (currentKg < min)
        {position = "under"
        deviation = (min-currentKg) / min;
        }
    else if(currentKg > max){
        position = "over";
        deviation = (currentKg - max) / max;
    } 
    
    //Deviation converted into level display
    let Level;
    if (deviation < WATCH_THRESHOLD){
        Level = "Typical";
    } else if(deviation < ELEVATED_THRESHOLD){
        Level = "Watch";
    } else{
        Level = "Elevated";
    }

    //Return Pet Predictive Analysis Result (Simple)
    return{
        level: Level, 
        position: position,
        currentKg: currentKg,
        idealMin: min,
        idealMax: max,
        message: position === "within" 
            ? "Current Weight is within expcted range"
            : 'Weight is' + position + 'the expected range.',
    };
}

//LEVEL COLORS FOR WEIGHT CHECK - ANALYSIS
const LEVEL_COLORS = {
    Typical: '#2E7D6B',
    Watch: '#1F6F5C',
    Elevated: '#D32F2F',
}

//Only doing on 6 Selected Breeds (3 Dog Breed & 3 Cat Breeds)
//Check process 1. Breed 2. Sex 3. Min/Max Weight Check
const weight_breed = {
    //Dog Breed 1: Labrador Retriever
    labrador:{
        female:{min: 25, max: 32},
        male: {min: 29, max:36}
    },

    huntaway:{
        female:{min:25, max:35},
        male: {min:30,max:40},
    },

    golden:{
        female:{min:25, max:29.5},
        male: {min:29.5,max:34},
    },

    british:{
        female:{min:3.2, max:5.4},
        male: {min:4.1,max:7.7},
    },

    domestic:{
        female:{min:3.5, max:5.5},
        male: {min:3.5,max:5.5},
    },

    ragdoll:{
        female:{min:3.6, max:6.8},
        male: {min:5.4,max:9.1},
    }

};

module.exports = {retrieveWeightStatus, LEVEL_COLORS}

console.log(retrieveWeightStatus("british", "male", 6.0));
console.log(retrieveWeightStatus("labrador", "female", 33.5).level);  // Typical
console.log(retrieveWeightStatus("labrador", "female", 34).level);    // Watch
console.log(retrieveWeightStatus("ragdoll", "female", 9).level);      // Elevated