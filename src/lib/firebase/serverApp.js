// enforces that this code can only be called on the server
// https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#keeping-server-only-code-out-of-the-client-environment
import "server-only";

import { cookies, headers } from "next/headers";
import { initializeServerApp } from "firebase/app";

import { firebaseConfig } from "./config";
import { getAuth } from "firebase/auth";

export async function getAuthenticatedAppForUser() {
  // console.log('firebaseConfig', JSON.stringify(firebaseConfig));
  // console.log('headers', JSON.stringify(headers()));
  const idToken = headers().get("Authorization")?.split("Bearer ")[1];
  // const idToken = cookies().get("__session").value;

  console.log(`id token exist : ${idToken !== undefined}`);
  const firebaseServerApp = initializeServerApp(
    firebaseConfig,
    idToken
      ? {
          authIdToken: idToken,
        }
      : {}
  );

  // console.log('firebaseServerApp', firebaseServerApp);

  const auth = getAuth(firebaseServerApp);
  await auth.authStateReady();
  console.log('auth.currentUser exist : ', auth.currentUser !== null);

  return { firebaseServerApp, currentUser: auth.currentUser };
}