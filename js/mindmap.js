"use strict";

/** =============================
 *  1. GLOBALE VARIABELEN
 * ============================= */
let stopwoorden = new Set();
let thematischeData = {};  // { Thema: { Subthema: Set([...]) } }
let isCsvLoaded = false;
let woordContext = {};     // Bewaart contextzinnen per woord

/**
 * Normaliseert een woord: trim, lowercase en verwijdert niet-alfanumerieke tekens.
 * @param {string} word
 * @returns {string}
 */
function normalizeWord(word) {
  // De regex [^\p{L}\p{N}]+/gu verwijdert alle niet-letter/cijfer-tekens (Unicode).
  return word.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

/** =============================
 *  2. CSV LADEN & PARSEN
 * ============================= */
async function loadCSV() {
  try {
    const response = await fetch("data/thematische_analyse.csv");
    const text = await response.text();

    // Splits op nieuwe regels en sla de eerste (header) over
    const rows = text.split("\n").slice(1);

    rows.forEach(row => {
      // Houd rekening met aanhalingstekens via regex
      const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      if (cols.length < 4) return; // Onvolledige rij, overslaan

      const thema    = cols[0].trim();
      const subthema = cols[1].trim();

      // Kernwoorden
      const kernwoorden = cols[2]
        .replace(/^"|"$/g, "")
        .split(",")
        .map(normalizeWord)
        .filter(Boolean);

      // Synoniemen
      const synoniemen = cols[3]
        .replace(/^"|"$/g, "")
        .split(",")
        .map(normalizeWord)
        .filter(Boolean);

      // Stopwoorden?
      if (thema.toLowerCase() === "stopwoorden") {
        // Voeg alle woorden toe aan de stopwoorden-set
        kernwoorden.forEach(w => stopwoorden.add(w));
        synoniemen.forEach(w => stopwoorden.add(w));
      } else {
        // Thematische data
        if (!thematischeData[thema]) {
          thematischeData[thema] = {};
        }
        if (!thematischeData[thema][subthema]) {
          thematischeData[thema][subthema] = new Set();
        }
        // Voeg kernwoorden + synoniemen toe
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

/** =============================
 *  3. STOPWOORDEN FILTEREN
 * ============================= */
function filterStopwoorden(text) {
  // Splits de input op whitespace, normaliseer elk woord
  const woorden = text.split(/\s+/).map(normalizeWord).filter(Boolean);
  // Filter alle woorden die in de stopwoorden-set staan
  return woorden.filter(w => !stopwoorden.has(w));
}

/** =============================
 *  4. TEKST ANALYSEREN
 * ============================= */
/**
 * Bepaalt welke thematische clusters van toepassing zijn op basis van de gefilterde woorden.
 * @param {string[]} wordsArray - De woorden (zonder stopwoorden) uit de gebruikersinput
 * @param {string} originalText - De volledige onbewerkte tekst, voor context
 * @returns {{ clusters: object, woordContext: object }}
 */
function analyseTekst(wordsArray, originalText) {
  let clusters = {};
  // Splits de originele tekst in zinnen, voor context
  const zinnen = originalText.split(/[.!?]/).map(z => z.trim()).filter(Boolean);

  // Initialiseert clusters met dezelfde structuur als thematischeData
  Object.keys(thematischeData).forEach(thema => {
    if (thema.toLowerCase() === "stopwoorden") return;
    clusters[thema] = {};
    Object.keys(thematischeData[thema]).forEach(sub => {
      clusters[thema][sub] = [];
    });
  });

  // Doorloop elk woord in de invoer
  wordsArray.forEach(word => {
    // Kijk of het in thematischeData staat
    Object.keys(thematischeData).forEach(thema => {
      if (thema.toLowerCase() === "stopwoorden") return;
      Object.keys(thematischeData[thema]).forEach(sub => {
        if (thematischeData[thema][sub].has(word)) {
          clusters[thema][sub].push(word);

          // Bewaar context: alle zinnen waarin dit woord voorkomt
          if (!woordContext[word]) {
            woordContext[word] = new Set();
          }
          zinnen.forEach(z => {
            // Normaliseer de zin om beter te kunnen matchen
            const normZin = normalizeWord(z);
            if (normZin.includes(word)) {
              woordContext[word].add(z);
            }
          });
        }
      });
    });
  });

  console.log("✅ Thema's na analyse:", clusters);
  return { clusters, woordContext };
}

/** =============================
 *  5. MINDMAP GENEREREN (RadialLayout)
 * ============================= */
function generateMindmap(themesData) {
  const mindmapDiv = document.getElementById("mindmap");
  if (!mindmapDiv) {
    console.error("❌ Geen mindmap-container gevonden.");
    return;
  }

  // Verwijder oud diagram (indien aanwezig)
  const oldDiagram = go.Diagram.fromDiv("mindmap");
  if (oldDiagram) {
    oldDiagram.clear();
    oldDiagram.div = null;
  }

  // GoJS shorthand
  const $ = go.GraphObject.make;

  // Maak nieuw Diagram
  const diagram = $(go.Diagram, "mindmap",
    {
      initialContentAlignment: go.Spot.Center,
      "undoManager.isEnabled": true,
      autoScale: go.Diagram.Uniform,   // Past automatisch de schaal aan
      // We zetten de layout later op RadialLayout
    }
  );

  // Gebogen linksjabloon
  diagram.linkTemplate = $(
    go.Link,
    {
      curve: go.Link.Bezier,
      adjusting: go.Link.Stretch,
      corner: 10
    },
    $(go.Shape, { strokeWidth: 2, stroke: "#888" }),
    $(go.Shape, { toArrow: "Standard", stroke: null, fill: "#888" })
  );

  // Node + link data
  const nodeDataArray = [];
  const linkDataArray = [];

  // Root
  nodeDataArray.push({
    key: "ROOT",
    text: "Triple C implementatie",
    color: "#FFFFFF"
  });

  // Doorloop de clusters en bouw de hiërarchie
  Object.keys(themesData.clusters).forEach(thema => {
    const subthemas = themesData.clusters[thema];
    // Check of er minstens één subthema met woorden is
    const hasData = Object.values(subthemas).some(arr => arr.length > 0);
    if (!hasData) return;

    // Hoofdthema
    const themaColor = getThemeColor(thema);
    nodeDataArray.push({ key: thema, text: thema, color: themaColor });
    linkDataArray.push({ from: "ROOT", to: thema });

    // Subthema's
    Object.keys(subthemas).forEach(sub => {
      const woorden = subthemas[sub];
      if (!woorden || woorden.length === 0) return;

      const subKey = `${thema}||${sub}`;
      nodeDataArray.push({ key: subKey, text: sub, color: "#EEEEEE" });
      linkDataArray.push({ from: thema, to: subKey });

      // Woorden
      const uniqueWords = [...new Set(woorden)];
      uniqueWords.forEach(word => {
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
      mouseEnter: (e, node) => { node.findObject("SHAPE").stroke = "#FF0000"; },
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

  // Stel het model in
  diagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);

  // Gebruik RadialLayout
  diagram.layout = $(go.RadialLayout, {
    maxLayers: 6,
    layerThickness: 120,
    angleIncrement: 20,
    rotateNode: false
  });

  // Root in het midden zetten na de initiële layout
  diagram.addDiagramListener("InitialLayoutCompleted", e => {
    const rootnode = diagram.findNodeForKey("ROOT");
    if (rootnode) {
      const radial = diagram.layout;
      if (radial instanceof go.RadialLayout) {
        radial.root = rootnode;
        diagram.layoutDiagram(true);
      }
    }
  });

  mindmapDiv.style.display = "block";
  console.log("✅ Radiale Mindmap gegenereerd:", { nodeDataArray, linkDataArray });
}

/** =============================
 *  6. KLEUR FUNCTIE
 * ============================= */
function getThemeColor(thema) {
  const baseColors = [
    "#FF9999", "#99FF99", "#66B2FF",
    "#FFD700", "#FFA07A", "#B19CD9", "#90EE90"
  ];
  const themaList = Object.keys(thematischeData).filter(t => t.toLowerCase() !== "stopwoorden");
  const idx = themaList.indexOf(thema);
  return baseColors[idx % baseColors.length] || "#D3D3D3";
}

/** =============================
 *  7. CONTEXT WEERGEVEN
 * ============================= */
function showContext(event, obj) {
  if (!obj || !obj.part || !obj.part.data) return;
  const woord = obj.part.data.text;
  const detailsDiv = document.getElementById("contextDetails");
  const contextText = document.getElementById("contextText");

  if (woordContext[woord]) {
    detailsDiv.style.display = "block";
    contextText.innerHTML = `<strong>Context van "${woord}":</strong><br>` + [...woordContext[woord]].join("<br>");
  } else {
    detailsDiv.style.display = "block";
    contextText.innerHTML = `<strong>Geen context beschikbaar voor "${woord}".</strong>`;
  }
}

/** =============================
 *  8. DOMContentLoaded
 * ============================= */
document.addEventListener("DOMContentLoaded", async () => {
  console.log("📌 mindmap.js (RadialLayout) geladen...");

  // Laad CSV
  await loadCSV();
  if (!isCsvLoaded) {
    alert("⚠ CSV kon niet worden geladen. Probeer later opnieuw.");
    return;
  }

  // Knoppen
  const analyseButton = document.getElementById("analyseButton");
  const exportButton = document.getElementById("exportButton");
  const inputText = document.getElementById("inputText");

  if (analyseButton && inputText) {
    analyseButton.addEventListener("click", () => {
      const userInput = inputText.value.trim();
      if (!userInput) {
        alert("⚠ Voer eerst tekst in om te analyseren.");
        return;
      }
      // Filter stopwoorden
      const wordsArray = filterStopwoorden(userInput);
      // Analyseer tekst
      const themes = analyseTekst(wordsArray, userInput);
      // Genereer de mindmap
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
