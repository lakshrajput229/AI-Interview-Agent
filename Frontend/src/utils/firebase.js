import {getAuth, GoogleAuthProvider} from "firebase/auth"
import { initializeApp } from "firebase/app";


const firebaseConfig = {
  apiKey:import.meta.env.VITE_FIREBASE_APIKEY ,
  authDomain: "interviewiq-56ba8.firebaseapp.com",
  projectId: "interviewiq-56ba8",
  storageBucket: "interviewiq-56ba8.firebasestorage.app",
  messagingSenderId: "249629224084",
  appId: "1:249629224084:web:666e18401d48f49f0f1881"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app)

const provider = new GoogleAuthProvider()

export {auth , provider}