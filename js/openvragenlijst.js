import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-firestore.js";

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

// 1. Initialiseer Firebase
const app = initializeApp(firebaseConfig);

// 2. Haal Firestore-referentie op
const db = getFirestore(app);
console.log("✅ Firebase (v9) succesvol geïnitialiseerd!");

// 3. Wacht tot de DOM geladen is
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('openVragenForm');
  if (!form) return;

  // 4. Luister naar de submit van het formulier
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // voorkom herladen

    try {
      // Haal de values op uit de textareas
      const vraag1 = document.getElementById('vraag1').value.trim();
      const vraag1sub1 = document.getElementById('vraag1sub1').value.trim();
      const vraag1sub2 = document.getElementById('vraag1sub2').value.trim();
      const vraag1sub3 = document.getElementById('vraag1sub3').value.trim();

      const vraag2 = document.getElementById('vraag2').value.trim();
      const vraag2sub1 = document.getElementById('vraag2sub1').value.trim();
      const vraag2sub2 = document.getElementById('vraag2sub2').value.trim();
      const vraag2sub3 = document.getElementById('vraag2sub3').value.trim();

      const vraag3 = document.getElementById('vraag3').value.trim();
      const vraag3sub1 = document.getElementById('vraag3sub1').value.trim();
      const vraag3sub2 = document.getElementById('vraag3sub2').value.trim();
      const vraag3sub3 = document.getElementById('vraag3sub3').value.trim();

      // Bouw een object met alle antwoorden
      const antwoorden = {
        vraag1: {
          hoofdvraag: vraag1,
          sub1: vraag1sub1,
          sub2: vraag1sub2,
          sub3: vraag1sub3
        },
        vraag2: {
          hoofdvraag: vraag2,
          sub1: vraag2sub1,
          sub2: vraag2sub2,
          sub3: vraag2sub3
        },
        vraag3: {
          hoofdvraag: vraag3,
          sub1: vraag3sub1,
          sub2: vraag3sub2,
          sub3: vraag3sub3
        },
        timestamp: new Date() // voor datum/tijd van invullen
      };

      // 5. Sla de data op in Firestore (v9-syntax)
      // let docRef = await db.collection('openVragenResponses').add(antwoorden); // v8-syntax (niet meer geldig in v9)
      // v9-syntax: addDoc(collection(db, 'openVragenResponses'), data)
      await addDoc(collection(db, 'openVragenResponses'), antwoorden);

      // 6. Toon een succesmelding of wis het formulier
      alert("Bedankt voor uw bijdrage! Uw antwoorden zijn opgeslagen.");
      form.reset();

    } catch (err) {
      console.error("Fout bij het opslaan van antwoorden:", err);
      alert("Er is iets misgegaan. Probeer het later opnieuw.");
    }
  });
});
