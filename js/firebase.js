// Firebase SDK importeren
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
    // Gegevens verzamelen uit het formulier
    const formData = {
        name: document.getElementById("name").value.trim() || "Anoniem",
        experience: document.getElementById("experience").value.trim(),
        tripleC: document.getElementById("tripleC").value.trim(),
        challenges: document.getElementById("challenges").value.trim(),
        improvements: document.getElementById("improvements").value.trim(),
        agreement: document.getElementById("agreement").value.trim(),
        additional: document.getElementById("additional").value.trim(),
        timestamp: new Date() // Timestamp toevoegen
    };

    try {
        // Gegevens opslaan in Firestore
        const docRef = await addDoc(collection(db, "surveyResponses"), formData);
        console.log("Document opgeslagen met ID:", docRef.id);
        alert("Bedankt voor je bijdrage! De gegevens zijn succesvol opgeslagen.");
        document.getElementById("surveyForm").reset(); // Reset het formulier
    } catch (error) {
        console.error("Fout bij opslaan:", error);
        alert("Er is een fout opgetreden bij het verzenden van de gegevens. Probeer het opnieuw.");
    }
}
