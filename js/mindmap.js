document.addEventListener("DOMContentLoaded", async function () {
    // **Controleer of GoJS correct is geladen**
    if (typeof go === "undefined") {
        console.error("❌ GoJS library niet geladen. Controleer je HTML-bestand.");
        alert("Er is een fout opgetreden bij het laden van de mindmap. Controleer je verbinding.");
        return;
    }

    // **Zoek knoppen en tekstvelden**
    let analyseButton = document.getElementById("analyseButton");
    let exportButton = document.getElementById("exportButton");
    let inputText = document.getElementById("inputText");
    let mindmapContainer = document.getElementById("mindmap");

    if (!analyseButton || !exportButton || !inputText || !mindmapContainer) {
        console.error("❌ Belangrijke HTML-elementen ontbreken. Controleer je HTML-structuur.");
        return;
    }

    // **Globale opslag voor stopwoorden en thematische data**
    let stopwoorden = new Set();
    let thematischeData = {};

    // **Laad het CSV-bestand**
let stopwoorden = new Set();  // **❗️ Correct initialiseren**
let thematischeData = {};      // **❗️ Zorg dat dit object correct gevuld wordt**

async function loadCSV() {
    try {
        const response = await fetch("data/thematische_analyse.csv");
        const text = await response.text();
        const rows = text.split("\n").slice(1); // Headers overslaan

        rows.forEach(row => {
            const columns = row.split(",");
            if (columns.length >= 3) {
                const categorie = columns[0].trim();
                const kernwoord = columns[1].trim();
                const synoniemen = columns[2].split(";").map(word => word.trim());

                if (categorie.toLowerCase() === "stopwoorden") {
                    stopwoorden.add(kernwoord);
                    synoniemen.forEach(word => stopwoorden.add(word));
                } else {
                    if (!thematischeData[categorie]) {
                        thematischeData[categorie] = new Set();
                    }
                    thematischeData[categorie].add(kernwoord);
                    synoniemen.forEach(word => thematischeData[categorie].add(word));
                }
            }
        });

        console.log("✅ Stopwoorden geladen:", [...stopwoorden]);
        console.log("✅ Thematische data geladen:", thematischeData);
    } catch (error) {
        console.error("❌ Fout bij het laden van CSV:", error);
    }
}

// **Zorg dat de functie correct wordt uitgevoerd**
(async function() {
    await loadCSV();
})();

    // **Klik event voor de analyse-knop**
    analyseButton.addEventListener("click", function () {
        let text = inputText.value.trim();
        if (text === "") {
            alert("Voer eerst tekst in!");
            return;
        }

        let filteredText = filterStopwoorden(text);
        let themes = analyseTekst(filteredText);
        generateMindmap(themes);
    });

    // **Klik event voor de export-knop**
    exportButton.addEventListener("click", function () {
        let diagram = go.Diagram.fromDiv("mindmap");
        if (!diagram) {
            console.error("❌ Mindmap diagram niet gevonden.");
            return;
        }

        let imgData = diagram.makeImageData({ background: "white" });
        let a = document.createElement("a");
        a.href = imgData;
        a.download = "mindmap.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
});

// **Stopwoorden filteren uit tekst**
function filterStopwoorden(text) {
    let woorden = text.toLowerCase().split(/\s+/);
    let gefilterdeWoorden = woorden.filter(word => !stopwoorden.has(word));
    return gefilterdeWoorden.join(" ");
}

// **Thematische clustering met CSV-data**
function analyseTekst(text) {
    let woorden = text.toLowerCase().split(/\s+/);
    let clusters = {};

    Object.keys(thematischeData).forEach(categorie => {
        clusters[categorie] = [];
    });

    woorden.forEach(word => {
        Object.keys(thematischeData).forEach(categorie => {
            if (thematischeData[categorie].has(word)) {
                clusters[categorie].push(word);
            }
        });
    });

    return clusters;
}

// **Mindmap genereren met GoJS**
function generateMindmap(themes) {
    let mindmapContainer = document.getElementById("mindmap");
    if (!mindmapContainer) {
        console.error("❌ Mindmap container niet gevonden.");
        return;
    }

    // **Verwijder bestaand diagram als die al bestaat**
    let existingDiagram = go.Diagram.fromDiv("mindmap");
    if (existingDiagram) {
        existingDiagram.div = null; // Ontkoppel bestaand diagram
    }

    let $ = go.GraphObject.make;
    let diagram = $(go.Diagram, "mindmap", {
        "undoManager.isEnabled": true,
        layout: $(go.TreeLayout, { angle: 90, layerSpacing: 35 })
    });

    let nodeDataArray = [];
    let linkDataArray = [];

    Object.keys(themes).forEach((theme) => {
        if (themes[theme].length > 0) {
            let color = getColorBySentiment(theme);
            nodeDataArray.push({ key: theme, text: theme, color: color });

            themes[theme].forEach((subtheme, subIndex) => {
                let subKey = `${theme}-${subIndex}`;
                nodeDataArray.push({ key: subKey, text: subtheme, color: "#ddd" });
                linkDataArray.push({ from: theme, to: subKey });
            });
        }
    });

    diagram.nodeTemplate = $(go.Node, "Auto",
        $(go.Shape, "RoundedRectangle",
            { fill: "white", strokeWidth: 0 },
            new go.Binding("fill", "color")
        ),
        $(go.TextBlock,
            { margin: 8 },
            new go.Binding("text", "text")
        )
    );

    diagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);

    // **Toon de mindmap-container**
    mindmapContainer.style.display = "block";
}

// **Kleur bepalen op basis van sentiment**
function getColorBySentiment(theme) {
    if (theme.includes("Werkdruk")) return "#FF9999"; // Rood voor negatief
    if (theme.includes("Ondersteuning")) return "#99FF99"; // Groen voor positief
    if (theme.includes("Cliënt")) return "#66B2FF"; // Blauw voor zorg-gerelateerd
    return "#FFD700"; // Geel voor neutraal
}
