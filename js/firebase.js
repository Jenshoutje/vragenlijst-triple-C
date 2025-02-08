// Firebase SDK importeren
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-firestore.js";

// Firebase configuratie
const firebaseConfig = {
    apiKey: "AIzaSy...", // Vervang door jouw API-key
    authDomain: "ontwerpgerichtonderzoek.firebaseapp.com",
    projectId: "ontwerpgerichtonderzoek",
    storageBucket: "ontwerpgerichtonderzoek.appspot.com",
    messagingSenderId: "1087936453818",
    appId: "1:1087936453818:web:9ec4f6c8b8cbcc503ff683",
    measurementId: "G-078FVL26HV"
};

// Firebase initialiseren
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ **Functie om de vragenlijst (survey) op te slaan**
export async function submitSurveyForm() {
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
        // Gegevens opslaan in Firestore onder 'surveyResponses'
        const docRef = await addDoc(collection(db, "surveyResponses"), formData);
        console.log("Survey opgeslagen met ID:", docRef.id);
        alert("Bedankt voor je bijdrage! De gegevens zijn succesvol opgeslagen.");
        document.getElementById("surveyForm").reset(); // Reset het formulier
    } catch (error) {
        console.error("Fout bij opslaan:", error);
        alert("Er is een fout opgetreden bij het verzenden van de gegevens. Probeer het opnieuw.");
    }
}

// ✅ **Functie om de Decision Matrix op te slaan**
export async function submitDecisionMatrixForm() {
    // Decision Matrix formulier ophalen
    const form = document.getElementById("decision-matrix-form");

    // Gegevens verzamelen uit de matrix
    const matrixData = {
        knelpunt1: {
            effectiviteit: form.knelpunt1_effectiviteit.value,
            haalbaarheid: form.knelpunt1_haalbaarheid.value,
            impact: form.knelpunt1_clientwelzijn.value,
            urgentie: form.knelpunt1_urgentie.value
        },
        knelpunt2: {
            effectiviteit: form.knelpunt2_effectiviteit.value,
            haalbaarheid: form.knelpunt2_haalbaarheid.value,
            impact: form.knelpunt2_clientwelzijn.value,
            urgentie: form.knelpunt2_urgentie.value
        },
        knelpunt3: {
            effectiviteit: form.knelpunt3_effectiviteit.value,
            haalbaarheid: form.knelpunt3_haalbaarheid.value,
            impact: form.knelpunt3_clientwelzijn.value,
            urgentie: form.knelpunt3_urgentie.value
        },
        timestamp: new Date().toISOString()
    };

    try {
        // Gegevens opslaan in Firestore onder 'decisionMatrixResponses'
        const docRef = await addDoc(collection(db, "decisionMatrixResponses"), matrixData);
        console.log("Decision Matrix opgeslagen met ID:", docRef.id);
        alert("Bedankt! Jouw Decision Matrix is succesvol opgeslagen.");
        form.reset(); // Reset het formulier na verzenden
    } catch (error) {
        console.error("Fout bij opslaan:", error);
        alert("Er is iets misgegaan. Probeer het opnieuw.");
    }
}
