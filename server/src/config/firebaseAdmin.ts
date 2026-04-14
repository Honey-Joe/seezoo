import admin from "firebase-admin";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

// The private key in .env has real newlines (written as \n in the quoted string).
// dotenv preserves them correctly when the value is double-quoted.
// We also handle the case where they were stored as literal \\n sequences.
const rawKey = process.env.FIREBASE_PRIVATE_KEY ?? "";
const privateKey = rawKey.includes("\\n") ? rawKey.replace(/\\n/g, "\n") : rawKey;

if (!projectId || !clientEmail || !privateKey) {
  throw new Error(
    "Missing Firebase Admin env vars: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY"
  );
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export default admin;
