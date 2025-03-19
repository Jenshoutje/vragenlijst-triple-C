document.addEventListener("DOMContentLoaded", function() {
  // Voorbeeld data: Pas dit aan op basis van jouw verslagdata
  var items = new vis.DataSet([
    { id: 1, content: 'Discover', start: '2025-01-01', title: 'Inleiding Discoverfase' },
    { id: 2, content: 'Define',   start: '2025-03-01', title: 'Uitvoering Definefase' },
    { id: 3, content: 'Develop',  start: '2025-05-01', title: 'Ontwikkeling en prototypes' },
    { id: 4, content: 'Deliver',  start: '2025-07-01', title: 'Implementatie en evaluatie' }
  ]);

  var container = document.getElementById('timeline');
  var options = {
    width: '100%',
    height: '200px',
    margin: {
      item: 20
    },
    selectable: true,
    clickToUse: true,
    showCurrentTime: true
  };

  // Maak de tijdlijn aan
  var timeline = new vis.Timeline(container, items, options);

  // Voeg een event listener toe: klik op een item leidt naar de bijbehorende pagina
  timeline.on('select', function(properties) {
    if (properties.items.length > 0) {
      var selectedId = properties.items[0];
      switch (selectedId) {
        case 1:
          window.location.href = 'discover.html';
          break;
        case 2:
          window.location.href = 'define.html';
          break;
        case 3:
          window.location.href = 'develop.html';
          break;
        case 4:
          window.location.href = 'deliver.html';
          break;
      }
    }
  });
});
