// **Globale opslag voor stopwoorden en thematische data**\\
let stopwoorden = new Set();
let thematischeData = {};
let isCsvLoaded = false; // ✅ Controle of CSV is geladen
let woordContext = {}; // Zorg ervoor dat deze variabele is gedefinieerd

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

                    console.log("Categorie:", categorie, "Kernwoord:", kernwoord, "Synoniemen:", synoniemen); // Debugging

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
            alert("⚠️ Er zijn geen thema's gevonden in de tekst. Probeer een andere invoer.");
            return; // Fallback als er geen thema's zijn
        }

        console.log("✅ Thema's na analyse:", themes);
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
    let regex = new RegExp("\\b(" + [...stopwoorden].join("|") + ")\\b", "gi");
    let gefilterdeTekst = text.replace(regex, "").trim();
    return gefilterdeTekst;
}

// **Thematische analyse uitvoeren**
function analyseZinnen(text) {
    let woorden = text.toLowerCase().split(/\s+/);
    let clusters = {};
    
    // Initialiseer clusters
    Object.keys(thematischeData).forEach(categorie => {
        if (categorie !== 'stopwoorden') {
            clusters[categorie] = [];
        }
    });

    // Analyseer elk woord
    woorden.forEach(woord => {
        woord = woord.trim();
        console.log(`Analyseer woord: "${woord}"`);
        
        Object.keys(thematischeData).forEach(categorie => {
            if (categorie === 'stopwoorden') return;
            
            // Check of het woord in de thematische data voorkomt
            if (thematischeData[categorie].has(woord)) {
                console.log(`Match gevonden! "${woord}" in categorie "${categorie}"`);
                if (!clusters[categorie].includes(woord)) {
                    clusters[categorie].push(woord);
                    
                    // Bewaar context
                    if (!woordContext[woord]) {
                        woordContext[woord] = new Set();
                    }
                    woordContext[woord].add(text);
                }
            }
        });
    });

    console.log("✅ Clusters na analyse:", clusters);
    return { clusters, woordContext };
}

// **Kleuren toewijzen aan thema's**
const kleuren = ["#FF9999", "#99FF99", "#66B2FF", "#FFD700", "#FFA07A"];
function getColorBySentiment(theme) {
    let index = Object.keys(thematischeData).indexOf(theme) % kleuren.length;
    return kleuren[index] || "#D3D3D3"; // Grijs als fallback
}

// **Mindmap genereren met TreeLayout**
function generateMindmap(themesData) {
    let mindmapContainer = document.getElementById("mindmap");
    if (!mindmapContainer) return;

    let clusters = themesData?.clusters || {};
    let woordContext = themesData?.woordContext || {};

    // ✅ Verwijder bestaande mindmap correct
    let existingDiagram = go.Diagram.fromDiv("mindmap");
    if (existingDiagram) {
        existingDiagram.clear();
        existingDiagram.div = null; // Voorkomt geheugenlekken
    }

    let $ = go.GraphObject.make;
    let diagram = $(go.Diagram, "mindmap", {
        "undoManager.isEnabled": true,
        layout: $(go.TreeLayout, {
            angle: 0,
            layerSpacing: 80,
            nodeSpacing: 40,
        }),
        initialContentAlignment: go.Spot.Center,
        autoScale: go.Diagram.Uniform,
    });

    let nodeDataArray = [];
    let linkDataArray = [];

    // Voeg alleen thema's toe die woorden bevatten
    Object.keys(clusters).forEach((theme) => {
        if (clusters[theme].length > 0) { // Controleer of er woorden zijn
            let color = getColorBySentiment(theme);
            nodeDataArray.push({ key: theme, text: theme, color: color });

            let uniqueWords = new Set(clusters[theme]);

            uniqueWords.forEach((word) => {
                nodeDataArray.push({ key: word, text: word, color: "#ddd" });
                linkDataArray.push({ from: theme, to: word });
            });
        }
    });

    // **Mindmap-template met klikbare knoppen**
    diagram.nodeTemplate = $(go.Node, "Auto",
        { click: showContext },
        $(go.Shape, "RoundedRectangle", 
            { fill: "white", strokeWidth: 1, minSize: new go.Size(120, 50) },
            new go.Binding("fill", "color")
        ),
        $(go.TextBlock,
            { margin: 12, font: "bold 14px Arial", textAlign: "center", wrap: go.TextBlock.WrapFit, width: 120 },
            new go.Binding("text", "text")
        )
    );

    diagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);
    mindmapContainer.style.display = "block";

    console.log("✅ Mindmap met verbeterde TreeLayout gegenereerd.");
}

// **Functie voor contextweergave**
function showContext(event, obj) {
    if (!obj || !obj.part || !obj.part.data) {
        console.error("❌ Ongeldige objectgegevens:", obj);
        return; // Voorkom fouten als obj niet geldig is
    }

    let woord = obj.part.data.text;
    let detailsDiv = document.getElementById("contextDetails");
    let contextText = document.getElementById("contextText");

    if (woordContext && woordContext[woord]) {
        detailsDiv.style.display = "block";
        contextText.innerHTML = `<strong>Context van "${woord}":</strong><br>` + [...woordContext[woord]].join("<br>");
    } else {
        console.warn("⚠️ Geen context gevonden voor het woord:", woord);
        contextText.innerHTML = `<strong>Geen context beschikbaar voor "${woord}".</strong>`;
    }
}
