import admin from "firebase-admin";
import path from "path";

// TODO: This cannot be safe.
const serviceAccountPath = path.resolve(__dirname, "./forum2-1134f-firebase-adminsdk-fbsvc-be6b303c52.json");
console.log("Loading service account from:", serviceAccountPath);

// TODO: Stop ESLint's temper tantrum at some point.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const serviceAccount = require(serviceAccountPath);

if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: "gs://forum2-1134f.firebasestorage.app",
        databaseURL: "https://forum2-1134f-default-rtdb.firebaseio.com/",
    });
}

export const bucket = admin.storage().bucket("forum2-1134f.firebasestorage.app");
export const db = admin.firestore();
export const realtime = admin.database();
export const instanceStartTime: Date = new Date();
