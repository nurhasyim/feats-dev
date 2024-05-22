"use server";

import { addReviewToRestaurant } from "@/src/lib/firebase/firestore.js";
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp.js";
import { getFirestore } from "firebase/firestore";

// This is a Server Action
// https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions
// Replace the function below
export async function handleReviewFormSubmission(data) {
    const { firebaseServerApp } = await getAuthenticatedAppForUser();
    const db = getFirestore(firebaseServerApp);
    // console.log("db", db.toJSON());
    console.log("data.restaurantId", data.get("restaurantId"));
    await addReviewToRestaurant(db, data.get("restaurantId"), {
        text: data.get("text"),
        rating: Number(data.get("rating")),
        userId: data.get("userId"),
    });
}
