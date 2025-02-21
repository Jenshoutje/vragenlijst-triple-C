// **Globale opslag voor stopwoorden en thematische data**\\
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
    let zinnen = text.match(/[^.!?]+[.!?]+/g) || []; // Verbeterde zinsdetectie
    let clusters = {};
    let woordContext = {};
    let frequentie = {};  

    const MIN_FREQ = 2; 

    Object.keys(thematischeData).forEach(categorie => {
        clusters[categorie] = [];
    });

    zinnen.forEach(zin => {
        let woorden = zin.split(/\s+/);
        woorden.forEach(word => {
            
            frequentie[word] = (frequentie[word] || 0) + 1;

            Object.keys(thematischeData).forEach(categorie => {
                if (thematischeData[categorie].has(word) && frequentie[word] >= MIN_FREQ) {  
                    if (!clusters[categorie].includes(word)) {
                        clusters[categorie].push(word);
                    }

                    if (!woordContext[word]) {
                        woordContext[word] = new Set();
                    }
                    woordContext[word].add(zin);
                }
            });
        });
    });

    console.log("✅ AI-clustering uitgevoerd:", clusters);
    console.log("📌 Woord-context mapping:", woordContext);
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

    var $ = go.GraphObject.make;
    let diagram = $(go.Diagram, "mindmap", {
        "undoManager.isEnabled": true,
        layout: $(go.TreeLayout, { 
            angle: 0, // 🔄 Zorgt voor horizontale spreiding
            layerSpacing: 150, // 🔄 Grotere afstand tussen lagen
            nodeSpacing: 80, // 🔄 Meer ruimte tussen knooppunten
            alignment: go.TreeLayout.AlignmentStart, // 🔄 Zorgt voor nettere uitlijning
        }),
        initialContentAlignment: go.Spot.Center,
        autoScale: go.Diagram.Uniform,
        background: "lightblue"  // Stel de achtergrond in
    });

    let nodeDataArray = [];
    let linkDataArray = [];

    Object.keys(clusters).forEach((theme) => {
        let color = getColorBySentiment(theme);
        nodeDataArray.push({ key: theme, text: theme, color: color });

        let uniqueWords = new Set(clusters[theme]);  // ✅ Voorkom herhaling van woorden

        uniqueWords.forEach((word) => {
            nodeDataArray.push({ key: word, text: word, color: "#ddd" });
            linkDataArray.push({ from: theme, to: word });
        });
    });

    // **Mindmap-template met klikbare knoppen**
    diagram.nodeTemplate = $(go.Node, "Auto",
        { click: showContext },
        $(go.Shape, "RoundedRectangle", 
            { fill: "white", strokeWidth: 1, minSize: new go.Size(120, 50) }, // ✅ Grotere en nettere knooppunten
            new go.Binding("fill", "color")
        ),
        $(go.TextBlock,
            { margin: 12, font: "bold 14px Arial", textAlign: "center", wrap: go.TextBlock.WrapFit, width: 120 }, // ✅ Betere leesbaarheid
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
