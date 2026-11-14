import { useState, useEffect } from "react";
import {View, Text, StyleSheet, ActivityIndicator, ScrollView} from "react-native";//React - Native Libraries
import NewAnalysis from "../components/RunNewAnalysisButton";
import MainHeader from "../components/Header";
import { retrieveWeightStatus, LEVEL_COLORS } from "../Engine/weightEngine";
import Weightbar from "../components/Weighbar";
import WeightAdviceCard from "../components/weightAdviceCard";
import { api } from "../../../api/client";

//Props for Predictive Flagging Engine 
type PredictiveEngineProps = { 
  onBack: () => void;
  petId: string | null;
}; 

//Shape of Data Weight sent to engine (hard code - rule based)
type PetWeightData = {
    breed: string;
    breedLabel: string;
    sex: 'male'| 'female';
    currentKg: number;
    previousKg?:number;
}

//Key Breeds from Dogs and Cats that will be used for predictive flagging engine
const BREED_KEYS: Record<string, string> = {
    'Labrador Retriever': 'labrador',//Dog Breed 1
    'Huntaway': 'huntaway',//Dog Breed 2
    'Golden Retriever': 'golden',//Dog Breed 3
    'British Shorthair':'british',//Cat Breed 1
    'Domestic Short hair':'domestic_shorthair',//Cat Breed 2
    'Ragdoll':'ragdoll',//Cat breed 3
};

//Function - used to fecth pet and weights from the abckend and prepare data for engine
async function fetchPetWeigh(petId: string | null):Promise<PetWeightData>{
    //1. if no pet is selected - (clear error message)
    if (!petId) throw new Error('No Pet hase been selected!');

    //2. Get pets and weights at same time
    const [pets, weights] = await Promise.all([api.listPets(), api.listWeights(petId)])

    //3. Find pet which matches given Id
    const pet = pets.find((p) => p.id === petId);
    if(!pet) throw new Error('Pet has nt been found!');

    //4. Sort out weight's from new first to oldest 
    const sorted = [...weights].sort(
        (a,b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    );

    //5. Convert stored database backend breed text into engine key for predictive flag!
    const breedKey = BREED_KEYS[pet.breed];
    if(!breedKey) throw new Error('Breed is not supported yet!' + pet.breed);
    //Show error message - if current pet is not supported yet by this feature!

    //Add comment here: 
    const currentKg = sorted.length > 0 ? Number(sorted[0].weightKg): Number(pet.weightKg);

    //6. Provide Flagging Engine with expected data
    //Number() - protects agains weights stored as text format 
    return{
        breed: breedKey,
        breedLabel: pet.breed,
        sex: String(pet.sex).toLowerCase() as 'male' | 'female',
        currentKg: currentKg, 
        previousKg: sorted[1] ? Number(sorted[1].weightKg): undefined,
    };
}

//Main Function - Predictive Flagging Engine 
export default function PredictiveFlaggingEngine({onBack, petId}:PredictiveEngineProps){

    //Pet - load pet data / error message if failed to display some information
    const [pet, setPet] = useState<PetWeightData | null>(null);
    const [error, setError] = useState("");

    //Runs while the screen opens 
    useEffect(() => {
        fetchPetWeigh(petId)
            .then(setPet)
            .catch((e) => setError(e.message));
    },[petId]);

    //content: 
    let content;

    if(error){
        content=<Text style={styles.errormessage}>{error}</Text>
    } else if(!pet){
        content = <ActivityIndicator style={{marginTop: 24}}/>;
    } else{
        
            //Run Engine via backend on real pet breed data that is acceptable only!
            const result = retrieveWeightStatus(pet.breed,pet.sex, pet.currentKg);
            const color = LEVEL_COLORS[result.level as keyof typeof LEVEL_COLORS];
            const rawdata = ((pet.currentKg - result.idealMin) / (result.idealMax - result.idealMin))*100;
            //Bar position 0 - Min 100 - MAX
            const Percentsize = Math.max(0, Math.min(100, rawdata));//Clamp from 0-100 for percent bar 
        
            //Display inside Weight Advice Card Text
            let diffText="Within the expected range"
            //Pet weight comparision (if condition check)
            if(result.position == "under"){//Result = Message to show if Pet's weight is under expected weight range
                diffText=(result.idealMin-pet.currentKg).toFixed(1) + " Kg under the weight range"
            } else if(result.position == "over"){//Result = Message to show if Pet's weight is over expected weight range
                diffText=(pet.currentKg-result.idealMax).toFixed(1) + " Kg over the weight range"
            }
        
        content=(//Main Predictive Flagging Engine Card
        <View>

            
            <View style={styles.main_card}>
                <Text style={styles.title}>Comparison with {pet.breedLabel}</Text>
            {/*Display Comparison text between pet breed*/}            

            
            <View style={styles.row}>
                <Text style={styles.label}>Weight:</Text>
                <View style={{flex:1, marginHorizontal: 8}}>
                    <Weightbar percent={Percentsize} color={color}/>
                </View>

                <View style={[styles.badge, {backgroundColor: color}]}>
                    <Text style={styles.badgetext}>{result.level}</Text>
                </View>

            </View>
                
            </View>
            {/*Weight Advice Card*/}
            <WeightAdviceCard
                level={result.level}
                differenceText={diffText}
            >
            </WeightAdviceCard>

        </View>

        );

    }

    return(
        //Main Container View - 
        <View style={styles.container}>
            <MainHeader onBack={onBack} title="Predictive Flagging Engine"/>
            <ScrollView contentContainerStyle={styles.content_style}>{content}</ScrollView>
        </View>
    )
}


const styles = StyleSheet.create({
    //main container 
    container: {
        flex: 1, 
        backgroundColor:'#F9F7F3',
    },
    //content style
    content_style:{
        padding: 16
    },
    
    //Predictive flagging Analysis Card
    main_card:{
        backgroundColor: '#fff',
        borderRadius:12,
        borderWidth:1,
        borderColor: '#E8E4DC', 
        padding: 16,
    },

    //Title Style
    title:{
        fontSize: 16,
        fontWeight: '600',
        color: '#1B2B26',
        marginBottom:14,
    },

    //Row 
    row:{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },

    //Label 
    label: {
        width: 60,
        fontSize: 14,
        color:'#1B2B26',
    },

    //Badge
    badge:{
        paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12
    },

    //Text for badge 
    badgetext:{
        color:'#fff',
        fontSize: 12, 
        fontWeight: '600',
    },
    
    //Summary 
    summary: {
        fontSize: 14, 
        lineHeight: 20, 
        color: '#44524D',
    },
    
    //Error Message Style
    errormessage:{
        color:'#D32F2F',
        marginTop: 16
    },

})

