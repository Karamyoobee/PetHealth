import {
    Host, DropdownMenu, DropdownMenuItem, Text as ComposeText, 
    RNHostView, 
} from '@expo/ui/jetpack-compose';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

//Dog and Cat Breeds
//30 Popular NZ Dog Breeds 
const Dog_Breeds = ['Labrdaor Retreiver',
        'Staffordshire Bull Terrier',
        'Huntaway',
        'Border Collie',
        'Miniature Schanauzer',
        'Jack Rusell Terrier',
        'Shih Tzu',
        'German Shepherd',
        'New Zealand Heading Dog',
        'Golden Retriever',
        'Cavalier King Charles Spaniel',
        'Maltese',
        'American Staffordshire',
        'Bichon Frise',
        'Fox Terrier',
        'Toy Poodle',
        'Cavoodle',
        'Spoodle',
        'Labradoodle',
        'Beagle',
        'Cocker Spaniel',
        'Rottweiler',
        'Boxer',
        'Dachshund',
        'French Bulldog',
        'Pug',
        'Chihuahua',
        'Great Dane',
        'Weimaraner',
        'Dalmatian'
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
        'Norweigian Forest Cat',
        'Exostic Shorthair'
]


export default function RNTriggerPetBreedDropdownmenu(){
    const [isExpanded, setIsExpanded] = useState(false);
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
                                    Select Breed
                               </Text>    
                            </Pressable>
                        </RNHostView>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Items>
                        <DropdownMenuItem onClick={() => setIsExpanded(false)}>
                            <DropdownMenuItem.Text>
                                <ComposeText>
                                    Default
                                </ComposeText>
                            </DropdownMenuItem.Text>
                        </DropdownMenuItem>
                    </DropdownMenu.Items>
                    <DropdownMenu.Items>
                        <DropdownMenuItem onClick={() => setIsExpanded(false)}>
                            <DropdownMenuItem.Text>
                                <ComposeText>
                                    Default 2
                                </ComposeText>
                            </DropdownMenuItem.Text>
                        </DropdownMenuItem>
                    </DropdownMenu.Items>

            </DropdownMenu>
        </Host>
    )
}

//Add Seperate Styles below: 
