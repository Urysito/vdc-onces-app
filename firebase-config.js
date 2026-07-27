// firebase-config.js
//
// Rellena esto con la configuración de TU proyecto de Firebase (es gratis).
// Instrucciones paso a paso en README.md, sección "1. Crear el proyecto de Firebase".
//
// La sacas de: Firebase Console → ⚙️ Configuración del proyecto → General →
// "Tus apps" → app web → "Config" (el objeto firebaseConfig que te da).

const firebaseConfig = {
  apiKey: "AIzaSyASKd-88IbXgyXsKHhcP5GF0iJjHA76N14",
  authDomain: "vdc-onces.firebaseapp.com",
  projectId: "vdc-onces",
  storageBucket: "vdc-onces.firebasestorage.app",
  messagingSenderId: "686122571814",
  appId: "1:686122571814:web:82fd937b2c80cf35092ee7",
  measurementId: "G-Y6CWLR7PDT"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
