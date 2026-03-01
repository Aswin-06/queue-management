// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAFcpoL2r8w1aMc73kkThhq4SbA8gkx_Mk",
  authDomain: "queue-d8af2.firebaseapp.com",
  projectId: "queue-d8af2",
  storageBucket: "queue-d8af2.firebasestorage.app",
  messagingSenderId: "505424201210",
  appId: "1:505424201210:web:ba82335aa0823fc4a3d043",
  measurementId: "G-MT60J3F594"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);