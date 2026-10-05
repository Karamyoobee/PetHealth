import {
    Host, DropdownMenu, DropdownMenuItem, Text as ComposeText, 
    RNHostView, 
} from '@expo/ui/jetpack-compose';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

//Dog and Cat Breeds
//15 Popular NZ Dog Breeds 
const Dog_Breeds = ['Labrador Retriever',
                    'Huntaway',
                    'Border Collie',
                    'New Zealand Heading Dog',
                    'Staffordshire Bull Terrier',
                    'Miniature Schnauzer',
                    'Jack Russell Terrier',
                    'German Shepherd',
                    'Golden Retriever',
                    'Fox Terrier',
                    'Cocker Spaniel',
                    'Shih Tzu',
                    'Rottweiler',
                    'Bichon Frise',
                    'Cavalier King Charles Spaniel'
                    ]

//15 Popular New Zealand Cat Breeds 
const Cat_Breeds = [
                'Domestic Shorthair',
                'Ragdoll',
                'Maine Coon',
                'Burmese',
                'British Shorthair',
                'Siamese',
                'Persian',
                'Devon Rex',
                'Sphynx',
                'Bengal',
                'Russian Blue',
                'Birman',
                'Abyssinian',
                'Norwegian Forest Cat',
                'Exotic Shorthair'
                ]

                
type Props = {
    species: 'dog' | 'cat';
    breed: string;
    onBreedChange: (b: string) => void;
}


export default function RNTriggerPetBreedDropdownmenu({species, breed, onBreedChange}: Props){
    const [isExpanded, setIsExpanded] = useState(false);

    const breeds = species ===  'dog' ? Dog_Breeds : Cat_Breeds ;

    //Map Dog Breed into a new Array - JSX nodes 
    const BreedList = breeds.map(dgbreed => 
        <DropdownMenuItem key={dgbreed} onClick={() => {onBreedChange(dgbreed); setIsExpanded(false)}}>
            <DropdownMenuItem.Text>
                    <ComposeText>
                        {dgbreed}
                    </ComposeText>
            </DropdownMenuItem.Text>
            </DropdownMenuItem>
    )
    //const CatList = Cat_Breeds.map(Cat_Breeds => {CatList} )
    //add species propos - dog/cat toggle from array to map

    return (

        <Host matchContents>
            <DropdownMenu
                expanded={isExpanded}
                onDismissRequest={() => setIsExpanded(false)}>
                    <DropdownMenu.Trigger>
                        <RNHostView matchContents>
                            <Pressable 
                                onPress={() => setIsExpanded(true)}
                                style={{
                                    alignSelf: 'flex-start',
                                    paddingHorizontal: 20, 
                                    paddingVertical: 15, 
                                    borderRadius: 8,
                                    backgroundColor: '#fff'
                                }}>
                               <Text style={{ color: 'black', fontWeight: '600'}}>
                                        {breed || 'Select Breed'} 
                               </Text>    
                            </Pressable>
                        </RNHostView>
                    </DropdownMenu.Trigger>
                <DropdownMenu.Items>
                    {BreedList} {/*Display Dog Breed List */}
                </DropdownMenu.Items>
            </DropdownMenu>
        </Host>
    )
}

