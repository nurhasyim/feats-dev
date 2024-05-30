import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

import { storage } from "@/src/lib/firebase/clientApp";

import { updateRestaurantImageReference } from "@/src/lib/firebase/firestore";

// Replace the two functions below
export async function updateRestaurantImage(restaurantId, image) {
    if (!restaurantId) 
        throw new Error("No restaurant ID was provided");
    if (!image)
        throw new Error("No image was provided");

    const publicImageUrl = await uploadImage(restaurantId, image);
    await updateRestaurantImageReference(restaurantId, publicImageUrl);
    return publicImageUrl;
}

async function uploadImage(restaurantId, image) {
    const filepath = `images/${restaurantId}/${image.name}`;
    const imageRef = ref(storage, filepath);
    await uploadBytesResumable(imageRef, image);
    return await getDownloadURL(imageRef);
}
// Replace the two functions above
