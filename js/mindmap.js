"use strict";

/** =========================
 *  1. GLOBALE VARIABELEN
 * ========================= */
let stopwoorden = new Set();
let thematischeData = {};  // { Thema: { Subthema: Set([...]) } }
let isCsvLoaded = false;
let woordContext = {};     // Bewaart contextzinnen per woord
let diagram = null;        // Huidige mindmap diagram

/** =========================
 *  2. CSV LADEN & PARSEN
 * ========================= */
async function loadCSV() {
  try {
    const response = await fetch("data/thematische_analyse.csv");
    const text = await response.text();
    const rows = text.split("\n").slice(1);

    rows.forEach(row => {
      const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      if (cols.length < 4) return;

      const thema = cols[0].trim();
      const subthema = cols[1].trim();
      const kernwoorden = cols[2].replace(/^"|"$/g, "").split(",").map(normalizeWord).filter(Boolean);
      const synoniemen = cols[3].replace(/^"|"$/g, "").split(",").map(normalizeWord).filter(Boolean);

      if (thema.toLowerCase() === "stopwoorden") {
        kernwoorden.concat(synoniemen).forEach(w => stopwoorden.add(w));
      } else {
        thematischeData[thema] = thematischeData[thema] || {};
        thematischeData[thema][subthema] = thematischeData[thema][subthema] || new Set();
        kernwoorden.concat(synoniemen).forEach(w => thematischeData[thema][subthema].add(w));
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
  return text.split(/\s+/).map(normalizeWord).filter(w => w && !stopwoorden.has(w));
}

/** =========================
 *  4. TEKST ANALYSEREN
 * ========================= */
function analyseTekst(wordsArray, originalText) {
  let clusters = {};
  const zinnen = originalText.split(/[.!?]/).map(z => z.trim()).filter(Boolean);

  Object.keys(thematischeData).forEach(thema => {
    if (thema.toLowerCase() === "stopwoorden") return;
    clusters[thema] = {};
    Object.keys(thematischeData[thema]).forEach(sub => {
      clusters[thema][sub] = [];
    });
  });

  wordsArray.forEach(word => {
    Object.keys(thematischeData).forEach(thema => {
      if (thema.toLowerCase() === "stopwoorden") return;
      Object.keys(thematischeData[thema]).forEach(sub => {
        if (thematischeData[thema][sub].has(word)) {
          clusters[thema][sub].push(word);
          woordContext[word] = woordContext[word] || new Set();
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
 *  5. MINDMAP GENEREREN
 * ========================= */
function generateMindmap(themesData) {
  const mindmapDiv = document.getElementById("mindmap");
  if (!mindmapDiv) {
    console.error("❌ Geen mindmap-container gevonden.");
    return;
  }

  if (diagram) {
    diagram.div = null;
    diagram = null;
    mindmapDiv.innerHTML = "";
  }

  let $ = go.GraphObject.make;
  diagram = $(go.Diagram, "mindmap", {
    initialContentAlignment: go.Spot.Center,
    "undoManager.isEnabled": true,
    autoScale: go.Diagram.Uniform
  });

  diagram.linkTemplate = $(
    go.Link,
    { curve: go.Link.Bezier, adjusting: go.Link.Stretch, corner: 10 },
    $(go.Shape, { strokeWidth: 2, stroke: "#888" }),
    $(go.Shape, { toArrow: "Standard", stroke: null, fill: "#888" })
  );

  let nodeDataArray = [], linkDataArray = [];
  nodeDataArray.push({ key: "ROOT", text: "Triple C implementatie", color: "#ffffff", isRoot: true });

  Object.keys(themesData.clusters).forEach(thema => {
    const subthemas = themesData.clusters[thema];
    if (!Object.values(subthemas).some(arr => arr.length > 0)) return;

    const themaColor = getThemeColor(thema);
    nodeDataArray.push({ key: thema, text: thema, color: themaColor });
    linkDataArray.push({ from: "ROOT", to: thema });

    Object.keys(subthemas).forEach(sub => {
      const woorden = subthemas[sub];
      if (!woorden.length) return;
      const subKey = `${thema}||${sub}`;
      nodeDataArray.push({ key: subKey, text: sub, color: "#EEEEEE" });
      linkDataArray.push({ from: thema, to: subKey });
      [...new Set(woorden)].forEach(word => {
        const wordKey = `${subKey}||${word}`;
        nodeDataArray.push({ key: wordKey, text: word, color: "#DDDDDD" });
        linkDataArray.push({ from: subKey, to: wordKey });
      });
    });
  });

  diagram.nodeTemplate = $(
    go.Node, "Auto",
    { click: showContext, mouseEnter: (e, node) => node.findObject("SHAPE").stroke = "#ff0000", mouseLeave: (e, node) => node.findObject("SHAPE").stroke = "#888" },
    $(go.Shape, "RoundedRectangle", { name: "SHAPE", fill: "#f9f9f9", stroke: "#888", strokeWidth: 2, minSize: new go.Size(120, 50) }, new go.Binding("fill", "color")),
    $(go.TextBlock, { margin: 12, font: "bold 14px Arial", textAlign: "center", wrap: go.TextBlock.WrapFit, width: 120 }, new go.Binding("text", "text"))
  );

  diagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);
  diagram.layout = $(go.RadialLayout, { maxLayers: 6, layerThickness: 120, angleIncrement: 20, rotateNode: false });

  diagram.addDiagramListener("InitialLayoutCompleted", () => {
    const root = diagram.findNodeForKey("ROOT");
    if (root && diagram.layout instanceof go.RadialLayout) {
      diagram.layout.root = root;
      diagram.layoutDiagram(true);
    }
  });

  mindmapDiv.style.display = "block";
  console.log("✅ Mindmap gegenereerd:", { nodeDataArray, linkDataArray });
}

/** =========================
 *  6. THEMAKLEUREN
 * ========================= */
function getThemeColor(thema) {
  const baseColors = ["#FF9999", "#99FF99", "#66B2FF", "#FFD700", "#FFA07A", "#B19CD9", "#90EE90"];
  const idx = Object.keys(thematischeData).filter(t => t.toLowerCase() !== "stopwoorden").indexOf(thema);
  return baseColors[idx % baseColors.length] || "#D3D3D3";
}

/** =========================
 *  7. CONTEXT DETAILS
 * ========================= */
function showContext(event, obj) {
  if (!obj || !obj.part || !obj.part.data) return;
  const woord = obj.part.data.text;
  const detailsDiv = document.getElementById("contextDetails");
  const contextText = document.getElementById("contextText");

  if (woordContext[woord]) {
    detailsDiv.style.display = "block";
    contextText.innerHTML = `<strong>Context van \"${woord}\":</strong><br>` + [...woordContext[woord]].join("<br>");
  } else {
    detailsDiv.style.display = "block";
    contextText.innerHTML = `<strong>Geen context beschikbaar voor \"${woord}\".</strong>`;
  }
}

/** =========================
 *  8. INIT
 * ========================= */
document.addEventListener("DOMContentLoaded", async () => {
  console.log("📌 Mindmap.js geladen.");

  await loadCSV();
  if (!isCsvLoaded) {
    alert("⚠ CSV kon niet worden geladen.");
    return;
  }

  const analyseButton = document.getElementById("analyseButton");
  const exportButton = document.getElementById("exportButton");
  const inputText = document.getElementById("inputText");

  analyseButton?.addEventListener("click", () => {
    const userInput = inputText.value.trim();
    if (!userInput) {
      alert("⚠ Voer tekst in.");
      return;
    }
    const wordsArray = filterStopwoorden(userInput);
    const themes = analyseTekst(wordsArray, userInput);
    generateMindmap(themes);
  });

  exportButton?.addEventListener("click", () => {
    if (diagram) {
      const imgData = diagram.makeImageData({ background: "white" });
      const a = document.createElement("a");
      a.href = imgData;
      a.download = "mindmap.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      alert("⚠ Geen mindmap beschikbaar om te exporteren.");
    }
  });
});
