// exportOpenVragen.js

// 1. Importeer Firebase-modulaire modules (zonder -compat)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

// 2. Firebase configuratie & initialisatie
const firebaseConfig = {
  apiKey: "AIzaSyCWMYvuSm2vuq85Kr3LjeZ5NyJRHn8XnJs",
  authDomain: "ontwerpgerichtonderzoek.firebaseapp.com",
  projectId: "ontwerpgerichtonderzoek",
  storageBucket: "ontwerpgerichtonderzoek.firebasestorage.app",
  messagingSenderId: "1087936453818",
  appId: "1:1087936453818:web:9ec4f6c8b8cbcc503ff683",
  measurementId: "G-078FVL26HV"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
console.log("✅ Firebase (v9) succesvol geïnitialiseerd!");

// 3. Functie om open vragen antwoorden op te halen en te exporteren
async function exportOpenVragen() {
  try {
    // Haal alle documenten op uit de collectie 'openVragenResponses'
    const querySnap = await getDocs(collection(db, "openVragenResponses"));
    const responses = [];
    querySnap.forEach(doc => {
      responses.push(doc.data());
    });

    // Converteer de verzamelde data naar een JSON-string (met inspringing voor leesbaarheid)
    const dataStr = JSON.stringify(responses, null, 2);
    console.log("Geëxporteerde data:", dataStr);

    // Maak een blob aan van de JSON-string
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Maak een tijdelijke link en trigger een download
    const link = document.createElement("a");
    link.href = url;
    link.download = "openVragenExport.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error("Fout bij het exporteren van open vragen:", error);
  }
}

// 4. Zorg dat de exportfunctie wordt uitgevoerd wanneer de DOM geladen is
document.addEventListener("DOMContentLoaded", () => {
  const exportButton = document.getElementById("exportButton");
  if (exportButton) {
    exportButton.addEventListener("click", exportOpenVragen);
  } else {
    // Indien er geen knop is, kun je de functie ook automatisch aanroepen:
    // exportOpenVragen();
  }
});
