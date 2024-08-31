// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";


const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.Auth_Domain,
  projectId: process.env.Project_Id ,
  storageBucket:  process.env.Storage_Bucket,
  messagingSenderId: process.env.Messaging_Sender_Id ,
  appId:  process.env.APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);