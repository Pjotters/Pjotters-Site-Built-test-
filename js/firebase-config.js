// Import the functions you need from the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyApAEcJkdI5zSNqMAB59qkWHlo94TmYXV0",
    authDomain: "pjotters-web-built.firebaseapp.com",
    projectId: "pjotters-web-built",
    storageBucket: "pjotters-web-built.firebasestorage.app",
    messagingSenderId: "18674980550",
    appId: "1:18674980550:web:89772acaa68091564569c7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider(); 