import { generateFakeRestaurantsAndReviews } from "@/src/lib/fakeRestaurants.js";

import {
	collection,
	onSnapshot,
	query,
	getDocs,
	doc,
	getDoc,
	updateDoc,
	orderBy,
	Timestamp,
	runTransaction,
	where,
	addDoc,
	getFirestore,
} from "firebase/firestore";

import { db } from "@/src/lib/firebase/clientApp";

export async function updateRestaurantImageReference(
	restaurantId,
	publicImageUrl
) {
	const restaurantRef = doc(collection(db, "restaurants"), restaurantId);
	if (restaurantRef) {
		await updateDoc(restaurantRef, { photo: publicImageUrl });
	}
}

const updateWithRating = async (
	transaction,
	docRef,
	newRatingDocument,
	review
) => {
	const restaurant = await transaction.get(docRef);
	const data = restaurant.data();
	console.log("data: ", data);

	const newNumRatings = data?.numRatings ? data.numRatings + 1 : 1;
	const newSumRatings = (data?.sumRatings || 0) + Number(review.rating);
	const newAvgRating = newSumRatings / newNumRatings;

	transaction.update(docRef, {
		numRatings: newNumRatings,
		sumRatings: newSumRatings,
		avgRating: newAvgRating,
	});

	transaction.set(newRatingDocument, {
		...review,
		timestamp: Timestamp.fromDate(new Date()),
	});

};

export async function addReviewToRestaurant(db, restaurantId, review) {
	if (!restaurantId) {
		throw new Error("No restauran ID was provided");
	}

	if (!review) {
		throw new Error("A valid review has not been provided");
	}

	console.log("Adding review to restaurant: ", restaurantId);
	// console.log("Review: ", review);	

	// try {
		const docRef = doc(collection(db, "restaurants"), restaurantId);
		const newRatingDocument = doc(
			collection(db, `restaurants/${restaurantId}/ratings`)
		);

		console.log("docRef id: ", docRef.id);
		console.log("newRatingDocument id: ", newRatingDocument.id);

		await runTransaction(db, transaction => {
			return updateWithRating(transaction, docRef, newRatingDocument, review)
		});

	// } catch (error) {
	// 	console.error("Error adding review to restaurant: ", error);
	// 	throw error;
	// }
}

function applyQueryFilters(q, { category, city, price, sort }) {
	if (category) {
		q = query(q, where("category", "==", category));
	}

	if (city) {
		q = query(q, where("city", "==", city));
	}

	if (price) {
		q = query(q, where("price", "==", price.length));
	}

	if (sort === "Rating" || !sort) { 
		q = query(q, orderBy("avgRating", "desc"));
	} else if (sort === "Review") {
		q = query(q, orderBy("numRatings", "desc"));
	}

	return q;
}

export async function getRestaurants(db = db, filters = {}) {
	let q = query(collection(db, "restaurants"));
	const results = await getDocs(applyQueryFilters(q, filters));
	return results.docs.map(doc => {
		return {
			id: doc.id,
			...doc.data(),
			timestamp: doc.data().timestamp.toDate(),
		};
	});
}

export function getRestaurantsSnapshot(cb, filters = {}) {
	if (typeof cb !== "function") {
		console.log("Error: Callback is not a function");
		return;
	}
	
	let q = query(collection(db, "restaurants"));
	applyQueryFilters(q, filters);
	const unsubscribe = onSnapshot(q, querySnapshot => {
		const results = querySnapshot.docs.map(doc => {
			return {
				id: doc.id,
				...doc.data(),
				timestamp: doc.data().timestamp.toDate(),
			};
		});
		cb(results);
	});

	return unsubscribe;
}

export async function getRestaurantById(db, restaurantId) {
	if (!restaurantId) {
		console.log("Error: Invalid ID received: ", restaurantId);
		return;
	}
	const docRef = doc(db, "restaurants", restaurantId);
	const docSnap = await getDoc(docRef);
	// console.log("docSnap.data: ");
	// console.log(docSnap.data());
	return {
		...docSnap.data(),
		timestamp: docSnap.data().timestamp.toDate(),
	};
}

export function getRestaurantSnapshotById(restaurantId, cb) {
	if (!restaurantId) {
		console.log("Error: Invalid ID received: ", restaurantId);
		return;
	}

	if (typeof cb !== "function") {
		console.log("Error: Callback is not a function");
		return;
	}

	const docRef = doc(db, "restaurants", restaurantId);
	const unsubscribe = onSnapshot(docRef, docSnap => {
		cb({
			...docSnap.data(),
			timestamp: docSnap.data().timestamp.toDate(),
		});
	});
	return unsubscribe;

}

export async function getReviewsByRestaurantId(db, restaurantId) {
	if (!restaurantId) {
		console.log("Error: Invalid restaurantId received: ", restaurantId);
		return;
	}

	const q = query(
		collection(db, "restaurants", restaurantId, "ratings"),
		orderBy("timestamp", "desc")
	);

	const results = await getDocs(q);
	return results.docs.map(doc => {
		return {
			id: doc.id,
			...doc.data(),
			// Only plain objects can be passed to Client Components from Server Components
			timestamp: doc.data().timestamp.toDate(),
		};
	});
}

export function getReviewsSnapshotByRestaurantId(restaurantId, cb) {
	if (!restaurantId) {
		console.log("Error: Invalid restaurantId received: ", restaurantId);
		return;
	}

	const q = query(
		collection(db, "restaurants", restaurantId, "ratings"),
		orderBy("timestamp", "desc")
	);
	const unsubscribe = onSnapshot(q, querySnapshot => {
		const results = querySnapshot.docs.map(doc => {
			return {
				id: doc.id,
				...doc.data(),
				// Only plain objects can be passed to Client Components from Server Components
				timestamp: doc.data().timestamp.toDate(),
			};
		});
		cb(results);
	});
	return unsubscribe;
}

export async function addFakeRestaurantsAndReviews() {
	const data = await generateFakeRestaurantsAndReviews();
	for (const { restaurantData, ratingsData } of data) {
		try {
			const docRef = await addDoc(
				collection(db, "restaurants"),
				restaurantData
			);

			for (const ratingData of ratingsData) {
				await addDoc(
					collection(db, "restaurants", docRef.id, "ratings"),
					ratingData
				);
			}
		} catch (e) {
			console.log("There was an error adding the document");
			console.error("Error adding document: ", e);
		}
	}
}
