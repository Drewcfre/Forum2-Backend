import admin from "firebase-admin";
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    storageBucket: "replace-this",
});

export const bucket = admin.storage().bucket();
export const db = admin.firestore();
export const instanceStartTime: Date = new Date();
