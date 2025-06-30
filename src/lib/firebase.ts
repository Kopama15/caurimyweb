// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBMIEkzVXLK94kUmeT0Zs5k6CXzE4_7vZw",
  authDomain: "myweb-693e2.firebaseapp.com",
  projectId: "myweb-693e2",
  storageBucket: "myweb-693e2.appspot.com", // ✅ fixed here
  messagingSenderId: "393721178863",
  appId: "1:393721178863:web:86af6f363f66b82848891a",
  measurementId: "G-E5TC31P4JX",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };