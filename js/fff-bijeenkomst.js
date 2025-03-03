import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-firestore.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-database.js"; // Voeg deze regel toe

// Firebase configuratie
const firebaseConfig = {
  apiKey: "AIzaSyCWMYvuSm2vuq85Kr3LjeZ5NyJRHn8XnJs",
  authDomain: "ontwerpgerichtonderzoek.firebaseapp.com",
  projectId: "ontwerpgerichtonderzoek",
  storageBucket: "ontwerpgerichtonderzoek.firebasestorage.app",
  messagingSenderId: "1087936453818",
  appId: "1:1087936453818:web:9ec4f6c8b8cbcc503ff683",
  measurementId: "G-078FVL26HV"
};

// Initialiseer Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
console.log("✅ Firebase succesvol geïnitialiseerd!");

document.addEventListener('DOMContentLoaded', () => {
    const questions = document.querySelectorAll('.option');
    const nextButton = document.getElementById('nextQuestion');
    const questionCounter = document.querySelector('.question-counter');
    const backButton = document.getElementById('backButton');
    const submitButton = document.querySelector('.submit-button'); // Zorg ervoor dat deze correct is
    let currentQuestion = 0;
    let antwoorden = []; // Array om antwoorden op te slaan

    function updateQuestion() {
        questions.forEach((question, index) => {
            question.classList.toggle('active', index === currentQuestion);
        });
        questionCounter.textContent = `Vraag ${currentQuestion + 1}/10`;
        nextButton.disabled = currentQuestion === questions.length - 1;
    }

    nextButton.addEventListener('click', () => {
        if (currentQuestion < questions.length - 1) {
            currentQuestion++;
            updateQuestion();
        }
    });

    // Voeg functionaliteit toe aan de opties
    document.querySelectorAll('.option').forEach((option, index) => {
        option.addEventListener('click', () => {
            // Sla het antwoord op
            antwoorden[currentQuestion] = option.querySelector('.option-description').textContent; // Sla de tekst van de optie op
            if (currentQuestion < questions.length - 1) {
                currentQuestion++;
                updateQuestion();
            }
        });
    });

    // Terug knop functionaliteit
    backButton.addEventListener('click', () => {
        if (currentQuestion > 0) {
            currentQuestion--;
            updateQuestion();
        }
    });

    // Functie om antwoorden op te slaan in Firestore
    async function slaAntwoordenOp() {
        try {
            const docRef = await addDoc(collection(db, 'fff-bijeenkomstResponses'), {
                antwoorden: antwoorden
            });
            console.log("Antwoorden succesvol opgeslagen met ID:", docRef.id);
        } catch (error) {
            console.error("Fout bij het opslaan van antwoorden:", error);
        }
    }

    // Voeg een event listener toe voor het opslaan van antwoorden bij het voltooien van de quiz
    submitButton.addEventListener('click', () => {
        slaAntwoordenOp();
    });

    updateQuestion(); // Initialiseer de eerste vraag
});
