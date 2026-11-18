//Weight - Predictive Flagging Engine 
//limitation: Only accepts 2 year old age range!

//Check pet weight against estimated expected pet weight based on breed & sex of animal (only under / over weight range)
//Return 1 of 3 levels : 
// 1. Typical = Within expected weight range
// 2. Watch  = any weight under the expected weight range or over less than 10% of maximum expected pet weight range
// 3. Elevated = 10% over expected weight

//Set main threshold's for weight flagging check..
const ELEVATED_THRESHOLD = 10;//10% Percentage over maximum weight range a pet goes into "Elevated" Flag!

//Search function for breed and sex of pet (matching the below pet breeds...)
function getIdealPetRange(breed, sex){
    const range = weight_breed[breed]?.[sex];//Search for breed and sex inside dataset below

    if(!range){
        throw new Error('Unknown breed or sex: '+ breed + " " + sex);
    }
    
    return range;
}

//Main Function - return pet breed, sex and current pet weight only in "kg"
//return level, under/over/within
//Breed and sex match the keys 
//Second Function (Main Function & Validation check of pet selected or checked through predictive flagging engine)
function retrieveWeightStatus(breed,sex,currentKg, ageYears =2){

    //FUTURE_PROOF TO-DO: support other ages in future
    //Only accept 2 year old pets
    if (ageYears !== 2){
        throw new Error("2 Year-old pets are only supported at this stage of our App!")
    }

    //***Step 1***: ensure that the weight is a real number above 0
    if(typeof currentKg !== "number" || currentKg <= 0)
    {throw new Error("Weight must be a positive number only!");}

    //Returns (min,max) in kg. Only throws an error if breed / sex is not in weight_breed
    //***Step 2***: get estimated min and max for this breed and its sex (gender)
    const {min, max} = getIdealPetRange(breed, sex);

    //***Step 3***: Identify how far pet's weight is outside of expected weight range
    //Difference = percentage outside of the weight range (5=5%)
    //position reads: "within", "under" , "over"

    //Difference weight check
    let difference = 0; 
    let position = "within";//Inside expected weight range of pet
    
    //If Pet's Weight is under the minimum: compare gap to minimum
    if (currentKg < min)
        {position = "under"
        difference = ((min-currentKg) / min) * 100;
        }
    //Over the maximum expected pet weight: compare gap to maximum 
    else if(currentKg > max){
        position = "over";
        difference = ((currentKg - max) / max) * 100;
    } 

    
    //Difference value converted into level display
    let Level;//Declare level

    //***Step 4***: Conversion of position and difference into a level for flagging purpose
    //Note: "over" only applies for Elevated / Any "under" is classified as "Watch"


    //Pet's weight has to be within the weight boundary
    if (position === "within"){
        Level = "Typical";
    //Pet's weight is over the elevated threshold of 10%
    } else if(position === "over" && difference >= ELEVATED_THRESHOLD){
        Level="Elevated";
    }
    else{//Any pet that has weight less than expected pet weight range
        Level="Watch";
    }

    //***Step 5***:  Send Result of Predictive Flagging engine back to Screen

    //Message for position based on level
    //Variable to store message based on position of pet's weight
    let message;

    //Typical Level - If pet's weight is inside min/max weight range for its breed and sex
    if (position === 'within'){
        message = currentKg + ' kg is within expected range'
    //Watch Level - Any weight under the expected weight & less than 10% of overweight range before 10%
    } else if(Level === 'Watch'){
        message = currentKg + ' kg is ' + position + ' the expected range.';
    //Elevated Level - 10% or more over than expected weight range
    } else if(Level ==='Elevated'){
        message = currentKg + ' kg is well ' + position + ' the expected range!, Vet check is recommended!';
    } else{
        message='Unable to help with weight.'
    }

    return{
        level: Level,              //Typical, Watch or Elevated
        position: position,       //'within', 'under', 'over' - ideal range
        currentKg: currentKg,    //Weight was checked
        idealMin: min,          //lowest ideal expected weight for this breed & sex (kg)
        idealMax: max,         //highest ideal expected weight for this breed & sex (kg)
        message: message,       //message - looked up based on levels and also 
    };

}

//LEVEL COLORS FOR WEIGHT CHECK - ANALYSIS
const LEVEL_COLORS = {
    Typical: '#2E7D6B',
    Watch: '#FF9F00',
    Elevated: '#D32F2F',
}


//Expected Weight Ranges for Dog & Cat Breeds (kg) at 2 Years old only!
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

    border_collie:{
        female:{min:12,max:19},
        male:{min:14, max:20},
    },

    staffordshire_bull_terrier:{
        female:{min:10.9,max:15.4},
        male:{min:12.8, max:17},
    },

    miniature_schnauzer:{
        female:{min:5, max:7},
        male:{min:6,max:8},
    },

    jack_russell_terrier:{
        female:{min:5, max:8},
        male:{min:5,max:8},
    },

    german_shepherd:{
        female:{min:22, max:32},
        male:{min:30,max:40},
    },

    fox_terrier:{
        female:{min:6.5,max:8},
        male:{min:7.5,max:9.5},
    },
    
    cocker_spaniel:{
        female:{min:12,max:14.5},
        male:{min:13,max:15.5},
    },

    shih_tzu:{
        female:{min:4.5,max:7.5},
        male:{min:4.5,max:7.5},
    },

    rottweiler:{
        female:{min:35, max:48},
        male:{min:43,max:60},
    },

    bichon_frise:{
        female:{min:4.5,max:7},
        male:{min:5,max:8},
    },

    cavalier_king_charles_spaniel:{
        female:{min:5.4,max:8},
        male:{min:5.9,max:8.2},
    },

     //  ---- CAT BREEDS --- 
    british_shorthair:{
        female:{min:3.2, max:5.4},
        male: {min:4.1,max:7.7},
    },

    domestic_shorthair:{
        female:{min:3.5, max:5.5},
        male: {min:3.5,max:5.5},
    },

    ragdoll:{
        female:{min:4.0, max:7.0},
        male: {min:5.5,max:9.0},
    },

    maine_coon:{
        female:{min:4.5,max:7.0},
        male: {min:6.0,max:10.0},
    },

    burmese:{
        female:{min:3,max:4.3},
        male: {min:3.8,max:5.3},
    },

    siamese:{
        female:{min:2.5,max:3.8},
        male: {min:3.3,max:5},
    },

    persian:{
        female:{min:3,max:4.3},
        male: {min:3.3,max:6.5},
    },

    devon_rex:{
        female:{min:2.0,max:4.0},
        male: {min:3,max:4.5},
    },

    sphynx:{
        female:{min:2.7,max:4.5},
        male: {min:3.6,max:6.4},
    },

    russian_blue:{
        female:{min:3,max:4.5},
        male: {min:3.5,max:5.5},
    },

    birman:{
        female:{min:3.5,max:5.5},
        male: {min:4.0,max:6.5},
    },

    abyssinian:{
        female:{min:2.5,max:4.1},
        male: {min:3,max:5.4},
    },

    norwegian_forest_cat:{
        female:{min:3.6,max:6.8},
        male: {min:5.5,max:8},
    },

    exotic_shorthair:{
        female:{min:3.2,max:5.4},
        male: {min:3.6,max:6.8},
    },

    bengal:{
        female:{min:3.5,max:5},
        male:{min:4.5,max:7},
    },

};


// ----- Final Export -----
//Allow other files to use the below exports
module.exports = {retrieveWeightStatus, LEVEL_COLORS}

