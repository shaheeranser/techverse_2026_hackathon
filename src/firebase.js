import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDGwg89E84AVq1z9tVDdzU3dr3z9h_YWa4",
  authDomain: "techeverse-f4089.firebaseapp.com",
  projectId: "techeverse-f4089",
  storageBucket: "techeverse-f4089.firebasestorage.app",
  messagingSenderId: "465946736368",
  appId: "1:465946736368:web:6219af27f946a22265f435",
  measurementId: "G-PX5Z4H5GHB",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();
export const storage = getStorage(app);
