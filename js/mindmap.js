"use strict";

/** Globale opslag voor stopwoorden en thematische data **/
let stopwoorden = new Set();
let thematischeData = {};  // Structuur: { mainTheme: { subTheme: Set([...]) } }
let isCsvLoaded = false;   // Controle of CSV is geladen
let woordContext = {};     // Bewaart context per woord (Set met zinnen)

/** CSV inlezen en thematische data opbouwen **/
async function loadCSV() {
  try {
    const response = await fetch("data/thematische_analyse.csv");
    const text = await response.text();
    // Verwijder de headerregel en splits in rijen
    const rows = text.split("\n").slice(1);
    rows.forEach(row => {
      // Splits op komma's buiten aanhalingstekens
      const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      if (columns.length >= 4) {
        const mainTheme = columns[0].trim();
        const subTheme  = columns[1].trim();
        const kernwoorden = columns[2].replace(/^"|"$/g, "").split(",").map(word => word.trim()).filter(Boolean);
        const synoniemen = columns[3].replace(/^"|"$/g, "").split(",").map(word => word.trim()).filter(Boolean);

        if (mainTheme.toLowerCase() === "stopwoorden") {
          kernwoorden.forEach(word => stopwoorden.add(word));
          synoniemen.forEach(word => stopwoorden.add(word));
        } else {
          if (!thematischeData[mainTheme]) {
            thematischeData[mainTheme] = {};
          }
          if (!thematischeData[mainTheme][subTheme]) {
            thematischeData[mainTheme][subTheme] = new Set();
          }
          kernwoorden.forEach(word => thematischeData[mainTheme][subTheme].add(word));
          synoniemen.forEach(word => thematischeData[mainTheme][subTheme].add(word));
        }
      }
    });
    isCsvLoaded = true;
    console.log("✅ CSV succesvol geladen:", thematischeData);
  } catch (error) {
    console.error("❌ Fout bij het laden van CSV:", error);
  }
}

/** Stopwoorden filteren **/
function filterStopwoorden(text) {
  const regex = new RegExp("\\b(" + [...stopwoorden].join("|") + ")\\b", "gi");
  return text.replace(regex, "").trim();
}

/** Thematische analyse: bouw clusters en verzamel context **/
function analyseZinnen(text) {
  const woorden = text.toLowerCase().split(/\s+/);
  const zinnen = text.split(".");
  const clusters = {};
  const woordToegewezen = {};

  // Initialiseert clusters op basis van thematischeData
  Object.keys(thematischeData).forEach(mainTheme => {
    clusters[mainTheme] = {};
    Object.keys(thematischeData[mainTheme]).forEach(subTheme => {
      clusters[mainTheme][subTheme] = [];
    });
  });

  woorden.forEach(woord => {
    const cleanedWord = woord.trim();
    Object.keys(thematischeData).forEach(mainTheme => {
      Object.keys(thematischeData[mainTheme]).forEach(subTheme => {
        if (thematischeData[mainTheme][subTheme].has(cleanedWord)) {
          const compositeKey = `${mainTheme}||${subTheme}||${cleanedWord}`;
          if (!woordToegewezen[compositeKey]) {
            clusters[mainTheme][subTheme].push(cleanedWord);
            woordToegewezen[compositeKey] = true;
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

/** Toewijzen van kleuren aan hoofdthema's **/
const kleuren = ["#FF9999", "#99FF99", "#66B2FF", "#FFD700", "#FFA07A"];
function getColorBySentiment(theme) {
  const allThemes = Object.keys(thematischeData).filter(t => t.toLowerCase() !== "stopwoorden");
  const index = allThemes.indexOf(theme) % kleuren.length;
  return kleuren[index] || "#D3D3D3";
}

/** Genereer mindmap met GoJS in TreeLayout **/
function generateMindmap(themesData) {
  const mindmapContainer = document.getElementById("mindmap");
  if (!mindmapContainer) return;

  const clusters = themesData?.clusters || {};

  // Als er al een diagram gekoppeld is aan de div, verwijder deze dan eerst
  const existingDiagram = go.Diagram.fromDiv("mindmap");
  if (existingDiagram) {
    existingDiagram.clear();
    existingDiagram.div = null;  // Zorgt ervoor dat oude diagram niet blijft hangen
  }

  const $ = go.GraphObject.make;
  const diagram = $(go.Diagram, "mindmap", {
    "undoManager.isEnabled": true,
    layout: $(go.TreeLayout, {
      angle: 90,
      layerSpacing: 80,
      nodeSpacing: 40,
      arrangement: go.TreeLayout.ArrangementFixedRoots,
      alignment: go.TreeLayout.AlignmentCenter,
    }),
    initialContentAlignment: go.Spot.Center,
    autoScale: go.Diagram.Uniform,
  });

  const nodeDataArray = [];
  const linkDataArray = [];

  // Voeg een dummy root-node toe
  nodeDataArray.push({ key: "ROOT", text: "Triple C implementatie", color: "#ffffff" });

  // Bouw hiërarchische structuur: mainTheme > subTheme > woord
  Object.keys(clusters).forEach(mainTheme => {
    // Alleen toevoegen als er in dit thema daadwerkelijk woorden zitten
    let hasWords = false;
    Object.keys(clusters[mainTheme]).forEach(subTheme => {
      if (clusters[mainTheme][subTheme].length > 0) {
        hasWords = true;
      }
    });
    if (!hasWords) return;

    const mainColor = getColorBySentiment(mainTheme);
    nodeDataArray.push({ key: mainTheme, text: mainTheme, color: mainColor });
    linkDataArray.push({ from: "ROOT", to: mainTheme });

    // Voeg per subthema de woorden toe
    Object.keys(clusters[mainTheme]).forEach(subTheme => {
      const words = clusters[mainTheme][subTheme];
      if (!words || words.length === 0) return;
      const subKey = `${mainTheme}||${subTheme}`;
      nodeDataArray.push({ key: subKey, text: subTheme, color: "#EEEEEE" });
      linkDataArray.push({ from: mainTheme, to: subKey });
      words.forEach(word => {
        if (!word.trim()) return;
        const wordKey = `${subKey}||${word}`;
        nodeDataArray.push({ key: wordKey, text: word, color: "#DDDDDD" });
        linkDataArray.push({ from: subKey, to: wordKey });
      });
    });
  });

  // Definieer de node-template met klikbare knoppen voor context
  diagram.nodeTemplate = $(
    go.Node, "Auto",
    {
      click: showContext,
      mouseEnter: (e, obj) => { obj.findObject("SHAPE").stroke = "#ff0000"; },
      mouseLeave: (e, obj) => { obj.findObject("SHAPE").stroke = "#888"; }
    },
    $(go.Shape, "RoundedRectangle", {
      name: "SHAPE",
      fill: "#f9f9f9",
      strokeWidth: 2,
      stroke: "#888",
      minSize: new go.Size(120, 50),
    }, new go.Binding("fill", "color")),
    $(go.TextBlock, {
      margin: 12,
      font: "bold 14px Arial",
      textAlign: "center",
      wrap: go.TextBlock.WrapFit,
      width: 120,
    }, new go.Binding("text", "text"))
  );

  diagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);
  mindmapContainer.style.display = "block";

  console.log("✅ Mindmap generated:", { nodeDataArray, linkDataArray });
}

/** Toon de context van een woord in het element #contextDetails **/
function showContext(event, obj) {
  if (!obj || !obj.part || !obj.part.data) {
    console.error("❌ Ongeldige objectgegevens:", obj);
    return;
  }
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

/** DOMContentLoaded: Setup eventlisteners en initialiseer CSV en mindmap **/
document.addEventListener("DOMContentLoaded", async () => {
  console.log("📌 mindmap.js geladen. Initialiseren...");

  const analyseButton = document.getElementById("analyseButton");
  const exportButton = document.getElementById("exportButton");
  const inputText = document.getElementById("inputText");
  const mindmapContainer = document.getElementById("mindmap-container");

  if (!analyseButton || !exportButton || !inputText || !mindmapContainer) {
    console.error("❌ Belangrijke HTML-elementen ontbreken. Controleer je HTML-structuur.");
    return;
  }

  await loadCSV();
  if (!isCsvLoaded) {
    alert("⚠ CSV kon niet worden geladen. Probeer later opnieuw.");
    return;
  }

  analyseButton.addEventListener("click", () => {
    const rawText = inputText.value.trim();
    if (!rawText) {
      alert("⚠ Voer eerst tekst in!");
      return;
    }
    const filtered = filterStopwoorden(rawText);
    const themes = analyseZinnen(filtered);
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
      alert("⚠ Geen thema's gevonden in de tekst. Probeer andere invoer.");
      return;
    }
    generateMindmap(themes);
  });

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
