// decisionmatrix.js

fetch('data/decisionmatrixresponses.json')
  .then(response => response.json())
  .then(data => {
    // Definieer knelpuntlabels en criteria
    const knelpuntLabels = ["Knelpunt 1", "Knelpunt 2", "Knelpunt 3", "Knelpunt 4", "Knelpunt 5"];
    const criteria = ["effectiviteit", "haalbaarheid", "clientwelzijn", "urgentie"];

    // Initialiseer totalen per knelpunt en criterium
    const totals = {
      knelpunt1: { effectiviteit: 0, haalbaarheid: 0, clientwelzijn: 0, urgentie: 0 },
      knelpunt2: { effectiviteit: 0, haalbaarheid: 0, clientwelzijn: 0, urgentie: 0 },
      knelpunt3: { effectiviteit: 0, haalbaarheid: 0, clientwelzijn: 0, urgentie: 0 },
      knelpunt4: { effectiviteit: 0, haalbaarheid: 0, clientwelzijn: 0, urgentie: 0 },
      knelpunt5: { effectiviteit: 0, haalbaarheid: 0, clientwelzijn: 0, urgentie: 0 }
    };

    const count = data.length;

    // Bereken totalen
    data.forEach(item => {
      for (let i = 1; i <= 5; i++) {
        const key = "knelpunt" + i;
        criteria.forEach(criterion => {
          totals[key][criterion] += parseInt(item[key][criterion], 10);
        });
      }
    });

    // Bereken gemiddelden en rond af op 2 decimalen
    const averages = {};
    for (let i = 1; i <= 5; i++) {
      const key = "knelpunt" + i;
      averages[key] = {};
      criteria.forEach(criterion => {
        averages[key][criterion] = parseFloat((totals[key][criterion] / count).toFixed(2));
      });
    }

    // Maak datasets voor de chart, één per criterium
    const datasets = criteria.map(criterion => {
      // Definieer kleuren per criterium
      const colors = {
        effectiviteit: 'rgba(106, 53, 193, 0.6)',
        haalbaarheid: 'rgba(255, 159, 64, 0.6)',
        clientwelzijn: 'rgba(75, 192, 192, 0.6)',
        urgentie: 'rgba(255, 99, 132, 0.6)'
      };
      const borderColors = {
        effectiviteit: 'rgba(106, 53, 193, 1)',
        haalbaarheid: 'rgba(255, 159, 64, 1)',
        clientwelzijn: 'rgba(75, 192, 192, 1)',
        urgentie: 'rgba(255, 99, 132, 1)'
      };

      // Voor elk knelpunt, haal de gemiddelde score op voor dit criterium
      const dataArr = [];
      for (let i = 1; i <= 5; i++) {
        const key = "knelpunt" + i;
        dataArr.push(averages[key][criterion]);
      }

      return {
        label: criterion.charAt(0).toUpperCase() + criterion.slice(1),
        data: dataArr,
        backgroundColor: colors[criterion],
        borderColor: borderColors[criterion],
        borderWidth: 1
      };
    });

    // Maak de Chart.js grouped bar chart
    const ctx = document.getElementById('decisionChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: knelpuntLabels,
        datasets: datasets
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          title: {
            display: true,
            text: 'Gemiddelde Scores per Knelpunt'
          },
          tooltip: {
            callbacks: {
              label: context => `${context.dataset.label}: ${context.parsed.y}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 5
          }
        }
      }
    });
  })
  .catch(error => console.error('Fout bij het laden van JSON-data:', error));
