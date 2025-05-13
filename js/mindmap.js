"use strict";

/** =========================
 *  1. GLOBALE VARIABELEN
 * ========================= */
let stopwoorden = new Set();
let thematischeData = {};  // { Thema: { Subthema: Set([...]) } }
let isCsvLoaded = false;
let woordContext = {};     // Bewaart contextzinnen per woord

/**
 * Normaliseert een woord: trim, lowercase en verwijdert leestekens.
 * @param {string} word
 * @returns {string}
 */
function normalizeWord(word) {
  return word.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

/** =========================
 *  2. CSV LADEN & PARSEN
 * ========================= */
async function loadCSV() {
  try {
    const response = await fetch("data/thematische_analyse.csv");
    const text = await response.text();
    // Verdeel in regels en sla de header over
    const rows = text.split("\n").slice(1);
    
    rows.forEach(row => {
      // Splits rekening houdend met aanhalingstekens
      const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      if (cols.length < 4) return; // Onvolledige rij, overslaan

      const thema    = cols[0].trim();
      const subthema = cols[1].trim();
      const kernwoorden = cols[2]
        .replace(/^"|"$/g, "")
        .split(",")
        .map(normalizeWord)
        .filter(Boolean);
      const synoniemen = cols[3]
        .replace(/^"|"$/g, "")
        .split(",")
        .map(normalizeWord)
        .filter(Boolean);
      
      // Als thema "stopwoorden" is, voeg toe aan set
      if (thema.toLowerCase() === "stopwoorden") {
        kernwoorden.forEach(w => stopwoorden.add(w));
        synoniemen.forEach(w => stopwoorden.add(w));
      } else {
        if (!thematischeData[thema]) {
          thematischeData[thema] = {};
        }
        if (!thematischeData[thema][subthema]) {
          thematischeData[thema][subthema] = new Set();
        }
        kernwoorden.forEach(w => thematischeData[thema][subthema].add(w));
        synoniemen.forEach(w => thematischeData[thema][subthema].add(w));
      }
    });
    
    isCsvLoaded = true;
    console.log("✅ CSV succesvol geladen:", thematischeData);
  } catch (error) {
    console.error("❌ Fout bij het laden van CSV:", error);
  }
}

/** =========================
 *  3. STOPWOORDEN FILTEREN
 * ========================= */
function filterStopwoorden(text) {
  const woorden = text.split(/\s+/).map(normalizeWord).filter(Boolean);
  return woorden.filter(w => !stopwoorden.has(w));
}

/** =========================
 *  4. TEKST ANALYSEREN
 * ========================= */
function analyseTekst(wordsArray, originalText) {
  let clusters = {};
  // Splits originele tekst in zinnen voor context
  const zinnen = originalText.split(/[.!?]/).map(z => z.trim()).filter(Boolean);

  // Initialiseer clusters met dezelfde structuur
  Object.keys(thematischeData).forEach(thema => {
    if (thema.toLowerCase() === "stopwoorden") return;
    clusters[thema] = {};
    Object.keys(thematischeData[thema]).forEach(sub => {
      clusters[thema][sub] = [];
    });
  });

  // Doorloop elk woord en match met thematische data
  wordsArray.forEach(word => {
    Object.keys(thematischeData).forEach(thema => {
      if (thema.toLowerCase() === "stopwoorden") return;
      Object.keys(thematischeData[thema]).forEach(sub => {
        if (thematischeData[thema][sub].has(word)) {
          clusters[thema][sub].push(word);

          // Context opslaan
       if (!woordContext[word]) {
            woordContext[word] = { zinnen: new Set(), frequentie: 0 };
          }
          zinnen.forEach(z => {
            if (normalizeWord(z).includes(word)) {
              woordContext[word].zinnen.add(z);
              woordContext[word].frequentie += 1;
            }
          });
        }
      });
    });
  });

  console.log("✅ Thema's na analyse:", clusters);
  return { clusters, woordContext };
}

/** =========================
 *  5. MINDMAP (RadialLayout)
 * ========================= */
function generateMindmap(themesData) {
  const mindmapDiv = document.getElementById("mindmap");
  if (!mindmapDiv) {
    console.error("❌ Geen mindmap-container gevonden.");
    return;
  }

  // Oude diagram opruimen
  let oldDiagram = go.Diagram.fromDiv("mindmap");
  if (oldDiagram) {
    oldDiagram.clear();
    oldDiagram.div = null;
  }

  let $ = go.GraphObject.make;
  let diagram = $(go.Diagram, "mindmap", {
    initialContentAlignment: go.Spot.Center,
    "undoManager.isEnabled": true,
    autoScale: go.Diagram.Uniform,
    // We stellen later de layout in op RadialLayout
  });

  // Voor mooiere, gebogen lijnen:
  diagram.linkTemplate = $(
    go.Link,
    {
      curve: go.Link.Bezier,
      adjusting: go.Link.Stretch,
      // evt. routing: go.Link.AvoidsNodes,
      corner: 10
    },
    $(go.Shape, { strokeWidth: 2, stroke: "#888" }),
    $(go.Shape, { toArrow: "Standard", stroke: null, fill: "#888" })
  );

  let nodeDataArray = [];
  let linkDataArray = [];

  // Root
  nodeDataArray.push({
    key: "ROOT",
    text: "Triple C implementatie",
    color: "#ffffff",
    isRoot: true // Markeer als root-node
  });

  // Themas -> subthemas -> woorden
  Object.keys(themesData.clusters).forEach(thema => {
    const subthemas = themesData.clusters[thema];
    // Check of er data is
    let hasData = Object.values(subthemas).some(arr => arr.length > 0);
    if (!hasData) return;

    const themaColor = getThemeColor(thema);
    nodeDataArray.push({ key: thema, text: thema, color: themaColor });
    linkDataArray.push({ from: "ROOT", to: thema });

    Object.keys(subthemas).forEach(sub => {
      const woorden = subthemas[sub];
      if (!woorden || woorden.length === 0) return;
      const subKey = `${thema}||${sub}`;
      nodeDataArray.push({ key: subKey, text: sub, color: "#EEEEEE" });
      linkDataArray.push({ from: thema, to: subKey });

      // Unieke woorden
      const uniqueWords = [...new Set(woorden)];
      uniqueWords.forEach(word => {
        if (!word) return;
        const wordKey = `${subKey}||${word}`;
        nodeDataArray.push({ key: wordKey, text: word, color: "#DDDDDD" });
        linkDataArray.push({ from: subKey, to: wordKey });
      });
    });
  });

  // Node template
  diagram.nodeTemplate = $(
    go.Node,
    "Auto",
    {
      click: showContext,
      mouseEnter: (e, node) => { node.findObject("SHAPE").stroke = "#ff0000"; },
      mouseLeave: (e, node) => { node.findObject("SHAPE").stroke = "#888"; }
    },
    $(
      go.Shape,
      "RoundedRectangle",
      {
        name: "SHAPE",
        fill: "#f9f9f9",
        stroke: "#888",
        strokeWidth: 2,
        minSize: new go.Size(120, 50)
      },
      new go.Binding("fill", "color")
    ),
    $(
      go.TextBlock,
      {
        margin: 12,
        font: "bold 14px Arial",
        textAlign: "center",
        wrap: go.TextBlock.WrapFit,
        width: 120
      },
      new go.Binding("text", "text")
    )
  );

  // Model instellen
  diagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);


  // ** Stel RadialLayout in **
  diagram.layout = $(go.RadialLayout, {
    maxLayers: 6,             // Aantal ringen dat we willen toestaan
    layerThickness: 120,      // Afstand tussen de ringen
    angleIncrement: 20,       // Minimale hoek tussen twee takken
    rotateNode: false,        // De node-text niet meedraaien
    // 'center' node bepalen in 'InitialLayoutCompleted' event:
  });

  // Zodra de layout klaar is, stellen we "ROOT" als echte centerNode in:
  diagram.addDiagramListener("InitialLayoutCompleted", e => {
    let rootnode = diagram.findNodeForKey("ROOT");
    if (rootnode) {
      let radial = diagram.layout;
      if (radial instanceof go.RadialLayout) {
        radial.root = rootnode; // Forceer root in het midden
        diagram.layoutDiagram(true);
      }
    }
  });

  mindmapDiv.style.display = "block";
  console.log("✅ Radiale Mindmap gegenereerd:", { nodeDataArray, linkDataArray });
}

/** =========================
 *  6. KLEUR FUNCTIE
 * ========================= */
function getThemeColor(thema) {
  const baseColors = [
    "#FF9999","#99FF99","#66B2FF",
    "#FFD700","#FFA07A","#B19CD9","#90EE90"
  ];
  const themaList = Object.keys(thematischeData).filter(t => t.toLowerCase() !== "stopwoorden");
  const idx = themaList.indexOf(thema);
  return baseColors[idx % baseColors.length] || "#D3D3D3";
}

/** =========================
 *  7. CONTEXT WEERGEVEN
 * ========================= */
function showContext(event, obj) {
  if (!obj || !obj.part || !obj.part.data) return;
  const woord = obj.part.data.text;
  const detailsDiv = document.getElementById("contextDetails");
  const contextText = document.getElementById("contextText");

  const contextInfo = woordContext[woord]; // << Haal object met zinnen + frequentie op

  if (contextInfo) {
    detailsDiv.style.display = "block";
    contextText.innerHTML = `
      <strong>Context van "${woord}":</strong><br>
      <em>Aantal voorkomens: ${contextInfo.frequentie} keer</em><br><br>
      ${[...contextInfo.zinnen].join("<br>")}
    `;
  } else {
    detailsDiv.style.display = "block";
    contextText.innerHTML = `<strong>Geen context beschikbaar voor "${woord}".</strong>`;
  }
}

/** =========================
 *  8. DOMContentLoaded
 * ========================= */
document.addEventListener("DOMContentLoaded", async () => {
  console.log("📌 mindmap.js (RadialLayout) geladen. Start initialisatie...");

  await loadCSV();
  if (!isCsvLoaded) {
    alert("⚠ CSV kon niet worden geladen. Probeer later opnieuw.");
    return;
  }

  const analyseButton = document.getElementById("generateButton");
  const exportButton = document.getElementById("exportButton");
  const inputText = document.getElementById("inputText");

  if (analyseButton && inputText) {
    analyseButton.addEventListener("click", () => {
      const userInput = inputText.value.trim();
      if (!userInput) {
        alert("⚠ Voer eerst tekst in om te analyseren.");
        return;
      }
      // Stopwoorden filteren
      const wordsArray = filterStopwoorden(userInput);
      // Analyseer tekst
      const themes = analyseTekst(wordsArray, userInput);
      // Genereer radiale mindmap
      generateMindmap(themes);
    });
  }

  if (exportButton) {
    exportButton.addEventListener("click", () => {
      const diagram = go.Diagram.fromDiv("mindmap");
      if (!diagram) {
        console.error("❌ Mindmap-diagram niet gevonden.");
        return;
      }
      const imgData = diagram.makeImageData({ background: "white" });
      const a = document.createElement("a");
      a.href = imgData;
      a.download = "mindmap.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  }


});
