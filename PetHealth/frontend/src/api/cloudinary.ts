const CLOUD_NAME = 'hrwyyee6'; //Cloundinary Cloud Name
const UPLOAD_PRESET = 'pethealth_unsigned';//Cloudinary - Set to 'Unsigned'

//Function for uploadImagetoCloudinary (storing Image Uri) and 
export async function uploadImageToCloudinary(localUri: string): Promise<string> {
  const data = new FormData();//store data into a format of a form

  //store Data via through the User (selected image for pet profile avatar)
  data.append('file', {
    uri: localUri,
    name: 'pet.jpg',//image name set
    type: 'image/jpeg',//types accepted
  } as any);
  
  //'unsigned' upload preset
  data.append('upload_preset', UPLOAD_PRESET);

  //Image sent to be stored inside Cloundinary
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: data }
  );

  const json = await res.json();

  // Handle any errors for upload of images + Url for Image returned 
  if (!res.ok || !json.secure_url) {
    throw new Error(json?.error?.message || 'Image upload failed');
  }
  return json.secure_url;
}