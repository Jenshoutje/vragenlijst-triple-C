// ===========================================
// mindmap.js - VOLLEDIGE WERKENDE VERSIE
// ===========================================

"use strict";

// Alias voor GoJS GraphObject.make
const $ = go.GraphObject.make;

// =========================
// RadialLayout definitie
// =========================
const RadialLayout = function() {
  go.Layout.call(this);
};
go.Diagram.inherit(RadialLayout, go.Layout);

RadialLayout.prototype.doLayout = function(coll) {
  const diagram = this.diagram;
  if (!diagram) return;

  const root = diagram.findNodeForKey("ROOT");
  if (!root) return;

  root.location = diagram.initialPosition || new go.Point(0, 0);

  const visited = new go.Set();
  visited.add(root);

  this.layoutLayer(0, root, visited);
};

RadialLayout.prototype.layoutLayer = function(layer, node, visited) {
  const links = node.findLinksOutOf();
  const count = links.count;
  if (count === 0) return;

  let angle = 360 / count;
  let curAngle = 0;

  links.each(link => {
    const child = link.getOtherNode(node);
    if (visited.has(child)) return;
    visited.add(child);

    const dist = 150 + (layer * 120);
    const rad = (Math.PI / 180) * curAngle;
    const x = node.location.x + dist * Math.cos(rad);
    const y = node.location.y + dist * Math.sin(rad);

    child.location = new go.Point(x, y);

    this.layoutLayer(layer + 1, child, visited);

    curAngle += angle;
  });
};

// =========================
// Mindmap genereren
// =========================
function generateMindmap(themesData) {
  const mindmapDiv = document.getElementById("mindmap");
  if (!mindmapDiv) {
    console.error("❌ Geen mindmap-container gevonden.");
    return;
  }

  let oldDiagram = go.Diagram.fromDiv("mindmap");
  if (oldDiagram) {
    oldDiagram.clear();
    oldDiagram.div = null;
  }

  let diagram = $(go.Diagram, "mindmap", {
    initialAutoScale: go.Diagram.Uniform,
    "undoManager.isEnabled": false,
    layout: $(RadialLayout),
    isReadOnly: true
  });

  diagram.linkTemplate = $(
    go.Link,
    { curve: go.Link.Bezier, adjusting: go.Link.Stretch, corner: 10 },
    $(go.Shape, { strokeWidth: 2, stroke: "#888" }),
    $(go.Shape, { toArrow: "Standard", stroke: null, fill: "#888" })
  );

  diagram.nodeTemplate = $(
    go.Node, "Auto",
    { click: showContext },
    $(
      go.Shape, "RoundedRectangle",
      { fill: "#f9f9f9", stroke: "#888", strokeWidth: 2, minSize: new go.Size(100, 40) },
      new go.Binding("fill", "color")
    ),
    $(
      go.TextBlock,
      { margin: 8, font: "bold 12px Arial", textAlign: "center", wrap: go.TextBlock.WrapFit, width: 100 },
      new go.Binding("text", "text")
    )
  );

  let nodeDataArray = [];
  let linkDataArray = [];

  nodeDataArray.push({ key: "ROOT", text: "Triple C implementatie", color: "#FFFFFF" });

  Object.keys(themesData.clusters).forEach(thema => {
    const subthemas = themesData.clusters[thema];
    if (!subthemas || Object.values(subthemas).every(arr => arr.length === 0)) return;

    nodeDataArray.push({ key: thema, text: thema, color: getThemeColor(thema) });
    linkDataArray.push({ from: "ROOT", to: thema });

    Object.keys(subthemas).forEach(sub => {
      const woorden = subthemas[sub];
      if (!woorden || woorden.length === 0) return;

      const subKey = `${thema}||${sub}`;
      nodeDataArray.push({ key: subKey, text: sub, color: "#EEEEEE" });
      linkDataArray.push({ from: thema, to: subKey });

      const uniqueWords = [...new Set(woorden)];
      uniqueWords.forEach(word => {
        if (!word) return;
        const wordKey = `${subKey}||${word}`;
        nodeDataArray.push({ key: wordKey, text: word, color: "#DDDDDD" });
        linkDataArray.push({ from: subKey, to: wordKey });
      });
    });
  });

  diagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);

  mindmapDiv.style.display = "block";
  console.log("✅ Radiale Mindmap gegenereerd.");
}

// =========================
// Kleur voor thema's
// =========================
function getThemeColor(thema) {
  const baseColors = ["#FF9999", "#99FF99", "#66B2FF", "#FFD700", "#FFA07A", "#B19CD9", "#90EE90"];
  const themaList = Object.keys(themesData.clusters);
  const idx = themaList.indexOf(thema);
  return baseColors[idx % baseColors.length] || "#D3D3D3";
}

// =========================
// Context tonen
// =========================
function showContext(event, obj) {
  const word = obj.part.data.text;
  const contextText = document.getElementById("contextText");
  if (!contextText) return;

  if (woordContext[word]) {
    document.getElementById("contextDetails").style.display = "block";
    contextText.innerHTML = `<strong>Context van \"${word}\":</strong><br>` + [...woordContext[word]].join("<br>");
  } else {
    document.getElementById("contextDetails").style.display = "block";
    contextText.innerHTML = `<strong>Geen context beschikbaar voor \"${word}\".</strong>`;
  }
}

// =========================
// Export knop (optioneel)
// =========================
const exportButton = document.getElementById("exportButton");
if (exportButton) {
  exportButton.addEventListener("click", () => {
    const diagram = go.Diagram.fromDiv("mindmap");
    if (!diagram) return;

    const imgData = diagram.makeImageData({ background: "white" });
    const a = document.createElement("a");
    a.href = imgData;
    a.download = "mindmap.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });
}

// Klaar! 🎯
