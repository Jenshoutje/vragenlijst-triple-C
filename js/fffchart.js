// fffchart.js

// 1. Importeer Firebase (compat) modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app-compat.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore-compat.js";

// 2. Firebase configuratie – vervang met uw eigen waarden
const firebaseConfig = {
   apiKey: "AIzaSyCWMYvuSm2vuq85Kr3LjeZ5NyJRHn8XnJs",
  authDomain: "ontwerpgerichtonderzoek.firebaseapp.com",
  projectId: "ontwerpgerichtonderzoek",
  storageBucket: "ontwerpgerichtonderzoek.firebasestorage.app",
  messagingSenderId: "1087936453818",
  appId: "1:1087936453818:web:9ec4f6c8b8cbcc503ff683",
  measurementId: "G-078FVL26HV"
};

// 3. Initialiseer Firebase en Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
console.log("✅ Firebase succesvol geïnitialiseerd!");

// 4. Data ophalen en aggregeren (FFF-bijeenkomst)
async function fetchAndAggregateFFFResponses() {
  try {
    // Haal alle documenten op uit de collectie "fff-bijeenkomstResponses"
    const querySnapshot = await getDocs(collection(db, "fff-bijeenkomstResponses"));
    const responses = [];
    querySnapshot.forEach(doc => {
      responses.push(doc.data());
    });

    const numQuestions = 9; // aantal vragen
    // arrays om aantal stemmen voor A en B per vraag bij te houden
    const countsA = Array(numQuestions).fill(0);
    const countsB = Array(numQuestions).fill(0);

    // Tel voor elke response de keuze A of B
    responses.forEach(response => {
      for (let i = 1; i <= numQuestions; i++) {
        const key = `question${i}`;  // "question1", "question2", ...
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

// 5. Chart.js renderen met de geaggregeerde data
async function renderFFFChart() {
  const aggregated = await fetchAndAggregateFFFResponses();
  if (!aggregated) return; // stop als er geen data is

  const { countsA, countsB } = aggregated;
  
  // labels voor de x-as
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

  // pak het canvas element met id="fffChart"
  const ctx = document.getElementById('fffChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: vragen,
      datasets: [
        {
          label: 'Optie A',
          data: countsA,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: 'Optie B',
          data: countsB,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
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
            text: 'Aantal stemmen'
          },
          ticks: {
            precision: 0
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Resultaten FFF-Bijeenkomst: Keuze per Vraag'
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

// 6. Ruwe data tonen in <pre id="rawDataContainer">
async function loadRawData() {
  try {
    const querySnapshot = await getDocs(collection(db, "fff-bijeenkomstResponses"));
    const rawData = [];
    querySnapshot.forEach(doc => {
      rawData.push({ id: doc.id, ...doc.data() });
    });
    const rawDataContainer = document.getElementById("rawDataContainer");
    if (rawDataContainer) {
      // toon de JSON data netjes met 2 spaties indent
      rawDataContainer.textContent = JSON.stringify(rawData, null, 2);
    }
  } catch (error) {
    console.error("Fout bij laden van ruwe data:", error);
  }
}

// 7. Voer alles uit als de DOM geladen is
document.addEventListener("DOMContentLoaded", () => {
  renderFFFChart();
  loadRawData();
});
