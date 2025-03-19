// timeline.js

document.addEventListener("DOMContentLoaded", () => {
  // 1. Definieer de timeline-items
  const timelineItems = new vis.DataSet([
    {
      id: 1,
      content: '<a href="discover.html#fly" target="_blank">Fly on the Wall</a>',
      start: '2024-07-01',
      group: 'Discover'
    },
    {
      id: 2,
      content: '<a href="discover.html#fff" target="_blank">FFF-Bijeenkomst</a>',
      start: '2024-07-10',
      group: 'Discover'
    },
    {
      id: 3,
      content: '<a href="discover.html#contextual" target="_blank">Contextual Interviews</a>',
      start: '2024-07-20',
      group: 'Discover'
    },
    {
      id: 4,
      content: '<a href="matrixchart.html" target="_blank">Decision Matrix</a>',
      start: '2024-08-01',
      group: 'Define'
    },
    {
      id: 5,
      content: '<a href="mindmapchart.html" target="_blank">Mindmap Chart</a>',
      start: '2024-08-10',
      group: 'Define'
    }
  ]);

  // 2. Definieer de groepen (fases)
  const timelineGroups = new vis.DataSet([
    { id: 'Discover', content: 'Discover fase' },
    { id: 'Define', content: 'Define fase' }
  ]);

  // 3. Selecteer de container in de HTML waar de tijdlijn moet komen
  const container = document.getElementById('timeline-container');
  if (!container) {
    console.error("Geen timeline-container gevonden in de HTML.");
    return;
  }

  // 4. Definieer opties voor de tijdlijn
  const options = {
    width: '100%',
    height: '300px',
    stack: true,
    groupOrder: 'content', // Sorteer groepen op inhoud
    editable: false,
    margin: {
      item: 20
    },
    selectable: true
  };

  // 5. Maak de tijdlijn aan
  const timeline = new vis.Timeline(container, timelineItems, timelineGroups, options);

  // Optioneel: Event listener voor wanneer een item wordt geselecteerd
  timeline.on('select', function (properties) {
    if (properties.items.length > 0) {
      const selectedItem = timelineItems.get(properties.items[0]);
      console.log("Geselecteerd item:", selectedItem.content);
      // Hier kun je eventueel extra acties ondernemen
    }
  });
});
