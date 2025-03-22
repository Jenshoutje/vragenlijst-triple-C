"use strict";

/** =========================
 *  1. GLOBALE VARIABELEN
 * ========================= */
let stopwoorden = new Set();
let thematischeData = {};  // Structuur: { Thema: { Subthema: Set([...]) } }
let isCsvLoaded = false;
let woordContext = {};      // Bewaart contextzinnen per woord

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
      if (cols.length < 4) return; // Als er minder dan 4 kolommen zijn, sla deze regel over

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
      
      // Als thema "stopwoorden" is, voeg deze toe aan de stopwoorden-set
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
/**
 * Filtert de stopwoorden uit de tekst en retourneert een array van genormaliseerde woorden.
 * @param {string} text
 * @returns {string[]}
 */
function filterStopwoorden(text) {
  const woorden = text.split(/\s+/).map(normalizeWord).filter(Boolean);
  return woorden.filter(w => !stopwoorden.has(w));
}

/** =========================
 *  4. TEKST ANALYSEREN
 * ========================= */
/**
 * Analyseert de tekst en bouwt thematische clusters op.
 * @param {string[]} wordsArray - Array van woorden uit de gebruikersinput (stopwoorden gefilterd)
 * @param {string} originalText - De originele tekst voor context
 * @returns {{ clusters: object, woordContext: object }}
 */
function analyseTekst(wordsArray, originalText) {
  let clusters = {};
  // Splits de originele tekst in zinnen voor context
  const zinnen = originalText.split(/[.!?]/).map(z => z.trim()).filter(Boolean);
  
  // Initialiseert clusters met dezelfde structuur als thematischeData
  Object.keys(thematischeData).forEach(thema => {
    if (thema.toLowerCase() === "stopwoorden") return;
    clusters[thema] = {};
    Object.keys(thematischeData[thema]).forEach(sub => {
      clusters[thema][sub] = [];
    });
  });

  // Doorloop elke word in de input en match met thematischeData
  wordsArray.forEach(word => {
    Object.keys(thematischeData).forEach(thema => {
      if (thema.toLowerCase() === "stopwoorden") return;
      Object.keys(thematischeData[thema]).forEach(sub => {
        if (thematischeData[thema][sub].has(word)) {
          clusters[thema][sub].push(word);
          // Bewaar context: voeg zinnen toe waarin het woord voorkomt
          if (!woordContext[word]) {
            woordContext[word] = new Set();
          }
          zinnen.forEach(z => {
            if (normalizeWord(z).includes(word)) {
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

/** =========================
 *  5. MINDMAP GENEREREN (ForceDirectedLayout)
 * ========================= */
/**
 * Genereert een mindmap met GoJS in een force-directed layout.
 * Structuur: ROOT → Thema → Subthema → Woorden
 * @param {{clusters: object}} themesData
 */
function generateMindmap(themesData) {
  const mindmapDiv = document.getElementById("mindmap");
  if (!mindmapDiv) {
    console.error("❌ Geen mindmap-container gevonden.");
    return;
  }

  // Verwijder eventueel bestaand diagram om dubbele associaties te voorkomen
  let oldDiagram = go.Diagram.fromDiv("mindmap");
  if (oldDiagram) {
    oldDiagram.clear();
    oldDiagram.div = null;
  }

  let $ = go.GraphObject.make;
  let diagram = $(go.Diagram, "mindmap", {
    initialContentAlignment: go.Spot.Center,
    "undoManager.isEnabled": true,
    layout: $(go.ForceDirectedLayout, {
      defaultSpringLength: 100,
      defaultElectricalCharge: 100
    }),
    autoScale: go.Diagram.Uniform
  });

  let nodeDataArray = [];
  let linkDataArray = [];

  // Voeg een dummy rootnode toe
  nodeDataArray.push({ key: "ROOT", text: "Triple C implementatie", color: "#ffffff" });

  // Bouw de hiërarchie: Thema → Subthema → Woorden
  Object.keys(themesData.clusters).forEach(thema => {
    let subthemas = themesData.clusters[thema];
    // Alleen toevoegen als er minstens één subthema met woorden is
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

      // Voeg de unieke woorden toe
      const uniqueWords = [...new Set(woorden)];
      uniqueWords.forEach(word => {
        if (!word) return;
        const wordKey = `${subKey}||${word}`;
        nodeDataArray.push({ key: wordKey, text: word, color: "#DDDDDD" });
        linkDataArray.push({ from: subKey, to: wordKey });
      });
    });
  });

  // Node template: afgeronde rechthoeken met tekst
  diagram.nodeTemplate = $(
    go.Node, "Auto",
    {
      click: showContext,
      mouseEnter: (e, node) => { node.findObject("SHAPE").stroke = "#ff0000"; },
      mouseLeave: (e, node) => { node.findObject("SHAPE").stroke = "#888"; }
    },
    $(go.Shape, "RoundedRectangle", {
      name: "SHAPE",
      fill: "#f9f9f9",
      stroke: "#888",
      strokeWidth: 2,
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
  mindmapDiv.style.display = "block";
  console.log("✅ Mindmap gegenereerd:", { nodeDataArray, linkDataArray });
}

/** =========================
 *  6. KLEUR FUNCTIE
 * ========================= */
/**
 * Geeft een kleur op basis van de index van het thema.
 * @param {string} thema
 * @returns {string}
 */
function getThemeColor(thema) {
  const baseColors = ["#FF9999", "#99FF99", "#66B2FF", "#FFD700", "#FFA07A", "#B19CD9", "#90EE90"];
  const themaList = Object.keys(thematischeData).filter(t => t.toLowerCase() !== "stopwoorden");
  const idx = themaList.indexOf(thema);
  return baseColors[idx % baseColors.length] || "#D3D3D3";
}

/** =========================
 *  7. CONTEXT WEERGEVEN
 * ========================= */
/**
 * Toont de context van een woord in het element #contextDetails.
 */
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

/** =========================
 *  8. DOMContentLoaded-SETUP
 * ========================= */
document.addEventListener("DOMContentLoaded", async () => {
  console.log("📌 mindmap.js geladen. Start initialisatie...");
  await loadCSV();
  if (!isCsvLoaded) {
    alert("⚠ CSV kon niet worden geladen. Probeer later opnieuw.");
    return;
  }

  // Koppel de analyseknop
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
      // Filter stopwoorden en verkrijg array van woorden
      const wordsArray = filterStopwoorden(userInput);
      // Analyseer tekst op basis van thematischeData en verkrijg clusters
      const themes = analyseTekst(wordsArray, userInput);
      // Genereer de mindmap met de verkregen thema's
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
