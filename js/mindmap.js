"use strict";

// Alias voor kortere GoJS syntax
const $ = go.GraphObject.make;

/**
 * CSV parser: bouwt een nodeDataArray voor de mindmap.
 */
function parseCsvData(csvText) {
  const delimiter = csvText.includes(';') && !csvText.includes(',') ? ';' : ',';
  const lines = csvText.trim().split(/\r?\n/);
  const nodeDataArray = [];
  let keyCounter = 0;

  nodeDataArray.push({ key: keyCounter, text: "Triple C implementatie", category: "Root" });
  const rootKey = keyCounter++;
  const themeColorMap = {};
  const colors = ["#6FB1FC", "#FF928F", "#8DEB7A", "#FFDC59", "#A68BFF", "#FF8DDA", "#7FFFD4", "#FFA07A"];
  let colorIndex = 0;

  const createdNodes = { themes: {} };

  for (const line of lines) {
    if (!line.trim()) continue;
    const fields = line.split(delimiter);
    if (fields.length < 4) continue;

    const [themeRaw, subthemeRaw, keywordRaw, synonymsRaw] = fields.map(f => f.replace(/^"|"$/g, '').trim());
    if (!themeRaw || !subthemeRaw || !keywordRaw) continue;

    if (!themeColorMap[themeRaw]) themeColorMap[themeRaw] = colors[colorIndex++ % colors.length];
    const color = themeColorMap[themeRaw];

    if (!createdNodes.themes[themeRaw]) {
      const themeNode = { key: keyCounter++, parent: rootKey, text: themeRaw, color };
      nodeDataArray.push(themeNode);
      createdNodes.themes[themeRaw] = { key: themeNode.key, subthemes: {} };
    }
    const themeKey = createdNodes.themes[themeRaw].key;

    if (!createdNodes.themes[themeRaw].subthemes[subthemeRaw]) {
      const subNode = { key: keyCounter++, parent: themeKey, text: subthemeRaw, color };
      nodeDataArray.push(subNode);
      createdNodes.themes[themeRaw].subthemes[subthemeRaw] = { key: subNode.key, keywords: {} };
    }
    const subKey = createdNodes.themes[themeRaw].subthemes[subthemeRaw].key;

    if (!createdNodes.themes[themeRaw].subthemes[subthemeRaw].keywords[keywordRaw]) {
      const keywordNode = { key: keyCounter++, parent: subKey, text: keywordRaw, color, contextSentences: [] };
      nodeDataArray.push(keywordNode);
      createdNodes.themes[themeRaw].subthemes[subthemeRaw].keywords[keywordRaw] = { key: keywordNode.key, synonyms: {} };
    }
    const keywordKey = createdNodes.themes[themeRaw].subthemes[subthemeRaw].keywords[keywordRaw].key;

    const synonyms = synonymsRaw.split(/[;,]/).map(s => s.trim()).filter(Boolean);
    synonyms.forEach(syn => {
      if (!createdNodes.themes[themeRaw].subthemes[subthemeRaw].keywords[keywordRaw].synonyms[syn]) {
        const synNode = { key: keyCounter++, parent: keywordKey, text: syn, color, contextSentences: [] };
        nodeDataArray.push(synNode);
        createdNodes.themes[themeRaw].subthemes[subthemeRaw].keywords[keywordRaw].synonyms[syn] = synNode.key;
      }
    });
  }
  return nodeDataArray;
}

/**
 * Contextzinnen zoeken per node.
 */
function findContextSentences(text, nodeDataArray) {
  const sentences = text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
  nodeDataArray.forEach(node => {
    if (!node.contextSentences) return;
    node.contextSentences.length = 0;
    const word = node.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    sentences.forEach(sentence => {
      if (regex.test(sentence)) node.contextSentences.push(sentence);
    });
  });
}

/**
 * Toon context onderaan bij klik.
 */
function onNodeClick(node) {
  const data = node.data;
  const contextDiv = document.getElementById("contextText");
  const contextBox = document.getElementById("contextDetails");

  if (!contextDiv || !contextBox) return;
  contextDiv.innerHTML = "";

  if (data.contextSentences && data.contextSentences.length > 0) {
    let html = `<h3>Contextzinnen voor: ${data.text}</h3><ul>`;
    data.contextSentences.forEach(sentence => html += `<li>${sentence}</li>`);
    html += "</ul>";
    contextDiv.innerHTML = html;
  } else {
    contextDiv.innerHTML = `<p><em>Geen contextzinnen gevonden voor: ${data.text}</em></p>`;
  }
  contextBox.style.display = "block";
}

/**
 * Bouw en toon de mindmap.
 */
function generateMindmap(csvText, inputText) {
  const nodeDataArray = parseCsvData(csvText);
  if (nodeDataArray.length === 0) {
    console.error("Geen geldige data uit CSV.");
    return;
  }
  findContextSentences(inputText, nodeDataArray);

  const diagramDiv = document.getElementById("mindmap");
  if (!diagramDiv) {
    console.error("Mindmap container niet gevonden.");
    return;
  }

  const myDiagram = $(go.Diagram, diagramDiv, {
    initialAutoScale: go.Diagram.Uniform,
    layout: $(go.RadialLayout, {
      rotateNode: (node, angle) => {
        const tb = node.findObject("TEXTBLOCK");
        if (tb) tb.angle = (angle > 90 && angle < 270) ? 180 : 0;
      }
    }),
    isReadOnly: true
  });

  myDiagram.nodeTemplate = $(
    go.Node, "Auto",
    { selectionAdorned: false, cursor: "pointer", click: (e, node) => onNodeClick(node) },
    $(go.Shape, "Circle", { name: "SHAPE", fill: "lightgray", stroke: null, strokeWidth: 0, desiredSize: new go.Size(16, 16) },
      new go.Binding("fill", "color")),
    $(go.TextBlock, { name: "TEXTBLOCK", font: "10pt sans-serif", margin: 4 },
      new go.Binding("text", "text"))
  );

  myDiagram.nodeTemplateMap.add("Root", $(
    go.Node, "Auto",
    $(go.Shape, "Circle", { fill: "white", stroke: "gray", strokeWidth: 2, desiredSize: new go.Size(30, 30) }),
    $(go.TextBlock, { font: "bold 12pt sans-serif", margin: 5 },
      new go.Binding("text", "text"))
  ));

  myDiagram.linkTemplate = $(
    go.Link,
    { curve: go.Link.Bezier, selectable: false },
    $(go.Shape, { strokeWidth: 1, stroke: "#AAA" }),
    $(go.Shape, { toArrow: "Standard", fill: "#AAA", stroke: "#AAA" })
  );

  myDiagram.model = new go.TreeModel(nodeDataArray);
}

/**
 * Initialiseer na DOMContentLoaded.
 */
document.addEventListener("DOMContentLoaded", async () => {
  console.log("📌 mindmap.js geladen. Start initialisatie...");

  const inputTextArea = document.getElementById("inputText");
  const analyseButton = document.getElementById("generateButton");

  if (!inputTextArea || !analyseButton) {
    console.error("Inputveld of Analyseerknop niet gevonden.");
    return;
  }

  let csvText = "";

  try {
    const response = await fetch("data/thematische_analyse.csv");
    if (!response.ok) throw new Error(`Fout: ${response.statusText}`);
    csvText = await response.text();
    console.log("✅ CSV bestand geladen.");
  } catch (error) {
    console.error("❌ Fout bij laden CSV:", error);
    alert("CSV-bestand kon niet worden geladen.");
    return;
  }

  analyseButton.addEventListener("click", () => {
    const userInput = inputTextArea.value.trim();
    if (!userInput) {
      alert("⚠ Voer eerst tekst in.");
      return;
    }
    generateMindmap(csvText, userInput);
  });
});
