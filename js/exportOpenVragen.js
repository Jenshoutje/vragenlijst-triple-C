"use strict";

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

/**
 * Exporteert de open vragen uit Firestore naar een platte-tekstbestand.
 * - We bouwen een menselijk leesbare tekst op (in plaats van JSON).
 * - Download eindigt als .txt.
 */
async function exportOpenVragenAsText() {
  try {
    // 1. Haal alle documenten op uit de collectie 'openVragenResponses'
    const querySnap = await getDocs(collection(db, "openVragenResponses"));
    const responses = [];
    querySnap.forEach(doc => {
      responses.push(doc.data());
    });

    if (responses.length === 0) {
      alert("Er zijn geen responses gevonden in 'openVragenResponses'.");
      return;
    }

    // 2. Bouw een leesbare tekst op
    //    - We gaan er hier vanuit dat jouw structuur van de antwoorden er als volgt uit ziet:
    //    {
    //       vraag1: { hoofdvraag: "...", sub1: "...", sub2: "...", sub3: "..." },
    //       vraag2: { ... },
    //       vraag3: { ... },
    //       timestamp: Date
    //    }
    //    Pas dit naar wens aan!

    const lines = [];
    responses.forEach((resp, index) => {
      lines.push(`=== Respons #${index + 1} ===`);
      lines.push(`Timestamp: ${resp.timestamp ? resp.timestamp : "Onbekend"}`);

      // === VRAAG 1 ===
      if (resp.vraag1) {
        lines.push("--- Vraag 1 ---");
        lines.push(`Hoofdvraag: ${resp.vraag1.hoofdvraag || ""}`);
        lines.push(`Sub 1: ${resp.vraag1.sub1 || ""}`);
        lines.push(`Sub 2: ${resp.vraag1.sub2 || ""}`);
        lines.push(`Sub 3: ${resp.vraag1.sub3 || ""}`);
      }

      // === VRAAG 2 ===
      if (resp.vraag2) {
        lines.push("--- Vraag 2 ---");
        lines.push(`Hoofdvraag: ${resp.vraag2.hoofdvraag || ""}`);
        lines.push(`Sub 1: ${resp.vraag2.sub1 || ""}`);
        lines.push(`Sub 2: ${resp.vraag2.sub2 || ""}`);
        lines.push(`Sub 3: ${resp.vraag2.sub3 || ""}`);
      }

      // === VRAAG 3 ===
      if (resp.vraag3) {
        lines.push("--- Vraag 3 ---");
        lines.push(`Hoofdvraag: ${resp.vraag3.hoofdvraag || ""}`);
        lines.push(`Sub 1: ${resp.vraag3.sub1 || ""}`);
        lines.push(`Sub 2: ${resp.vraag3.sub2 || ""}`);
        lines.push(`Sub 3: ${resp.vraag3.sub3 || ""}`);
      }

      // Voeg een extra lege regel toe voor leesbaarheid
      lines.push("");
    });

    // 3. Maak een grote tekststring van de lines
    const exportText = lines.join("\n");

    // 4. Maak een blob aan van deze platte tekst
    const blob = new Blob([exportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    // 5. Maak een tijdelijke link en trigger een download als "openVragenExport.txt"
    const link = document.createElement("a");
    link.href = url;
    link.download = "openVragenExport.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 6. Opruimen
    URL.revokeObjectURL(url);

    console.log("✅ Platte tekst-export aangemaakt:\n", exportText);
  } catch (error) {
    console.error("Fout bij het exporteren van open vragen:", error);
  }
}

// EventListener om de functie te triggeren (bijv. via een knop)
document.addEventListener("DOMContentLoaded", () => {
  const exportButton = document.getElementById("exportButton");
  if (exportButton) {
    exportButton.addEventListener("click", exportOpenVragenAsText);
  }
});
