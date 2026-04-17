import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey:      import.meta.env.VITE_FIREBASE_API_KEY      as string,
  authDomain:  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN  as string,
  projectId:   import.meta.env.VITE_FIREBASE_PROJECT_ID   as string,
  appId:       import.meta.env.VITE_FIREBASE_APP_ID       as string,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL as string,
};

const app = initializeApp(firebaseConfig);

export const auth           = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db             = getDatabase(app);

googleProvider.setCustomParameters({ prompt: "select_account" });
