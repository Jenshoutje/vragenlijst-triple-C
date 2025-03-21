"use strict";

/** Globale opslag voor stopwoorden en thematische data **/
let stopwoorden = new Set();
let thematischeData = {};  // Structuur: { mainTheme: { subTheme: Set([...]) } }
let isCsvLoaded = false;   // Controle of CSV is geladen
let woordContext = {};     // Bewaart context per woord

document.addEventListener("DOMContentLoaded", async function () {
  console.log("📌 JavaScript geladen: Start Mindmap-setup...");

  // Controleer of GoJS aanwezig is
  if (typeof go === "undefined") {
    console.error("❌ GoJS library niet geladen. Controleer je HTML-bestand.");
    alert("Er is een fout opgetreden bij het laden van de mindmap. Controleer je verbinding.");
    return;
  }

  // Laad CSV en verwerk de data
  await loadCSV();
  if (!isCsvLoaded) {
    alert("⚠ CSV kon niet worden geladen. Probeer later opnieuw.");
    return;
  }

  // Event listeners voor analyse en export (als nodig)
  const analyseButton = document.getElementById("analyseButton");
  const exportButton = document.getElementById("exportButton");
  const inputText = document.getElementById("inputText");
  const mindmapContainer = document.getElementById("mindmap-container");

  if (analyseButton && inputText && mindmapContainer) {
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
        alert("⚠ Geen thema's gevonden in deze tekst. Probeer andere invoer.");
        return;
      }
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

/** Functie: Laad CSV met thematische data **/
async function loadCSV() {
  try {
    const response = await fetch("data/thematische_analyse.csv");
    const text = await response.text();
    const rows = text.split("\n").slice(1);
    rows.forEach(row => {
      const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      if (columns.length >= 4) {
        const mainTheme = columns[0].trim();
        const subTheme = columns[1].trim();
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

/** Functie: Filter stopwoorden uit tekst **/
function filterStopwoorden(text) {
  const regex = new RegExp("\\b(" + [...stopwoorden].join("|") + ")\\b", "gi");
  return text.replace(regex, "").trim();
}

/** Functie: Analyseer tekst en bouw thematische clusters op **/
function analyseZinnen(text) {
  const woorden = text.toLowerCase().split(/\s+/);
  const zinnen = text.split(".");
  const clusters = {};
  const woordToegewezen = {};
  Object.keys(thematischeData).forEach(mainTheme => {
    if (mainTheme.toLowerCase() === "stopwoorden") return;
    clusters[mainTheme] = {};
    Object.keys(thematischeData[mainTheme]).forEach(subTheme => {
      clusters[mainTheme][subTheme] = [];
    });
  });
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

/** Functie: Kleur toewijzen aan hoofdthema's **/
const kleuren = ["#FF9999", "#99FF99", "#66B2FF", "#FFD700", "#FFA07A"];
function getColorBySentiment(theme) {
  const allThemes = Object.keys(thematischeData).filter(t => t.toLowerCase() !== "stopwoorden");
  const index = allThemes.indexOf(theme) % kleuren.length;
  return kleuren[index] || "#D3D3D3";
}

/** Functie: Genereer een mindmap met GoJS in TreeLayout **/
function generateMindmap(themesData) {
  const mindmapContainer = document.getElementById("mindmap");
  if (!mindmapContainer) return;
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
  nodeDataArray.push({ key: "ROOT", text: "Triple C implementatie", color: "#ffffff" });
  const clusters = themesData && themesData.clusters ? themesData.clusters : {};
  for (const mainTheme in clusters) {
    if (!mainTheme.trim()) continue;
    let hasWords = false;
    for (const sub in clusters[mainTheme]) {
      if (clusters[mainTheme][sub] && clusters[mainTheme][sub].length > 0) {
        hasWords = true;
        break;
      }
    }
    if (!hasWords) continue;
    const mainColor = getColorBySentiment(mainTheme);
    nodeDataArray.push({ key: mainTheme, text: mainTheme, color: mainColor });
    linkDataArray.push({ from: "ROOT", to: mainTheme });
    const subthemes = clusters[mainTheme];
    for (const subTheme in subthemes) {
      if (!subTheme.trim()) continue;
      const words = subthemes[subTheme];
      if (!Array.isArray(words) || words.length === 0) continue;
      const subKey = `${mainTheme}||${subTheme}`;
      nodeDataArray.push({ key: subKey, text: subTheme, color: "#EEEEEE" });
      linkDataArray.push({ from: mainTheme, to: subKey });
      words.forEach(word => {
        if (!word.trim()) return;
        const wordKey = `${subKey}||${word}`;
        nodeDataArray.push({ key: wordKey, text: word, color: "#DDDDDD" });
        linkDataArray.push({ from: subKey, to: wordKey });
      });
    }
  }

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

  diagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);
  mindmapContainer.style.display = "block";
  console.log("✅ Mindmap gegenereerd:", { nodeDataArray, linkDataArray });
}

/** Functie: Toont de context van een woord in #contextDetails **/
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

  const analyseButton = document.getElementById("analyseButton");
  const exportButton = document.getElementById("exportButton");
  const inputText = document.getElementById("inputText");
  const mindmapContainer = document.getElementById("mindmap-container");

  if (!analyseButton || !exportButton || !inputText || !mindmapContainer) {
    console.error("❌ Belangrijke HTML-elementen ontbreken. Controleer je HTML.");
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
      alert("⚠ Geen thema's gevonden in deze tekst. Probeer andere invoer.");
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
