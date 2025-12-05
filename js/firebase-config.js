// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// ⚙️ Config officielle de ton projet DIGIYLYFE
const firebaseConfig = {
  apiKey: "AIzaSyBqEQWoE2iC7_rp-u4riilNVHolcP2o0B0",
  authDomain: "digiylyfe-ecosystem.firebaseapp.com",
  databaseURL: "https://digiylyfe-ecosystem-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "digiylyfe-ecosystem",
  storageBucket: "digiylyfe-ecosystem.firebasestorage.app",
  messagingSenderId: "1007962643384",
  appId: "1:1007962643384:web:20d26881e87f0dc37d0d4d"
};

// 🚀 Initialisation Firebase
const app = initializeApp(firebaseConfig);

// Expose proprement pour les autres scripts
export const db = getDatabase(app);
export const auth = getAuth(app);
