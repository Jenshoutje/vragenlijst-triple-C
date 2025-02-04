import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-firestore.js";

// Firebase configuratie
const firebaseConfig = {
    apiKey: "AIzaSy...", // Vervang door jouw API-key
    authDomain: "ontwerpgerichtonderzoek.firebaseapp.com",
    projectId: "ontwerpgerichtonderzoek",
    storageBucket: "ontwerpgerichtonderzoek.firebaseapp.com",
    messagingSenderId: "1087936453818",
    appId: "1:1087936453818:web:9ec4f6c8b8cbcc503ff683",
    measurementId: "G-078FVL26HV"
};

// Firebase initialiseren
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Functie om formuliergegevens op te slaan
export async function submitForm() {
    const formData = {
        name: document.getElementById("name").value || "Anoniem",
        experience: document.getElementById("experience").value,
        tripleC: document.getElementById("tripleC").value,
        challenges: document.getElementById("challenges").value,
        improvements: document.getElementById("improvements").value,
        agreement: document.getElementById("agreement").value,
        additional: document.getElementById("additional").value,
        timestamp: new Date()
    };

    try {
        const docRef = await addDoc(collection(db, "surveyResponses"), formData);
        console.log("Document opgeslagen met ID:", docRef.id);
        alert("Bedankt voor je bijdrage! De gegevens zijn succesvol opgeslagen.");
        document.getElementById("surveyForm").reset(); // Reset het formulier
    } catch (error) {
        console.error("Fout bij opslaan:", error);
        alert("Er is een fout opgetreden bij het verzenden van de gegevens.");
    }
}
