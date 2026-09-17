type Option<T> = {label: string; value: T};

type Props<T> = {
    options: Option<T>[];
    value: T;
    onChange: (v: T) => void;
};

export default function SegmentControl<T extends string>({
    options, value, onChange, 
}:Props<T>){
    return(
        //map options - Pressable pill section 
        //active pill = teal fill color / white text 
        //inactive pill = white bg, gray text, lighter border 
        null
    );
}

// Add Dog/Cat 

//Male / Female 

//Spaye / Intact 

