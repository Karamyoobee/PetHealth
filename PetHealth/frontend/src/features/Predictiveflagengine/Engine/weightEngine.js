//Weight - Predictive Flagging Engine 
//Only accepts 2 year old age range

//Check pet weight against estimated expected pet weight based on breed & sex of animal (only those below accepted)
//Return 1 of 3 levels : 
// 1. Typical
// 2. Watch 
// 3. Elevated

//Under 5% outside the range for expected minimum pet weight -> "Typical"
//5% - 10% outside of range                      -> "Watch"
//10% or more outside                            -> "Elevated"

//Set main threshold's for weight flagging check..
const WATCH_THRESHOLD = 5; //5% if current pet weight goes over 5% of expected weight of the specific breed only
const ELEVATED_THRESHOLD = 10;//10% if current pet weight goes well over 10% of expected weight of pet 

//Search for estimated {min, max} weight (kg) for breed and sex of animal 

//Search function for breed and sex of pet (matching the below pet breeds...)
function getIdealPetrange(breed, sex){
    const range = weight_breed[breed]?.[sex];//Search for breed and sex inside dataset below

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

    //Setp 2: get estimated min and max for this breed and it's sex (gender)
    const {min, max} = getIdealPetrange(breed, sex);

    //Step 3: Identify how far the pet's weight is outside of the range the pet is 
    //Difference = fraction 0.05 == 5% outside or expected weight range
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
    
    {/*Typical = Current Pet's Weight below the expected Weight*/}
    {/*Watch = Current Pet's Weight is over the expected weight of the pet*/}

    //Difference value converted into level display
    let Level;//Declare level

    //3 Levels below 
    //Typical - inside expected weight range, or less than 5% outside the weight range 
    //Watch - 5% = 10% outside of expected pet weight range 
    //Elevated = 10% or more outside of range, worth a vet check

    //Step 4: Turn Difference number into level range
    //If pet's weight is 10%+ outside of expected pet weight range (under/over)
    if (difference >= ELEVATED_THRESHOLD){
        Level = "Elevated";
    //If pet's weight range is 5%-10%
    } else if(difference >= WATCH_THRESHOLD){ 
        Level = "Watch";
    }else{
        Level="Typical";
    }

    //Return Pet Predictive Analysis Result (Simple)
    //Step 5:  Send Result of Predictive Flagging engine back to Screen

    //Message for position based on level
    //Variable to store message based on position of pet's weight
    let message;

    //If pet's weight is inside min/max weight range for it's breed and sex
    if (position === 'within'){
        message = 'Current Weight is within expcted range'
    //Typical Level - slightly outside of weight range (less than 5%)
    } else if(Level === 'Typical'){
        message = currentKg + 'kg '+'Weight is ' + position + ' the expected range.'
    //Watch Level - 5%-10% outside of weight range 
    } else if(Level === 'Watch'){
        message = currentKg + 'kg '+'Weight is ' + position + ' remains within the expected range.';
    //Elevated Level - 10% outside of expected weight range
    } else if(Level ==='Elevated'){
        message = currentKg + 'kg '+ 'Weight is ' + position + ' has exceeded the expected range!, Vet check is recommended!';
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
//Typical - green | Watch - orange | Elevated - red
const LEVEL_COLORS = {
    Typical: '#2E7D6B',
    Watch: '#FF9F00',
    Elevated: '#D32F2F',
}


//Checked on all Dog & Cat Breeds
//Check process 1. Breed 2. Sex 3. Min/Max Weight Check
//Research and check all pet weight
const weight_breed = {
    //  ---- DOG BREEDS --- 
    labrador:{//Correct
        female:{min: 25, max: 32},//2 Year old range 
        male: {min: 29, max:36}//2 Year old range
    },
    
    huntaway:{//Correct
        female:{min:25, max:35},//2 Year's old
        male: {min:30,max:40},//2 Year's old range
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

};


// ----- Final Export -----
//Allow other files use the below exports
module.exports = {retrieveWeightStatus, LEVEL_COLORS}

