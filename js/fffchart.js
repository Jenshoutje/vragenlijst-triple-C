// Stel dat u de data al heeft verzameld en verwerkt naar bijvoorbeeld:
const vragen = ["1. Pictogramstijl", "2. Emotie-uitdrukking", "3. Kleurgebruik", "4. Tekstgebruik", "5. Directie uitleg", "6. Focus op", "7. Videostructuur", "8. Implementatie", "9. Tempo"];
const optieAData = [8, 6, 7, 9, 5, 6, 8, 7, 9, 6]; // aantal keer gekozen voor optie A per vraag
const optieBData = [2, 4, 3, 1, 5, 4, 2, 3, 1, 4]; // aantal keer gekozen voor optie B per vraag

const ctx = document.getElementById('fffChart').getContext('2d');
new Chart(ctx, {
  type: 'bar',
  data: {
    labels: vragen,
    datasets: [
      {
        label: 'Optie A',
        data: optieAData,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      },
      {
        label: 'Optie B',
        data: optieBData,
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }
    ]
  },
  options: {
    responsive: true,
    scales: {
      x: {
        stacked: false
      },
      y: {
        beginAtZero: true,
        stacked: false,
        max: 10
      }
    },
    plugins: {
      title: {
        display: true,
        text: 'Resultaten FFF-Bijeenkomst: Keuze per Vraag'
      },
      tooltip: {
        callbacks: {
          label: context => `${context.dataset.label}: ${context.parsed.y}`
        }
      }
    }
  }
});

// Zorg dat u Firebase al hebt geïnitialiseerd en een Firestore-referentie (db) heeft

// Importeer indien nodig de compat modules
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore-compat.js";

// Veronderstel dat 'db' al is geïnitialiseerd, bijvoorbeeld:
// const db = getFirestore(app);

async function loadRawData() {
  try {
    // Haal alle documenten op uit de collectie "fff-bijeenkomstResponses"
    const querySnapshot = await getDocs(collection(db, "fff-bijeenkomstResponses"));
    const rawData = [];
    querySnapshot.forEach(doc => {
      rawData.push({ id: doc.id, ...doc.data() });
    });
    // Plaats de ruwe data in het pre-element met id "rawDataContainer"
    const rawDataContainer = document.getElementById("rawDataContainer");
    if (rawDataContainer) {
      rawDataContainer.textContent = JSON.stringify(rawData, null, 2);
    }
  } catch (error) {
    console.error("Fout bij laden van ruwe data:", error);
  }
}

// Roep de functie aan zodra de DOM geladen is
document.addEventListener("DOMContentLoaded", () => {
  loadRawData();
});
