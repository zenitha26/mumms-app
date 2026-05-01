import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBXNb5J_DcukBR2qAZAs_sGDTkbIj6Zut8",
  authDomain: "st-benedicts-media-cloud.firebaseapp.com",
  projectId: "st-benedicts-media-cloud",
  storageBucket: "st-benedicts-media-cloud.firebasestorage.app",
  messagingSenderId: "100877715559",
  appId: "1:100877715559:web:a462676c4791b11af4acc2",
  measurementId: "G-1X9VWGJZEX",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app);
export default app;
