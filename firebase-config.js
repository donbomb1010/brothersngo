import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyD7ZYOhV0oIpgH8ni446_zkTmhEiQwiqVg",
    authDomain: "movie1-be42f.firebaseapp.com",
    projectId: "movie1-be42f",
    storageBucket: "movie1-be42f.firebasestorage.app",
    messagingSenderId: "779722235172",
    appId: "1:779722235172:web:b7e4be979979f10463e7b1",
    measurementId: "G-XT1KB52R15"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { db, app, analytics };
