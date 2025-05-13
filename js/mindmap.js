"use strict";

// ===============================
// RadialLayout functie definieren
// ===============================
const RadialLayout = function() {
  go.Layout.call(this);
};
go.Diagram.inherit(RadialLayout, go.Layout);

/** @override */
RadialLayout.prototype.doLayout = function(coll) {
  const diagram = this.diagram;
  if (diagram === null) return;
  const root = diagram.findNodeForKey("ROOT");
  if (root === null) return;

  // Plaats root in het midden
  root.location = diagram.initialPosition;

  const visited = new go.Set();
  visited.add(root);

  this.layoutLayer(0, root, visited);
};

/**
 * Recursieve functie om lagen te plaatsen
 */
RadialLayout.prototype.layoutLayer = function(layer, node, visited) {
  const links = node.findLinksOutOf();
  let angle = 360 / links.count;
  let curAngle = 0;

  links.each(link => {
    const child = link.getOtherNode(node);
    if (visited.has(child)) return;
    visited.add(child);

    const dist = 150 + (layer * 100);
    const rad = (Math.PI / 180) * curAngle;
    const x = node.location.x + dist * Math.cos(rad);
    const y = node.location.y + dist * Math.sin(rad);

    child.location = new go.Point(x, y);

    this.layoutLayer(layer + 1, child, visited);

    curAngle += angle;
  });
};

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

  const $ = go.GraphObject.make;

  // Initieer diagram + meteen goede RadialLayout instellen
  const diagram = $(go.Diagram, "mindmap", {
    initialContentAlignment: go.Spot.Center,
    autoScale: go.Diagram.Uniform,
    "undoManager.isEnabled": true,
    layout: $(go.RadialLayout, {
      maxLayers: 4,            // minder ringen (beter voor jouw structuur)
      layerThickness: 180,     // meer ruimte tussen lagen
      angleIncrement: 30,      // bredere verdeling
      rotateNode: false,       // tekst niet draaien
    }),
    isReadOnly: true
  });

  // Templates
  diagram.nodeTemplate = $(
    go.Node, "Auto",
    { click: showContext },
    $(go.Shape, "RoundedRectangle",
      {
        name: "SHAPE",
        fill: "#f9f9f9",
        stroke: "#888",
        strokeWidth: 2,
        minSize: new go.Size(100, 40)
      },
      new go.Binding("fill", "color")
    ),
    $(go.TextBlock,
      {
        margin: 8,
        font: "bold 12px Arial",
        textAlign: "center",
        wrap: go.TextBlock.WrapFit,
        width: 140
      },
      new go.Binding("text", "text")
    )
  );

  diagram.linkTemplate = $(
    go.Link,
    { curve: go.Link.Bezier },
    $(go.Shape, { strokeWidth: 2, stroke: "#888" }),
    $(go.Shape, { toArrow: "Standard", stroke: null, fill: "#888" })
  );

  // Maak data
  const nodeDataArray = [];
  const linkDataArray = [];

  nodeDataArray.push({
    key: "ROOT",
    text: "Triple C implementatie",
    color: "#ffffff",
    isRoot: true
  });

  Object.keys(themesData.clusters).forEach(thema => {
    const subthemas = themesData.clusters[thema];
    const hasData = Object.values(subthemas).some(arr => arr.length > 0);
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

      [...new Set(woorden)].forEach(word => {
        if (!word) return;
        const wordKey = `${subKey}||${word}`;
        nodeDataArray.push({ key: wordKey, text: word, color: "#DDDDDD" });
        linkDataArray.push({ from: subKey, to: wordKey });
      });
    });
  });

  // Stel model in
  diagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);

  // Root vastzetten (zorgt dat RadialLayout weet wie echt centraal moet)
  diagram.addDiagramListener("InitialLayoutCompleted", e => {
    const rootnode = diagram.findNodeForKey("ROOT");
    if (rootnode && diagram.layout instanceof go.RadialLayout) {
      diagram.layout.root = rootnode;
      diagram.layoutDiagram(true);
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

  if (woordContext[woord]) {
    detailsDiv.style.display = "block";
    contextText.innerHTML = `<strong>Context van "${woord}":</strong><br>` + [...woordContext[woord]].join("<br>");
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
