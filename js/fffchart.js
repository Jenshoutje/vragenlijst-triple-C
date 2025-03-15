

// Functie om de FFF-responses uit Firebase op te halen en te aggregeren
async function fetchAndAggregateFFFResponses() {
  try {
    const querySnapshot = await getDocs(collection(db, "fff-bijeenkomstResponses"));
    const responses = [];
    querySnapshot.forEach(doc => {
      responses.push(doc.data());
    });

    const numQuestions = 9;
    // Maak twee arrays met 9 elementen (vragen 1 tot en met 9), voor optie A en optie B
    const countsA = Array(numQuestions).fill(0);
    const countsB = Array(numQuestions).fill(0);

    responses.forEach(response => {
      for (let i = 1; i <= numQuestions; i++) {
        const key = `question${i}`;
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

// Functie om de Chart.js grouped bar chart te renderen met dynamische data
async function renderFFFChart() {
  const aggregated = await fetchAndAggregateFFFResponses();
  if (!aggregated) return;
  
  const { countsA, countsB } = aggregated;
  
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

// Functie om ruwe data op te halen en weer te geven in een <pre> element
async function loadRawData() {
  try {
    const querySnapshot = await getDocs(collection(db, "fff-bijeenkomstResponses"));
    const rawData = [];
    querySnapshot.forEach(doc => {
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

// Zorg dat alle functies worden uitgevoerd nadat de DOM volledig is geladen
document.addEventListener("DOMContentLoaded", () => {
  renderFFFChart();
  loadRawData();
});
