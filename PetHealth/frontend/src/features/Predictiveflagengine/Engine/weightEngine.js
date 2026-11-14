//Weight - Predictive Flagging Engine 

//Check pet weight against ideal expected pet weight based on breed & sex of animal (only those below accepted)
//Return 1 of 3 levels : 1, Typical, 2, Watch, 3, Elevated

//0.05 = 5% , 0.10 = 10%
//Under 5% outside the range for expected weight -> "Typical"
//5% - 10% outside of range                      -> "Watch"
//10% or more outside                            -> "Elevated"

//Set main threshold's for weight flagging check..
const WATCH_THRESHOLD = 0.05; //5% if current pet weight goes over 5% of expected weight of the specific breed only
const ELEVATED_THRESHOLD = 0.10;//10% if current pet weight goes well over 10% of expected weight of pet 

//Search for Ideal {min, max} weight (kg) for breed and sex of animal 

//Search function for breed and sex of pet (matching the below pet breeds...)
function getIdealPetrange(breed, sex){
    const range = weight_breed[breed]?.[sex];//declare weight_breed connected to backend type
    //

    //If condition check
    //if pet is not supported for the specific weight analaysis checker
    if(!range){
        throw new Error('Unkown breed or sex: '+ breed + " " + sex);
    }
    
    return range;
}

//Main Function - return pet breed, sex and current pet weight only in "kg"
//return level, under/over/within
//Breed and sex match the keys 
//Second Function (Main Function & Validation check of pet selected or checked through predictive flagging engine)
function retrieveWeightStatus(breed,sex,currentKg){
    //Step 1: ensure that the weight is a real number above 0
    if(typeof currentKg !== "number" || currentKg <= 0)
    {throw new Error("Weight must be a positive number only!");}

    //Setp 2: get ideal min and max for this breed and it's sex (gender)
    const {min, max} = getIdealPetrange(breed, sex);

    //Step 3: Identify how far outside of the range the pet is 
    //Devication = fraction 0.05 == 5% outside or expected weight range
    //position reads: "within", "under" , "over"

    //Deviation check
    let deviation = 0; 
    let position = "within";
    
    //If Pet's Weight is under the minimum: compare gap to minimum
    if (currentKg < min)
        {position = "under"
        deviation = (min-currentKg) / min;
        }
    //Over the maximum expected pet weight: compare gap to maximum 
    else if(currentKg > max){
        position = "over";
        deviation = (currentKg - max) / max;
    } 
    
    {/*Typical = Current Pet's Weight below the expected Weight*/}
    {/*Watch = Current Pet's Weight is over the expected weight of the pet*/}

    //Deviation converted into level display
    let Level;//Declare level

    //Typical - inside expected weight range, or less than 5% outside the weight range 
    //Watch - 5% = 10% outside of expected pet weight range 
    //Elevated = 10% or more outside of range, worth a vet check

    //Step 4: Turn deviation number into level range
    if (deviation < WATCH_THRESHOLD){
        Level = "Typical";
    } else if(deviation < ELEVATED_THRESHOLD){ 
        Level = "Watch";
    } else{
        Level = "Elevated";
    }

    //Return Pet Predictive Analysis Result (Simple)
    //Step 5:  Send Result of back to Screen
    return{
        level: Level,              //Typical, Watch or Elevated
        position: position,       //'within', 'under', 'over' - ideal range
        currentKg: currentKg,    //Weight was checked
        idealMin: min,          //lowest ideal expected weight for this breed & sex (kg)
        idealMax: max,         //highest ideal expected weight for this breed & sex (kg)
        message: position === "within" 
            ? "Current Weight is within expcted range"
            : 'Weight is ' + position + ' the expected range.',
    };
}

//LEVEL COLORS FOR WEIGHT CHECK - ANALYSIS
//Typical - green | Watch - orange | Elevated - red
const LEVEL_COLORS = {
    Typical: '#2E7D6B',
    Watch: '#FF9F00',
    Elevated: '#D32F2F',
}

//Only doing on 6 Selected Breeds (3 Dog Breed & 3 Cat Breeds)
//Check process 1. Breed 2. Sex 3. Min/Max Weight Check
const weight_breed = {
    //  ---- DOG BREEDS --- 
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

     //  ---- CAT BREEDS --- 
    british:{
        female:{min:3.2, max:5.4},
        male: {min:4.1,max:7.7},
    },

    domestic_shorthair:{
        female:{min:3.5, max:5.5},
        male: {min:3.5,max:5.5},
    },

    ragdoll:{
        female:{min:3.6, max:6.8},
        male: {min:5.4,max:9.1},
    }

};

// ----- Final Export -----
//Allow other files use the below exports
module.exports = {retrieveWeightStatus, LEVEL_COLORS}

