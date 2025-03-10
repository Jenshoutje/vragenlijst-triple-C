/** Globale opslag voor stopwoorden en thematische data **/
let stopwoorden = new Set();
let thematischeData = {};  // Structuur: { mainTheme: { subTheme: Set([...]) } }
let isCsvLoaded = false;   // Controle of CSV is geladen
let woordContext = {};     // Bewaart context per woord

document.addEventListener("DOMContentLoaded", async function () {
    console.log("📌 JavaScript geladen: Start Mindmap-setup...");

    if (typeof go === "undefined") {
        console.error("❌ GoJS library niet geladen. Controleer je HTML-bestand.");
        alert("Er is een fout opgetreden bij het laden van de mindmap. Controleer je verbinding.");
        return;
    }

    // Zoek knoppen en tekstvelden
    let analyseButton = document.getElementById("analyseButton");
    let exportButton = document.getElementById("exportButton");
    let inputText = document.getElementById("inputText");
    let mindmapContainer = document.getElementById("mindmap-container");

    if (!analyseButton || !exportButton || !inputText || !mindmapContainer) {
        console.error("❌ Belangrijke HTML-elementen ontbreken. Controleer je HTML-structuur.");
        return;
    }

    /** Laad CSV-bestand en verwerk de 4 kolommen **/
    async function loadCSV() {
        try {
            const response = await fetch("data/thematische_analyse.csv");
            const text = await response.text();
            // Verwijder de headerregel
            const rows = text.split("\n").slice(1);

            rows.forEach(row => {
                // Gebruik regex om te splitsen, zodat komma's binnen aanhalingstekens behouden blijven
                const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                if (columns.length >= 4) {
                    const mainTheme = columns[0].trim();
                    const subTheme = columns[1].trim();
                    // Verwijder eventuele omringende quotes en splits op komma's
                    const kernwoorden = columns[2].replace(/^"|"$/g, '').split(",").map(word => word.trim()).filter(word => word);
                    const synoniemen = columns[3].replace(/^"|"$/g, '').split(",").map(word => word.trim()).filter(word => word);

                    console.log("Main theme:", mainTheme, "Subtheme:", subTheme, "Kernwoorden:", kernwoorden, "Synoniemen:", synoniemen);

                    // Als het hoofdthema 'stopwoorden' is, voeg de woorden toe aan de stopwoorden-set
                    if (mainTheme.toLowerCase() === "stopwoorden") {
                        kernwoorden.forEach(word => stopwoorden.add(word));
                        synoniemen.forEach(word => stopwoorden.add(word));
                    } else {
                        if (!thematischeData[mainTheme]) {
                            thematischeData[mainTheme] = {};
                        }
                        if (!thematischeData[mainTheme][subTheme]) {
                            thematischeData[mainTheme][subTheme] = new Set();
                        }
                        kernwoorden.forEach(word => {
                            thematischeData[mainTheme][subTheme].add(word);
                        });
                        synoniemen.forEach(word => {
                            thematischeData[mainTheme][subTheme].add(word);
                        });
                    }
                }
            });

            isCsvLoaded = true;
            console.log("✅ CSV succesvol geladen:", thematischeData);

        } catch (error) {
            console.error("❌ Fout bij het laden van CSV:", error);
        }
    }

    await loadCSV(); // Wacht tot CSV volledig is geladen voordat de analyse start

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
        // Controleer of er thema's (met subthema's) gevonden zijn
        let hasThemes = false;
        for (let main in themes.clusters) {
            for (let sub in themes.clusters[main]) {
                if (themes.clusters[main][sub].length > 0) {
                    hasThemes = true;
                    break;
                }
            }
        }
        if (!hasThemes) {
            alert("⚠️ Er zijn geen thema's gevonden in de tekst. Probeer een andere invoer.");
            return;
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

/** Stopwoorden filteren uit tekst **/
function filterStopwoorden(text) {
    // Bouw regex op basis van de inhoud van de stopwoorden-set
    let regex = new RegExp("\\b(" + [...stopwoorden].join("|") + ")\\b", "gi");
    let gefilterdeTekst = text.replace(regex, "").trim();
    return gefilterdeTekst;
}

/** Thematische analyse uitvoeren met hiërarchie (main theme > subtheme) **/
function analyseZinnen(text) {
    let woorden = text.toLowerCase().split(/\s+/);
    let clusters = {};
    let zinnen = text.split('.'); // Splits de tekst in zinnen
    let woordToegewezen = {}; // Houdt bij welk woord al gekoppeld is

    // Initialiseert clusters met dezelfde hiërarchische structuur als in thematischeData
    Object.keys(thematischeData).forEach(mainTheme => {
        if (mainTheme.toLowerCase() === "stopwoorden") return;
        clusters[mainTheme] = {};
        Object.keys(thematischeData[mainTheme]).forEach(subTheme => {
            clusters[mainTheme][subTheme] = [];
        });
    });

    // Analyseer elk woord
    woorden.forEach(woord => {
        woord = woord.trim();
        console.log(`Analyseer woord: "${woord}"`);
        for (let mainTheme in thematischeData) {
            if (mainTheme.toLowerCase() === "stopwoorden") continue;
            for (let subTheme in thematischeData[mainTheme]) {
                if (thematischeData[mainTheme][subTheme].has(woord)) {
                    console.log(`Match gevonden! "${woord}" in mainTheme "${mainTheme}" -> subTheme "${subTheme}"`);
                    // Gebruik een composiet-sleutel om dubbele toewijzing te voorkomen
                    let compositeKey = mainTheme + "||" + subTheme + "||" + woord;
                    if (!woordToegewezen[compositeKey]) {
                        clusters[mainTheme][subTheme].push(woord);
                        woordToegewezen[compositeKey] = true;

                        // Bewaar de context: voeg de zinnen toe waarin het woord voorkomt
                        if (!woordContext[woord]) {
                            woordContext[woord] = new Set();
                        }
                        zinnen.forEach(z => {
                            if (z.toLowerCase().includes(woord)) {
                                woordContext[woord].add(z.trim());
                            }
                        });
                    }
                }
            }
        }
    });

    console.log("✅ Clusters na analyse:", clusters);
    return { clusters, woordContext };
}

/** Kleuren toewijzen aan hoofdthema's **/
const kleuren = ["#FF9999", "#99FF99", "#66B2FF", "#FFD700", "#FFA07A"];
function getColorBySentiment(theme) {
    let index = Object.keys(thematischeData).indexOf(theme) % kleuren.length;
    return kleuren[index] || "#D3D3D3"; // Grijs als fallback
}

/** Mindmap genereren met TreeLayout en hiërarchische structuur **/
function generateMindmap(themesData) {
    let mindmapContainer = document.getElementById("mindmap");
    if (!mindmapContainer) return;

    let clusters = themesData?.clusters || {};

    // Verwijder eventuele bestaande mindmap
    let existingDiagram = go.Diagram.fromDiv("mindmap");
    if (existingDiagram) {
        existingDiagram.clear();
        existingDiagram.div = null; // Voorkomt geheugenlekken
    }

    let $ = go.GraphObject.make;
    let diagram = $(go.Diagram, "mindmap", {
        "undoManager.isEnabled": true,
        layout: $(go.TreeLayout, {
            angle: 90,                         // Boom groeit van boven naar beneden
            layerSpacing: 100,                 // Vergroot de afstand tussen de niveaus
            nodeSpacing: 30,                   // Vergroot de afstand tussen de knopen op hetzelfde niveau
            arrangement: go.TreeLayout.ArrangementVertical,
            alignment: go.TreeLayout.AlignmentCenter,
        }),
        initialContentAlignment: go.Spot.Center,
        // autoScale niet gebruiken zodat de layout niet wordt samengedrukt
    });

    let nodeDataArray = [];
    let linkDataArray = [];

    // Voeg een dummy rootnode toe met de tekst "Triple C implementatie"
    nodeDataArray.push({ key: "ROOT", text: "Triple C implementatie", color: "#fff" });

    // Bouw de hiërarchie: main theme > subtheme > woord
    Object.keys(clusters).forEach(mainTheme => {
        // Controleer of het hoofdthema ten minste één subthema met woorden bevat
        let hasWords = false;
        for (let sub in clusters[mainTheme]) {
            if (clusters[mainTheme][sub].length > 0) {
                hasWords = true;
                break;
            }
        }
        if (hasWords) {
            let mainColor = getColorBySentiment(mainTheme);
            // Voeg hoofdthema-node toe
            nodeDataArray.push({ key: mainTheme, text: mainTheme, color: mainColor });
            // Koppel hoofdthema aan de dummy root
            linkDataArray.push({ from: "ROOT", to: mainTheme });

            // Itereer door de subthema's
            Object.keys(clusters[mainTheme]).forEach(subTheme => {
                if (clusters[mainTheme][subTheme].length > 0) {
                    // Gebruik een samengestelde sleutel voor subthema's
                    let subKey = mainTheme + "||" + subTheme;
                    nodeDataArray.push({ key: subKey, text: subTheme, color: "#EEE" });
                    linkDataArray.push({ from: mainTheme, to: subKey });

                    // Voeg per subthema de individuele woorden toe
                    clusters[mainTheme][subTheme].forEach(word => {
                        let wordKey = subKey + "||" + word;
                        nodeDataArray.push({ key: wordKey, text: word, color: "#ddd" });
                        linkDataArray.push({ from: subKey, to: wordKey });
                    });
                }
            });
        }
    });

    // Mindmap-template met klikbare knoppen
    diagram.nodeTemplate = $(go.Node, "Auto",
        {
            click: showContext,
            mouseEnter: (e, obj) => { obj.findObject("SHAPE").stroke = "#ff0000"; },
            mouseLeave: (e, obj) => { obj.findObject("SHAPE").stroke = "#888"; }
        },
        $(go.Shape, "RoundedRectangle", 
            {
                name: "SHAPE",
                fill: "#f9f9f9",
                strokeWidth: 2,
                stroke: "#888",
                minSize: new go.Size(120, 50)
            },
            new go.Binding("fill", "color")
        ),
        $(go.TextBlock,
            {
                margin: 12,
                font: "bold 14px Arial",
                textAlign: "center",
                wrap: go.TextBlock.WrapFit,
                width: 120
            },
            new go.Binding("text", "text")
        )
    );

    diagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);
    mindmapContainer.style.display = "block";

    console.log("✅ Mindmap met dummy root en verbeterde TreeLayout gegenereerd.");
}

/** Functie voor contextweergave: toont de originele zinnen waarin een woord voorkomt **/
function showContext(event, obj) {
    if (!obj || !obj.part || !obj.part.data) {
        console.error("❌ Ongeldige objectgegevens:", obj);
        return;
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
