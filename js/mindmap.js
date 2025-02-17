// **Globale opslag voor stopwoorden en thematische data**
let stopwoorden = new Set();  
let thematischeData = {};  
let isCsvLoaded = false; // ✅ Check of CSV volledig is geladen

document.addEventListener("DOMContentLoaded", async function () {
    console.log("📌 JavaScript geladen: Start Mindmap-setup...");

    if (typeof go === "undefined") {
        console.error("❌ GoJS library niet geladen. Controleer je HTML-bestand.");
        alert("Er is een fout opgetreden bij het laden van de mindmap. Controleer je verbinding.");
        return;
    }

    // **Zoek knoppen en tekstvelden**
    let analyseButton = document.getElementById("analyseButton");
    let exportButton = document.getElementById("exportButton");
    let inputText = document.getElementById("inputText");
    let mindmapContainer = document.getElementById("mindmap-container");

    if (!analyseButton || !exportButton || !inputText || !mindmapContainer) {
        console.error("❌ Belangrijke HTML-elementen ontbreken. Controleer je HTML-structuur.");
        return;
    }

    // **Laad CSV-bestand**
    async function loadCSV() {
        try {
            const response = await fetch("data/thematische_analyse.csv");
            const text = await response.text();
            const rows = text.split("\n").slice(1);

            rows.forEach(row => {
                const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

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

            isCsvLoaded = true; // ✅ CSV is correct geladen
            console.log("✅ CSV succesvol geladen:", thematischeData);

        } catch (error) {
            console.error("❌ Fout bij het laden van CSV:", error);
        }
    }

    await loadCSV(); // Wacht tot CSV is geladen voordat analyse start

    analyseButton.addEventListener("click", function () {
        if (!isCsvLoaded) {
            alert("⚠ CSV is nog niet volledig geladen, probeer het opnieuw.");
            return;
        }

        let text = inputText.value.trim();
        if (text === "") {
            alert("Voer eerst tekst in!");
            return;
        }

let filteredText = filterStopwoorden(text);
console.log("✅ Gefilterde tekst na stopwoorden:", filteredText);

let themes = analyseZinnen(filteredText);
if (!themes || !themes.clusters) {
    console.error("❌ Fout: `analyseZinnen()` retourneert een ongeldige waarde:", themes);
    return;
}

console.log("✅ Thema’s na analyse:", themes);
generateMindmap(themes);
    });

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
    if (!stopwoorden || stopwoorden.size === 0) {
        console.warn("⚠️ Stopwoorden zijn nog niet volledig geladen.");
        return text;
    }

    let woorden = text.toLowerCase().split(/\s+/);
    let gefilterdeWoorden = woorden.filter(word => !stopwoorden.has(word));

    console.log("✅ Gefilterde woorden:", gefilterdeWoorden);
    return gefilterdeWoorden.join(" ");
}

function analyseZinnen(text) {
    let zinnen = text.toLowerCase().split(/[.!?]+/).map(zin => zin.trim()).filter(zin => zin.length > 0);
    let clusters = {};
    let woordContext = {};  // ✅ Context per woord opslaan

    Object.keys(thematischeData).forEach(categorie => {
        clusters[categorie] = [];
    });

    zinnen.forEach(zin => {
        let woorden = zin.split(/\s+/);  // ✅ Splits zin in losse woorden

        woorden.forEach(word => {
            Object.keys(thematischeData).forEach(categorie => {
                if (thematischeData[categorie].has(word)) {
                    clusters[categorie].push(word);

                    if (!woordContext[word]) {
                        woordContext[word] = new Set();  // ✅ Gebruik een Set om dubbele zinnen te vermijden
                    }
                    woordContext[word].add(zin);
                }
            });
        });
    });

    console.log("✅ AI-clustering uitgevoerd:", clusters);
    console.log("📌 Woord-context mapping:", woordContext);
    return { clusters, woordContext };  // ✅ Retourneert clusters en context voor woorden
}

function getColorBySentiment(theme) {
    if (theme.includes("Werkdruk")) return "#FF9999"; // Rood voor negatief
    if (theme.includes("Ondersteuning")) return "#99FF99"; // Groen voor positief
    if (theme.includes("Cliënt")) return "#66B2FF"; // Blauw voor zorg-gerelateerd
    return "#FFD700"; // Geel voor neutraal
}
// **Mindmap genereren met GoJS**
function generateMindmap(themesData) {
    let mindmapContainer = document.getElementById("mindmap");
    if (!mindmapContainer) {
        console.error("❌ Mindmap container niet gevonden.");
        return;
    }

    let { clusters, woordContext } = themesData;  // ✅ Clusters en context ophalen

    // Verwijder bestaand diagram als die al bestaat
    let existingDiagram = go.Diagram.fromDiv("mindmap");
    if (existingDiagram) {
        existingDiagram.div = null;
    }

    let $ = go.GraphObject.make;
    let diagram = $(go.Diagram, "mindmap", {
        "undoManager.isEnabled": true,
    
        layout: $(go.TreeLayout, { 
    angle: 90, 
    layerSpacing: 60,  // Vergroot de afstand tussen lagen voor meer overzicht
    nodeSpacing: 50,    // Ruimte tussen de nodes voor meer leesbaarheid
    breadthLimit: 600,  // Zorgt ervoor dat nodes logischer verdeeld worden
    alignment: go.TreeLayout.AlignmentStart  // Zorgt voor strakkere ordening
})
    });

    let nodeDataArray = [];
    let linkDataArray = [];

    
Object.keys(clusters).forEach((theme) => {
    if (clusters[theme].length > 0) {
        let color = getColorBySentiment(theme);
        nodeDataArray.push({ key: theme, text: theme, color: color });

        let uniqueWords = new Set(clusters[theme]);  // ✅ Voorkom dubbele woorden

uniqueWords.forEach((word, wordIndex) => {
    let groupIndex = Math.floor(wordIndex / 5); // Maak clusters van 5 woorden
    let groupKey = `${theme}-group-${groupIndex}`;

    // Voeg groep toe als die nog niet bestaat
    if (!nodeDataArray.some(node => node.key === groupKey)) {
        nodeDataArray.push({ key: groupKey, text: `Cluster ${groupIndex + 1}`, color: "#bbb" });
        linkDataArray.push({ from: theme, to: groupKey });
    }

    // Voeg het woord toe onder de groep
    let wordKey = `${theme}-${wordIndex}`;
    nodeDataArray.push({ key: wordKey, text: word, color: "#ddd" });
    linkDataArray.push({ from: groupKey, to: wordKey });
}

    });
    

diagram.nodeTemplate = $(go.Node, "Auto",
    { 
        click: function (event, obj) {  // ✅ Event-handler op Node in plaats van TextBlock
            let woord = obj.part.data.text;
            let detailsDiv = document.getElementById("contextDetails");
            let contextText = document.getElementById("contextText");

            if (woordContext && woordContext[woord]) {  // ✅ Controleer of woordContext bestaat
                detailsDiv.style.display = "block";
                contextText.innerHTML = `<strong>Context van "${woord}":</strong><br>` + [...woordContext[woord]].join("<br>");
            } else {
                detailsDiv.style.display = "block";
                contextText.innerHTML = `<strong>Context van "${woord}":</strong><br>Geen extra context beschikbaar.`;
            }
        }
    },
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
mindmapContainer.style.display = "block";

console.log("✅ Mindmap met interactie gegenereerd.");
