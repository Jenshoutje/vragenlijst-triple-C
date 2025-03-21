"use strict";

/** 
 * Globale data-structuren 
 * - thematischeData: { [Thema]: { [Subthema]: Set([...woorden...]) } }
 * - isCsvLoaded: bool
 * - woordContext: { [woord]: Set([...zinnen...]) }
 */
let thematischeData = {};
let isCsvLoaded = false;
let woordContext = {};

/** 
 * 1. DOMContentLoaded 
 */
document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ mindmap.js geladen.");

  // Check of GoJS bestaat
  if (typeof go === "undefined") {
    alert("GoJS is niet geladen! Controleer je script-tag.");
    return;
  }

  // HTML-elementen
  const analyseBtn  = document.getElementById("analyseButton");
  const exportBtn   = document.getElementById("exportButton");
  const inputTextEl = document.getElementById("inputText");
  const mindmapDiv  = document.getElementById("mindmap");

  // Eenvoudige checks
  if (!analyseBtn || !exportBtn || !inputTextEl || !mindmapDiv) {
    console.error("Bepaalde HTML-elementen ontbreken. Controleer je IDs.");
    return;
  }

  // 1) CSV laden
  await loadCSV();
  if (!isCsvLoaded) {
    alert("Kon de CSV (thematische_analyse.csv) niet laden. Zorg dat het bestand bestaat.");
    return;
  }

  // 2) Klik op "Analyseer"
  analyseBtn.addEventListener("click", () => {
    const rawText = inputTextEl.value.trim();
    if (!rawText) {
      alert("Voer eerst tekst in om te analyseren!");
      return;
    }

    // (Optioneel) als je stopwoorden had, zou je die hier filteren
    // let filteredText = filterStopwoorden(rawText);
    let filteredText = rawText; // weglaten, tenzij je stopwoorden wilt

    // Analyse
    const themes = analyseTekstOpThematischeData(filteredText);

    // Check of we resultaten hebben
    let foundAny = false;
    for (const thema in themes.clusters) {
      for (const sub in themes.clusters[thema]) {
        if (themes.clusters[thema][sub].length > 0) {
          foundAny = true;
          break;
        }
      }
      if (foundAny) break;
    }
    if (!foundAny) {
      alert("Geen matchende thema's gevonden in je tekst.");
      return;
    }

    // Maak mindmap
    generateMindmap(themes);
  });

  // 3) Klik op "Exporteer als afbeelding"
  exportBtn.addEventListener("click", () => {
    const diagram = go.Diagram.fromDiv("mindmap");
    if (!diagram) {
      alert("Geen diagram gevonden om te exporteren.");
      return;
    }
    const pngData = diagram.makeImageData({ background: "white" });
    const a = document.createElement("a");
    a.href = pngData;
    a.download = "mindmap.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });
});

/** 
 * 2. CSV Laden 
 * Formaat: Thema,Subthema,Kernwoorden,Synoniemen / Verwante Begrippen
 */
async function loadCSV() {
  try {
    const resp = await fetch("data/thematische_analyse.csv");
    const text = await resp.text();

    const lines = text.split("\n").slice(1); // skip header
    lines.forEach(line => {
      // Split op komma's, met respect voor quotes
      const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      if (cols.length >= 4) {
        const mainTheme  = cols[0].trim();
        const subTheme   = cols[1].trim();

        // Kernwoorden
        let kernArr = cols[2].replace(/^"|"$/g, "")
          .split(",")
          .map(w => w.trim())
          .filter(Boolean);

        // Synoniemen
        let synArr = cols[3].replace(/^"|"$/g, "")
          .split(",")
          .map(w => w.trim())
          .filter(Boolean);

        // Voeg alles samen in één Set, zodat je niet dubbel zoveel nodes krijgt
        const allWords = new Set([...kernArr, ...synArr]);

        // thematischeData[mainTheme][subTheme] = Set([...woorden...])
        if (!thematischeData[mainTheme]) {
          thematischeData[mainTheme] = {};
        }
        if (!thematischeData[mainTheme][subTheme]) {
          thematischeData[mainTheme][subTheme] = new Set();
        }
        allWords.forEach(w => thematischeData[mainTheme][subTheme].add(w));
      }
    });

    isCsvLoaded = true;
    console.log("CSV geladen:", thematischeData);
  } catch (err) {
    console.error("Fout bij laden CSV:", err);
  }
}

/** 
 * 3. Tekst analyseren en clusteren op (Thema -> Subthema -> Woord) 
 */
function analyseTekstOpThematischeData(userText) {
  // Splits in woorden & zinnen
  const zinnen = userText.split(".");
  const woorden = userText.toLowerCase().split(/\s+/);

  // Maak clusters met zelfde structuur
  const clusters = {};
  for (const t of Object.keys(thematischeData)) {
    clusters[t] = {};
    for (const s of Object.keys(thematischeData[t])) {
      clusters[t][s] = [];
    }
  }

  // Voor elk woord checken we of het in thematischeData voorkomt
  const assigned = {}; // compositeKey -> bool
  woorden.forEach(woord => {
    const wtrim = woord.trim();
    if (!wtrim) return;

    for (const t of Object.keys(thematischeData)) {
      for (const s of Object.keys(thematischeData[t])) {
        if (thematischeData[t][s].has(wtrim)) {
          const cKey = `${t}||${s}||${wtrim}`;
          if (!assigned[cKey]) {
            clusters[t][s].push(wtrim);
            assigned[cKey] = true;

            // Context: bewaar zinnen
            if (!woordContext[wtrim]) {
              woordContext[wtrim] = new Set();
            }
            zinnen.forEach(z => {
              if (z.toLowerCase().includes(wtrim)) {
                woordContext[wtrim].add(z.trim());
              }
            });
          }
        }
      }
    }
  });

  return { clusters, woordContext };
}

/** 
 * 4. Mindmap genereren (GoJS) 
 *   Root -> Themas -> Subthemas -> Woorden 
 */
function generateMindmap(themesData) {
  const container = document.getElementById("mindmap");
  if (!container) return;

  // Verwijder evt. oud diagram
  let oldDiagram = go.Diagram.fromDiv("mindmap");
  if (oldDiagram) {
    oldDiagram.clear();
    oldDiagram.div = null;
  }

  const $ = go.GraphObject.make;
  const diagram = $(go.Diagram, "mindmap", {
    layout: $(go.TreeLayout, {
      angle: 0,
      layerSpacing: 150,
      nodeSpacing: 80
    }),
    initialContentAlignment: go.Spot.Center
  });

  const nodeDataArray = [];
  const linkDataArray = [];

  // Voeg root toe
  nodeDataArray.push({ key: "ROOT", text: "Triple C implementatie", color: "#fff" });

  // thematischeData -> { Thema: { Subthema: [woorden...] } }
  // clusters -> identiek, maar we gebruiken themesData.clusters
  const clusters = themesData.clusters;

  for (const mainTheme in clusters) {
    let hasAnyWord = false;
    for (const subT in clusters[mainTheme]) {
      if (clusters[mainTheme][subT].length > 0) {
        hasAnyWord = true;
        break;
      }
    }
    if (!hasAnyWord) continue;

    // Creëer mainTheme node
    nodeDataArray.push({ key: mainTheme, text: mainTheme, color: "#d0e6ff" });
    linkDataArray.push({ from: "ROOT", to: mainTheme });

    // Subthema's
    for (const subT in clusters[mainTheme]) {
      const words = clusters[mainTheme][subT];
      if (!words || words.length === 0) continue;

      const subKey = `${mainTheme}||${subT}`;
      nodeDataArray.push({ key: subKey, text: subT, color: "#eee" });
      linkDataArray.push({ from: mainTheme, to: subKey });

      // Woorden
      words.forEach(w => {
        const wordKey = `${subKey}||${w}`;
        nodeDataArray.push({ key: wordKey, text: w, color: "#ddd" });
        linkDataArray.push({ from: subKey, to: wordKey });
      });
    }
  }

  // Node template
  diagram.nodeTemplate = $(
    go.Node,
    "Auto",
    {
      click: showContext
    },
    $(go.Shape, "RoundedRectangle",
      {
        fill: "#ffffff", strokeWidth: 2, stroke: "#999",
        minSize: new go.Size(100, 40)
      },
      new go.Binding("fill", "color")
    ),
    $(go.TextBlock,
      {
        margin: 8,
        font: "14px sans-serif",
        wrap: go.TextBlock.WrapFit,
        textAlign: "center",
        width: 100
      },
      new go.Binding("text", "text")
    )
  );

  diagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);
  container.style.display = "block";

  console.log("✅ Mindmap gegenereerd. NodeData:", nodeDataArray, "LinkData:", linkDataArray);
}

/** 
 * 5. showContext: klik op een woord => laat context zien
 */
function showContext(e, obj) {
  if (!obj || !obj.part || !obj.part.data) return;
  const data = obj.part.data;
  const woord = data.text;

  const detailsDiv = document.getElementById("contextDetails");
  const contextText = document.getElementById("contextText");

  if (!detailsDiv || !contextText) return;

  if (woordContext[woord]) {
    detailsDiv.style.display = "block";
    const arr = [...woordContext[woord]];
    contextText.innerHTML = `<strong>Context van "${woord}":</strong><br>` + arr.join("<br><br>");
  } else {
    detailsDiv.style.display = "block";
    contextText.innerHTML = `<strong>Geen context beschikbaar voor "${woord}".</strong>`;
  }
}
