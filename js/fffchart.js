// fffchart.js (Firebase v9, modulaire aanpak)

// 1. Importeer Firebase-modulaire modules
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

// 3. Definieer de 9 vragen en hun bijbehorende opties
const fields = [
  { label: "1. Pictogramstijl",    A: "realistisch",    B: "abstract" },
  { label: "2. Emotie-uitdrukking", A: "neutraal",       B: "gebruik van expressie" },
  { label: "3. Kleurgebruik",       A: "monochroom",     B: "kleur gecodeerd" },
  { label: "4. Vorm van ondersteuning",       A: "Informatie voornamelijk als teskt",    B: "minder informatie als tekst, met visuele ondersteuning" },
  { label: "5. Scenario gevarieerde uitleg",    A: "situatie/client gerichte uitleg", B: "algemene richtlijnen" },
  { label: "6. Vraag beschrijving",           A: "focus op cliënt, cliënt in hoofdpersoon?",         B: "focus op cliënt, begeleider als hoofdpersoon?" },
  { label: "7. Videostructuur",     A: "lineair",        B: "interactief" },
  { label: "8. Implementatie",      A: "losse onderdelen", B: "geïntegreerd" },
  { label: "9. Tempo",              A: "vast",           B: "instelbaar" }
];

// 4. Haal de FFF-responses op uit Firestore en aggregeer de tellingen
async function fetchAndAggregateFFFResponses() {
  try {
    const querySnap = await getDocs(collection(db, "fff-bijeenkomstResponses"));
    const responses = [];
    querySnap.forEach(doc => {
      responses.push(doc.data());
    });
    console.log("🔎 Ontvangen documenten:", responses);

    const numQuestions = fields.length; // Verwacht 9 antwoorden
    const countsA = Array(numQuestions).fill(0);
    const countsB = Array(numQuestions).fill(0);

    responses.forEach((response, docIndex) => {
      const answers = response.antwoorden;
      if (!Array.isArray(answers)) {
        console.warn(`Document #${docIndex + 1} bevat geen 'antwoorden' array; overslaan.`);
        return;
      }
      answers.forEach((answer, idx) => {
        if (idx >= numQuestions) return; // Negeer extra items
        // Verwijder leestekens en extra spaties, en vergelijk case-insensitief
        const cleaned = answer.trim().toLowerCase().replace(/[.,!?]/g, "");
        const expectedA = fields[idx].A.toLowerCase().replace(/[.,!?]/g, "");
        const expectedB = fields[idx].B.toLowerCase().replace(/[.,!?]/g, "");
        if (cleaned === expectedA) {
          countsA[idx]++;
        } else if (cleaned === expectedB) {
          countsB[idx]++;
        } else {
          console.warn(`Geen match voor vraag ${idx + 1} in document #${docIndex + 1}, antwoord="${answer}" (cleaned="${cleaned}")`);
        }
      });
    });

    console.log("Aggregated Data => A:", countsA, "B:", countsB);
    return { countsA, countsB };
  } catch (error) {
    console.error("Fout bij ophalen van FFF-responses:", error);
    return null;
  }
}

// 5. Maak de Chart.js bar chart aan met de geaggregeerde data
async function renderFFFChart() {
  const aggregated = await fetchAndAggregateFFFResponses();
  if (!aggregated) return;

  const { countsA, countsB } = aggregated;
  const labels = fields.map(field => field.label);

  const canvasEl = document.getElementById("fffChart");
  if (!canvasEl) {
    console.warn("Geen #fffChart canvas gevonden in de HTML.");
    return;
  }
  const ctx = canvasEl.getContext("2d");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Optie A",
          data: countsA,
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1
        },
        {
          label: "Optie B",
          data: countsB,
          backgroundColor: "rgba(255, 99, 132, 0.6)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Aantal stemmen"
          },
          ticks: {
            precision: 0
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: "Resultaten FFF-Bijeenkomst: Keuze per Vraag"
        },
        tooltip: {
          callbacks: {
            label: context => `${context.dataset.label}: ${context.parsed.y} stemmen`
          }
        }
      }
    }
  });
}

// 6. Laad de ruwe data in een <pre> element met id "rawDataContainer"
async function loadRawData() {
  try {
    const querySnap = await getDocs(collection(db, "fff-bijeenkomstResponses"));
    const rawData = [];
    querySnap.forEach(doc => {
      rawData.push({ id: doc.id, ...doc.data() });
    });
    const rawDataContainer = document.getElementById("rawDataContainer");
    if (rawDataContainer) {
      rawDataContainer.textContent = JSON.stringify(rawData, null, 2);
    }
  } catch (error) {
    console.error("Fout bij laden van ruwe data:", error);
  }
}

// 7. Zodra de DOM volledig is geladen, render de chart en laad de ruwe data
document.addEventListener("DOMContentLoaded", () => {
  renderFFFChart();
  loadRawData();
});
