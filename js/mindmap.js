"use strict";

// Globale opslag
let stopwoorden = new Set();
let thematischeData = {}; // Structuur: { Thema: { Subthema: Set([...]) } }
let isCsvLoaded = false;

// CSV laden en verwerken
async function loadCSV() {
  try {
    const response = await fetch("data/thematische_analyse.csv");
    const text = await response.text();
    const rows = text.split("\n").slice(1); // Header overslaan

    rows.forEach(row => {
      // Splits de rij op komma's, rekening houdend met quotes
      const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      if (columns.length < 4) return; // Niet genoeg kolommen

      const thema = columns[0].trim();
      const subthema = columns[1].trim();
      const kernwoorden = columns[2].replace(/^"|"$/g, "").split(",").map(s => s.trim()).filter(Boolean);
      const synoniemen = columns[3].replace(/^"|"$/g, "").split(",").map(s => s.trim()).filter(Boolean);

      // Als thema 'stopwoorden' is, voeg toe aan de set
      if (thema.toLowerCase() === "stopwoorden") {
        kernwoorden.forEach(word => stopwoorden.add(word.toLowerCase()));
        synoniemen.forEach(word => stopwoorden.add(word.toLowerCase()));
      } else {
        // Voeg toe aan thematischeData
        if (!thematischeData[thema]) {
          thematischeData[thema] = {};
        }
        if (!thematischeData[thema][subthema]) {
          thematischeData[thema][subthema] = new Set();
        }
        kernwoorden.forEach(word => thematischeData[thema][subthema].add(word));
        synoniemen.forEach(word => thematischeData[thema][subthema].add(word));
      }
    });

    isCsvLoaded = true;
    console.log("✅ CSV succesvol geladen:", thematischeData);
  } catch (error) {
    console.error("❌ Fout bij het laden van CSV:", error);
  }
}

/**
 * Genereert een mindmap met GoJS in TreeLayout.
 * De structuur is: ROOT → Thema → Subthema → Woorden.
 */
function generateMindmap() {
  const mindmapContainer = document.getElementById("mindmap");
  if (!mindmapContainer) {
    console.error("Geen mindmap-container gevonden.");
    return;
  }

  // Verwijder eventueel bestaand diagram (om dubbele associaties te voorkomen)
  let existingDiagram = go.Diagram.fromDiv("mindmap");
  if (existingDiagram) {
    existingDiagram.clear();
    existingDiagram.div = null;
  }

  // GoJS shorthand
  let $ = go.GraphObject.make;

  // Maak diagram aan in de container "mindmap"
  let diagram = $(go.Diagram, "mindmap", {
    "undoManager.isEnabled": true,
    layout: $(go.TreeLayout, {
      angle: 0,               // Horizontale layout (van links naar rechts)
      layerSpacing: 80,       // Afstand tussen lagen
      nodeSpacing: 40,        // Afstand tussen knopen in dezelfde laag
      arrangement: go.TreeLayout.ArrangementFixedRoots,
      alignment: go.TreeLayout.AlignmentCenter,
    }),
    initialContentAlignment: go.Spot.Center,
    autoScale: go.Diagram.Uniform
  });

  // Bouw node- en linkdata arrays
  const nodeDataArray = [];
  const linkDataArray = [];

  // Dummy rootnode
  nodeDataArray.push({ key: "ROOT", text: "Triple C implementatie", color: "#FFFFFF" });

  // Itereer over thematischeData
  Object.keys(thematischeData).forEach(thema => {
    // Voeg hoofdthema toe als er minimaal één subthema met data is
    let subthemas = thematischeData[thema];
    let hasData = Object.values(subthemas).some(set => set.size > 0);
    if (!hasData) return;

    // Geef een kleur (eenvoudige kleurafwisseling, dit kun je later verfijnen)
    const themaColor = getThemeColor(thema);
    nodeDataArray.push({ key: thema, text: thema, color: themaColor });
    linkDataArray.push({ from: "ROOT", to: thema });

    // Voor elk subthema
    Object.keys(subthemas).forEach(subthema => {
      let woordenSet = subthemas[subthema];
      if (woordenSet.size === 0) return;
      let subKey = thema + "||" + subthema;
      nodeDataArray.push({ key: subKey, text: subthema, color: "#EEEEEE" });
      linkDataArray.push({ from: thema, to: subKey });

      // Voeg woorden toe
      woordenSet.forEach(woord => {
        if (woord) {
          let wordKey = subKey + "||" + woord;
          nodeDataArray.push({ key: wordKey, text: woord, color: "#DDDDDD" });
          linkDataArray.push({ from: subKey, to: wordKey });
        }
      });
    });
  });

  // Stel het node template in
  diagram.nodeTemplate = $(
    go.Node, "Auto",
    {
      click: function(e, node) {
        // Hier kun je extra functionaliteit toevoegen bij het klikken op een node
        console.log("Node geklikt:", node.data.text);
      },
      mouseEnter: (e, node) => { node.findObject("SHAPE").stroke = "#FF0000"; },
      mouseLeave: (e, node) => { node.findObject("SHAPE").stroke = "#888"; }
    },
    $(go.Shape, "RoundedRectangle", {
      name: "SHAPE",
      fill: "#f9f9f9",
      strokeWidth: 2,
      stroke: "#888",
      minSize: new go.Size(120, 50)
    }, new go.Binding("fill", "color")),
    $(go.TextBlock, {
      margin: 12,
      font: "bold 14px Arial",
      textAlign: "center",
      wrap: go.TextBlock.WrapFit,
      width: 120
    }, new go.Binding("text", "text"))
  );

  // Stel het model in
  diagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);
  mindmapContainer.style.display = "block";

  console.log("✅ Mindmap gegenereerd:", { nodeDataArray, linkDataArray });
}

/** Geeft een kleur op basis van de index van het thema */
function getThemeColor(thema) {
  const baseColors = ["#FF9999", "#99FF99", "#66B2FF", "#FFD700", "#FFA07A"];
  const themaLijst = Object.keys(thematischeData).filter(t => t.toLowerCase() !== "stopwoorden");
  const index = themaLijst.indexOf(thema);
  return baseColors[index % baseColors.length] || "#D3D3D3";
}

/** DOMContentLoaded setup: laad CSV en genereer mindmap */
document.addEventListener("DOMContentLoaded", async () => {
  console.log("📌 Mindmap.js geladen. Start initialisatie...");
  await loadCSV();
  if (!isCsvLoaded) {
    alert("⚠ CSV kon niet worden geladen. Probeer later opnieuw.");
    return;
  }
  generateMindmap();
});
