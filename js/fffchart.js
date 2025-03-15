// fffchart.js (nieuwe modulaire Firebase v9 aanpak)

// 1. Importeer Firebase modulaire modules (zonder -compat)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

// 2. Firebase config & initialisatie (vervang de placeholders door uw eigen waarden)
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

// 3. Definieer de velden en de bijbehorende opties
const fields = [
  { name: "pictogram", label: "1. Pictogramstijl", optieA: "realistisch", optieB: "abstract" },
  { name: "emotie",    label: "2. Emotie-uitdrukking", optieA: "neutraal",     optieB: "expressief" },
  { name: "kleur",     label: "3. Kleurgebruik",     optieA: "monochroom",   optieB: "kleurgecodeerd" },
  { name: "tekst",     label: "4. Tekstgebruik",     optieA: "informatief",  optieB: "visueel" },
  { name: "directie",  label: "5. Directie uitleg",  optieA: "situatiegericht", optieB: "algemeen" },
  { name: "focus",     label: "6. Focus op",         optieA: "cliënt",       optieB: "begeleider" },
  { name: "video",     label: "7. Videostructuur",   optieA: "lineair",      optieB: "interactief" },
  { name: "implementatie", label: "8. Implementatie", optieA: "losse onderdelen", optieB: "geïntegreerd" },
  { name: "tempo",     label: "9. Tempo",            optieA: "vast",         optieB: "instelbaar" }
];

// 4. Data ophalen & aggregeren
async function fetchAndAggregateFFFResponses() {
  try {
    const querySnap = await getDocs(collection(db, "fff-bijeenkomstResponses"));
    const responses = [];
    querySnap.forEach(doc => {
      responses.push(doc.data());
    });

    const numQuestions = fields.length; // 9 vragen
    const countsA = Array(numQuestions).fill(0);
    const countsB = Array(numQuestions).fill(0);

    // Voor elke response: loop over de velden en tel de antwoorden
    responses.forEach(response => {
      fields.forEach((field, idx) => {
        const value = response[field.name];
        if (value && typeof value === "string") {
          const cleaned = value.trim().toLowerCase();
          if (cleaned === field.optieA.toLowerCase()) {
            countsA[idx]++;
          } else if (cleaned === field.optieB.toLowerCase()) {
            countsB[idx]++;
          }
        }
      });
    });

    console.log("Aggregated Data:", countsA, countsB);
    return { countsA, countsB };
  } catch (error) {
    console.error("Fout bij ophalen van FFF-responses:", error);
    return null;
  }
}

// 5. Chart.js aanmaken met de geaggregeerde data
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
      labels: labels,
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

// 6. Ruwe data weergeven in een <pre> element met id "rawDataContainer"
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

// 7. Zorg dat de chart en ruwe data worden gerenderd nadat de DOM volledig is geladen
document.addEventListener("DOMContentLoaded", () => {
  renderFFFChart();
  loadRawData();
});
