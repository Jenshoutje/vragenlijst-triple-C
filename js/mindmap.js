// **Globale opslag voor stopwoorden en thematische data**
let stopwoorden = new Set();
let thematischeData = {};
let isCsvLoaded = false; // ✅ Controle of CSV is geladen

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

            isCsvLoaded = true;
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
        if (!themes || !themes.clusters || Object.keys(themes.clusters).length === 0) {
            console.error("❌ Fout: `analyseZinnen()` retourneert een ongeldige of lege waarde:", themes);
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
    let woorden = text.toLowerCase().split(/\s+/);
    let gefilterdeWoorden = woorden.filter(word => !stopwoorden.has(word));
    return gefilterdeWoorden.join(" ");
}

// **Thematische analyse uitvoeren**
function analyseZinnen(text) {
    let zinnen = text.toLowerCase().split(/[.!?]+/).map(zin => zin.trim()).filter(zin => zin.length > 0);
    let clusters = {};
    let woordContext = {};
    let frequentie = {};  // ✅ Houd bij hoe vaak elk woord voorkomt

    const MIN_FREQ = 2; // 🔥 Pas deze waarde aan om te bepalen vanaf welke frequentie een woord meetelt

    Object.keys(thematischeData).forEach(categorie => {
        clusters[categorie] = [];
    });

    zinnen.forEach(zin => {
        let woorden = zin.split(/\s+/);
        woorden.forEach(word => {
            if (!frequentie[word]) {
                frequentie[word] = 0;
            }
            frequentie[word]++;  // ✅ Tel hoe vaak een woord voorkomt

            Object.keys(thematischeData).forEach(categorie => {
                if (thematischeData[categorie].has(word)) {
                    if (frequentie[word] >= MIN_FREQ) {  // ✅ Filter woorden die te weinig voorkomen
                        if (!clusters[categorie].includes(word)) {  // ✅ Voorkom dubbele woorden per categorie
                            clusters[categorie].push(word);
                        }

                        if (!woordContext[word]) {
                            woordContext[word] = new Set();
                        }
                        woordContext[word].add(zin);
                    }
                }
            });
        });
    });

    console.log("✅ AI-clustering uitgevoerd:", clusters);
    console.log("📌 Woord-context mapping:", woordContext);
    return { clusters, woordContext };
}

function getColorBySentiment(theme) {
    if (theme.includes("Werkdruk")) return "#FF9999"; // Rood voor negatieve thema's
    if (theme.includes("Ondersteuning")) return "#99FF99"; // Groen voor positieve thema's
    if (theme.includes("Cliënt")) return "#66B2FF"; // Blauw voor zorg-gerelateerde thema's
    return "#FFD700"; // Geel als standaardkleur
}

// **Mindmap genereren met Radiale lay-out**
function generateMindmap(themesData) {
    let mindmapContainer = document.getElementById("mindmap");
    if (!mindmapContainer) return;

    let clusters = themesData?.clusters || {};
    let woordContext = themesData?.woordContext || {};

    // ✅ Verwijder bestaande mindmap correct
    let existingDiagram = go.Diagram.fromDiv("mindmap");
    if (existingDiagram) {
        existingDiagram.clear();  // Verwijder alle nodes en links
    }

    let $ = go.GraphObject.make;
    let diagram = $(go.Diagram, "mindmap", {
        "undoManager.isEnabled": true,
        contentAlignment: go.Spot.Center,  // Zorgt ervoor dat de mindmap in het midden staat
        initialScale: 1.2,  // Zorgt ervoor dat de mindmap direct goed zichtbaar is
        autoScale: go.Diagram.Uniform,  // Past de grootte automatisch aan
    });

    let nodeDataArray = [];
    let linkDataArray = [];

    Object.keys(clusters).forEach((theme) => {
        let color = getColorBySentiment(theme);
        nodeDataArray.push({ key: theme, text: theme, color: color });

        clusters[theme].forEach((word, wordIndex) => {
            let wordKey = `${theme}-${wordIndex}`;
            nodeDataArray.push({ key: wordKey, text: word, color: "#ddd" });
            linkDataArray.push({ from: theme, to: wordKey });
        });
    });

    // **Force-Directed Lay-out voor betere spreiding**
    diagram.layout = $(go.ForceDirectedLayout, {
        defaultSpringLength: 200,  // Vergroot de afstand tussen knooppunten
        defaultElectricalCharge: 300,  // Zorgt voor een natuurlijke spreiding
        maxIterations: 1000,  // Zorgt voor stabiele plaatsing
        isOngoing: false  // Voorkomt dat de mindmap blijft bewegen
    });

    // **Mindmap-template met klikbare knoppen**
    diagram.nodeTemplate = $(go.Node, "Auto",
        { 
            click: function (event, obj) {
                let woord = obj.part.data.text;
                let detailsDiv = document.getElementById("contextDetails");
                let contextText = document.getElementById("contextText");

                if (woordContext && woordContext[woord]) {
                    detailsDiv.style.display = "block";
                    contextText.innerHTML = `<strong>Context van "${woord}":</strong><br>` + [...woordContext[woord]].join("<br>");
                } else {
                    detailsDiv.style.display = "block";
                    contextText.innerHTML = `<strong>Context van "${woord}":</strong><br>Geen extra context beschikbaar.`;
                }
            }
        },
        $(go.Shape, "RoundedRectangle", 
            { fill: "white", strokeWidth: 0, minSize: new go.Size(100, 40) },  // ✅ Grotere nodes voor leesbaarheid
            new go.Binding("fill", "color")
        ),
        $(go.TextBlock,
            { margin: 12, font: "bold 14px Arial", textAlign: "center" },  // ✅ Grotere tekst voor betere zichtbaarheid
            new go.Binding("text", "text")
        )
    );

    // **Model instellen na de layout**
    diagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);
    mindmapContainer.style.display = "block";

    console.log("✅ Mindmap met Force-Directed Layout gegenereerd.");
}
