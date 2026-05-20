import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAu2f_5j5iIR8xTPskopmGIzMfYk8jysB0",
  authDomain: "gym-system-3e6d3.firebaseapp.com",
  projectId: "gym-system-3e6d3",
  storageBucket: "gym-system-3e6d3.firebasestorage.app",
  messagingSenderId: "723376112699",
  appId: "1:723376112699:web:16167afcddda6f1428c81e",
  measurementId: "G-624PDCBTCX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

export { app, analytics, auth, db };
