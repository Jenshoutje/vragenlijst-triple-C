// fffchart.js (nieuwe modulaire Firebase v9 aanpak)

// 1. Importeer Firebase modulaire modules (zonder -compat)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

// 2. Firebase config & initialisatie
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

// 3. Data ophalen & aggregeren
async function fetchAndAggregateFFFResponses() {
  try {
    const querySnap = await getDocs(collection(db, "fff-bijeenkomstResponses"));
    const responses = [];
    querySnap.forEach(doc => {
      responses.push(doc.data());
    });

    // We gaan uit van 9 vragen, question1..question9
    const numQuestions = 9;
    const countsA = Array(numQuestions).fill(0);
    const countsB = Array(numQuestions).fill(0);

    // Tel voor elke response hoeveel keer A en B is gekozen
    responses.forEach(response => {
      for (let i = 1; i <= numQuestions; i++) {
        const key = `question${i}`; // "question1", "question2", etc.
        const answer = response[key];
        if (answer && typeof answer === "string") {
          if (answer.toUpperCase() === "A") {
            countsA[i - 1]++;
          } else if (answer.toUpperCase() === "B") {
            countsB[i - 1]++;
          }
        }
      }
    });

    return { countsA, countsB };
  } catch (error) {
    console.error("Fout bij ophalen van FFF-responses:", error);
    return null;
  }
}

// 4. Chart.js aanmaken met de geaggregeerde data
async function renderFFFChart() {
  // Haal data op
  const aggregated = await fetchAndAggregateFFFResponses();
  if (!aggregated) return;

  const { countsA, countsB } = aggregated;

  // Labels voor de vragen
  const vragen = [
    "1. Pictogramstijl",
    "2. Emotie-uitdrukking",
    "3. Kleurgebruik",
    "4. Tekstgebruik",
    "5. Directie uitleg",
    "6. Focus op",
    "7. Videostructuur",
    "8. Implementatie",
    "9. Tempo"
  ];

  // Pak het canvas-element met id="fffChart"
  const canvasEl = document.getElementById("fffChart");
  if (!canvasEl) {
    console.warn("Geen #fffChart canvas gevonden in de HTML.");
    return;
  }
  const ctx = canvasEl.getContext("2d");

  // Maak de bar chart
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: vragen,
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

// 5. Ruwe data in <pre id="rawDataContainer">
async function loadRawData() {
  try {
    const snap = await getDocs(collection(db, "fff-bijeenkomstResponses"));
    const rawData = [];
    snap.forEach(doc => {
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

// 6. DOMContentLoaded: chart renderen + ruwe data
document.addEventListener("DOMContentLoaded", () => {
  renderFFFChart();
  loadRawData();
});
