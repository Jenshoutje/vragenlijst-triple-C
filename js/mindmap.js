"use strict";

/** ============================= */
/** 1. Globale variabelen        */
/** ============================= */
let stopwoorden = new Set();             // Stopwoorden uit CSV
let thematischeData = {};                // { mainTheme: { subTheme: Set([...]) } }
let isCsvLoaded = false;                 // Controle of CSV is geladen
let woordContext = {};                   // Bewaart context per woord (zinnen)

/** ============================= */
/** 2. Functies                   */
/** ============================= */

/**
 * Laadt het CSV-bestand met thematische data en stopwoorden.
 * - Verwacht 4 kolommen per rij: (mainTheme, subTheme, kernwoorden, synoniemen)
 * - mainTheme === "stopwoorden" => woorden worden toegevoegd aan stopwoorden-set
 */
async function loadCSV() {
  try {
    const response = await fetch("data/thematische_analyse.csv");
    const text = await response.text();

    // Verwijder header-regel en splits op nieuwe regels
    const rows = text.split("\n").slice(1);

    rows.forEach(row => {
      // Splits rekening houdend met aanhalingstekens
      const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      if (columns.length >= 4) {
        const mainTheme = columns[0].trim();
        const subTheme  = columns[1].trim();

        // Verwijder omringende quotes en splits
        const kernwoorden = columns[2]
          .replace(/^"|"$/g, "")
          .split(",")
          .map(word => word.trim())
          .filter(Boolean);

        const synoniemen = columns[3]
          .replace(/^"|"$/g, "")
          .split(",")
          .map(word => word.trim())
          .filter(Boolean);

        // Verwerk data
        if (!mainTheme) return;  // Sla lege rijen over

        if (mainTheme.toLowerCase() === "stopwoorden") {
          // Deze woorden gaan in de stopwoorden-set
          kernwoorden.forEach(word => stopwoorden.add(word));
          synoniemen.forEach(word => stopwoorden.add(word));
        } else {
          // Thematische data
          if (!thematischeData[mainTheme]) {
            thematischeData[mainTheme] = {};
          }
          // Indien subTheme leeg is, geef een fallback
          const validSub = subTheme && subTheme.trim() ? subTheme : "Onbekend subthema";

          if (!thematischeData[mainTheme][validSub]) {
            thematischeData[mainTheme][validSub] = new Set();
          }
          kernwoorden.forEach(word => {
            if (word) thematischeData[mainTheme][validSub].add(word);
          });
          synoniemen.forEach(word => {
            if (word) thematischeData[mainTheme][validSub].add(word);
          });
        }
      }
    });

    isCsvLoaded = true;
    console.log("✅ CSV succesvol geladen:", thematischeData);

  } catch (error) {
    console.error("❌ Fout bij het laden van CSV:", error);
  }
}

/**
 * Verwijdert stopwoorden uit de invoerstring.
 * @param {string} text - De oorspronkelijke tekst.
 * @returns {string} - Tekst zonder stopwoorden.
 */
function filterStopwoorden(text) {
  if (!text) return "";
  // Bouw een regex met alle stopwoorden
  const regex = new RegExp("\\b(" + [...stopwoorden].join("|") + ")\\b", "gi");
  return text.replace(regex, "").trim();
}

/**
 * Analyseert de tekst op basis van de thematische data (mainTheme > subTheme > woord).
 * Bouwt clusters op en bewaart contextzinnen per woord in woordContext.
 * @param {string} text - De tekst zonder stopwoorden.
 * @returns {{clusters: object, woordContext: object}}
 */
function analyseZinnen(text) {
  const woorden = text.toLowerCase().split(/\s+/).filter(Boolean);
  const zinnen = text.split(".");
  const clusters = {};
  const woordToegewezen = {};

  // Initieer clusters met dezelfde structuur als thematischeData
  Object.keys(thematischeData).forEach(mainTheme => {
    if (mainTheme.toLowerCase() === "stopwoorden") return;
    clusters[mainTheme] = {};
    Object.keys(thematischeData[mainTheme]).forEach(subTheme => {
      clusters[mainTheme][subTheme] = [];
    });
  });

  // Doorloop elk woord en match met thematische data
  woorden.forEach(woord => {
    const cleanedWord = woord.trim();
    Object.keys(thematischeData).forEach(mainTheme => {
      if (mainTheme.toLowerCase() === "stopwoorden") return;
      Object.keys(thematischeData[mainTheme]).forEach(subTheme => {
        if (thematischeData[mainTheme][subTheme].has(cleanedWord)) {
          const compositeKey = `${mainTheme}||${subTheme}||${cleanedWord}`;
          if (!woordToegewezen[compositeKey]) {
            clusters[mainTheme][subTheme].push(cleanedWord);
            woordToegewezen[compositeKey] = true;

            // Bewaar contextzinnen voor het woord
            if (!woordContext[cleanedWord]) {
              woordContext[cleanedWord] = new Set();
            }
            zinnen.forEach(z => {
              if (z.toLowerCase().includes(cleanedWord)) {
                woordContext[cleanedWord].add(z.trim());
              }
            });
          }
        }
      });
    });
  });

  console.log("✅ Clusters na analyse:", clusters);
  return { clusters, woordContext };
}

/** 
 * Geeft een kleur terug op basis van de index van het hoofdthema.
 * @param {string} theme - Naam van het hoofdthema.
 * @returns {string} - Hexkleur.
 */
const kleuren = ["#FF9999", "#99FF99", "#66B2FF", "#FFD700", "#FFA07A"];
function getColorBySentiment(theme) {
  // Filter stopwoorden eruit
  const allThemes = Object.keys(thematischeData).filter(t => t.toLowerCase() !== "stopwoorden");
  const index = allThemes.indexOf(theme) % kleuren.length;
  return kleuren[index] || "#D3D3D3";
}

/**
 * Genereert een mindmap (GoJS Diagram) in een TreeLayout:
 * - "ROOT" is een dummy-knooppunt met tekst "Triple C implementatie"
 * - per hoofdthema en subthema wordt een node aangemaakt
 * - woorden hangen onder subthema
 * @param {{clusters: object, woordContext: object}} themesData - Analyse-resultaat.
 */
function generateMindmap(themesData) {
  const mindmapContainer = document.getElementById("mindmap");
  if (!mindmapContainer) {
    console.warn("⚠️ mindmap-container niet gevonden in HTML.");
    return;
  }

  // Verwijder oude diagram (indien aanwezig)
  const existingDiagram = go.Diagram.fromDiv("mindmap");
  if (existingDiagram) {
    existingDiagram.clear();
    existingDiagram.div = null;
  }

  const $ = go.GraphObject.make;
  const diagram = $(go.Diagram, "mindmap", {
    "undoManager.isEnabled": true,
    layout: $(go.TreeLayout, {
      angle: 90,
      layerSpacing: 100,
      nodeSpacing: 30,
      arrangement: go.TreeLayout.ArrangementVertical,
      alignment: go.TreeLayout.AlignmentCenter,
    }),
    initialContentAlignment: go.Spot.Center,
  });

  const nodeDataArray = [];
  const linkDataArray = [];

  // Voeg dummy root toe
  nodeDataArray.push({ key: "ROOT", text: "Triple C implementatie", color: "#FFFFFF" });

  const clusters = themesData?.clusters || {};

  // Hoofdthema's -> subthema's -> woorden
  Object.keys(clusters).forEach(mainTheme => {
    // Check of er in dit hoofdthema iets te vinden is
    let hasWords = false;
    for (let sub in clusters[mainTheme]) {
      if (clusters[mainTheme][sub].length > 0) {
        hasWords = true;
        break;
      }
    }
    if (!hasWords) return;

    const mainColor = getColorBySentiment(mainTheme) || "#FFF";
    nodeDataArray.push({
      key: mainTheme,
      text: mainTheme,
      color: mainColor
    });
    linkDataArray.push({ from: "ROOT", to: mainTheme });

    // Subthema's
    Object.keys(clusters[mainTheme]).forEach(subTheme => {
      const woorden = clusters[mainTheme][subTheme];
      if (!Array.isArray(woorden) || woorden.length === 0) return;

      // Gebruik samengestelde key
      const subKey = `${mainTheme}||${subTheme}`.trim();
      nodeDataArray.push({
        key: subKey,
        text: subTheme || "Onbekend subthema",
        color: "#EEEEEE"
      });
      linkDataArray.push({ from: mainTheme, to: subKey });

      // Woorden
      woorden.forEach(word => {
        if (!word) return;
        const wordKey = `${subKey}||${word}`.trim();
        nodeDataArray.push({
          key: wordKey,
          text: word,
          color: "#DDDDDD"
        });
        linkDataArray.push({ from: subKey, to: wordKey });
      });
    });
  });

  // Node-template
  diagram.nodeTemplate = $(
    go.Node,
    "Auto",
    {
      click: showContext, // Klik op node => showContext
      mouseEnter: (e, obj) => {
        const shape = obj.findObject("SHAPE");
        if (shape) shape.stroke = "#ff0000";
      },
      mouseLeave: (e, obj) => {
        const shape = obj.findObject("SHAPE");
        if (shape) shape.stroke = "#888";
      },
    },
    $(go.Shape, "RoundedRectangle",
      {
        name: "SHAPE",
        fill: "#f9f9f9",
        strokeWidth: 2,
        stroke: "#888",
        minSize: new go.Size(120, 50),
      },
      new go.Binding("fill", "color")
    ),
    $(go.TextBlock,
      {
        margin: 12,
        font: "bold 14px Arial",
        textAlign: "center",
        wrap: go.TextBlock.WrapFit,
        width: 120,
      },
      new go.Binding("text", "text")
    )
  );

  // Bouw het model
  diagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);

  // Toon container
  mindmapContainer.style.display = "block";

  console.log("✅ Mindmap gegenereerd:", { nodeDataArray, linkDataArray });
}

/**
 * Toont de contextzinnen van een woord in het element #contextDetails.
 * @param {MouseEvent} event - Het klik-event.
 * @param {GraphObject} obj - Het GoJS-node-object.
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
    contextText.innerHTML = `<strong>Geen context beschikbaar voor "${woord}".</strong>`;
  }
}

/** ============================= */
/** 3. DOMContentLoaded-setup     */
/** ============================= */
document.addEventListener("DOMContentLoaded", async () => {
  console.log("📌 mindmap.js geladen. Initialiseren...");

  // Referenties naar HTML-elementen
  const analyseButton   = document.getElementById("analyseButton");
  const exportButton    = document.getElementById("exportButton");
  const inputText       = document.getElementById("inputText");
  const mindmapContainer= document.getElementById("mindmap-container");

  if (!analyseButton || !exportButton || !inputText || !mindmapContainer) {
    console.error("❌ Belangrijke HTML-elementen ontbreken. Controleer je HTML.");
    return;
  }

  // 1. Laad CSV-data
  await loadCSV();
  if (!isCsvLoaded) {
    alert("⚠ CSV kon niet worden geladen. Probeer later opnieuw.");
    return;
  }

  // 2. Eventlistener voor 'Analyse'
  analyseButton.addEventListener("click", () => {
    const rawText = inputText.value.trim();
    if (!rawText) {
      alert("⚠ Voer eerst tekst in!");
      return;
    }

    // 2a. Filter stopwoorden
    const filtered = filterStopwoorden(rawText);

    // 2b. Analyseer
    const themes = analyseZinnen(filtered);

    // 2c. Check of er thema's gevonden zijn
    let hasThemes = false;
    for (let main in themes.clusters) {
      for (let sub in themes.clusters[main]) {
        if (themes.clusters[main][sub].length > 0) {
          hasThemes = true;
          break;
        }
      }
      if (hasThemes) break;
    }
    if (!hasThemes) {
      alert("⚠ Geen thema's gevonden in deze tekst. Probeer andere invoer.");
      return;
    }

    // 2d. Genereer mindmap
    generateMindmap(themes);
  });

  // 3. Eventlistener voor 'Exporteer als PNG'
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
});
