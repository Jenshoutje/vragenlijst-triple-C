// Alias voor GoJS GraphObject.make functie (voor kortere notation in templates)
const $ = go.GraphObject.make;

/**
 * Parse het CSV-bestand (als tekst) en bouw een node-data-array voor de mindmap.
 * @param {string} csvText - Inhoud van het CSV-bestand als string.
 * @return {Array<Object>} nodeDataArray - Array van node data objecten voor GoJS model.
 */
function parseCsvData(csvText) {
    // Bepaal delimiter (kijk of er ; in de tekst staat en vrijwel geen komma's)
    let delimiter = ',';
    if (csvText.indexOf(';') >= 0 && csvText.indexOf(',') === -1) {
        delimiter = ';';
    }
    const lines = csvText.trim().split(/\r?\n/);
    const nodeDataArray = [];
    let keyCounter = 0;
    // Voeg ROOT node toe
    nodeDataArray.push({ key: keyCounter, text: "Triple C implementatie", category: "Root" });
    const rootKey = keyCounter;
    keyCounter++;

    // Kleur toewijzing per thema
    const themeColorMap = {};
    const colors = ["#6FB1FC", "#FF928F", "#8DEB7A", "#FFDC59", "#A68BFF", "#FF8DDA", "#7FFFD4", "#FFA07A"];
    let colorIndex = 0;

    // Object om gemaakte thema/subthema/woord nodes bij te houden, om duplicaten te vermijden
    const createdNodes = { themes: {} };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;  // sla lege regels over
        const fields = line.split(delimiter);
        if (fields.length < 4) {
            console.error(`CSV regel ${i+1} heeft niet vier kolommen (gevonden ${fields.length}).`);
            continue;
        }
        // Haal waarden uit velden, verwijder eventuele quotes en trim spaties
        const themeName    = fields[0].replace(/^"|"$/g, '').trim();
        const subthemeName = fields[1].replace(/^"|"$/g, '').trim();
        const keyword      = fields[2].replace(/^"|"$/g, '').trim();
        const synonymsField= fields[3].replace(/^"|"$/g, '').trim();

        if (!themeName || !subthemeName || !keyword) {
            console.error(`CSV regel ${i+1} mist vereiste gegevens (thema, subthema of kernwoord).`);
            continue;
        }
        // Wijs kleur toe aan thema (als nieuw)
        if (!themeColorMap[themeName]) {
            themeColorMap[themeName] = colors[colorIndex % colors.length];
            colorIndex++;
        }
        const color = themeColorMap[themeName];

        // Maak thema-node aan indien nog niet gedaan
        if (!createdNodes.themes[themeName]) {
            const themeNode = { key: keyCounter++, parent: rootKey, text: themeName, color: color };
            nodeDataArray.push(themeNode);
            createdNodes.themes[themeName] = { key: themeNode.key, subthemes: {} };
        }
        const themeKey = createdNodes.themes[themeName].key;

        // Maak subthema-node aan indien nodig
        if (!createdNodes.themes[themeName].subthemes[subthemeName]) {
            const subNode = { key: keyCounter++, parent: themeKey, text: subthemeName, color: color };
            nodeDataArray.push(subNode);
            createdNodes.themes[themeName].subthemes[subthemeName] = { key: subNode.key, keywords: {} };
        }
        const subKey = createdNodes.themes[themeName].subthemes[subthemeName].key;

        // Maak kernwoord-node aan indien nodig
        if (!createdNodes.themes[themeName].subthemes[subthemeName].keywords[keyword]) {
            const keyNode = { key: keyCounter++, parent: subKey, text: keyword, color: color, contextSentences: [] };
            nodeDataArray.push(keyNode);
            createdNodes.themes[themeName].subthemes[subthemeName].keywords[keyword] = { key: keyNode.key, synonyms: {} };
        }
        const keywordKey = createdNodes.themes[themeName].subthemes[subthemeName].keywords[keyword].key;

        // Maak synoniem-nodes aan voor alle synoniemen (gescheiden door komma of puntkomma)
        let synonyms = [];
        if (synonymsField) {
            synonyms = synonymsField.split(/[;,]/).map(s => s.trim()).filter(s => s);
        }
        synonyms.forEach(syn => {
            if (!createdNodes.themes[themeName].subthemes[subthemeName].keywords[keyword].synonyms[syn]) {
                const synNode = { key: keyCounter++, parent: keywordKey, text: syn, color: color, contextSentences: [] };
                nodeDataArray.push(synNode);
                createdNodes.themes[themeName].subthemes[subthemeName].keywords[keyword].synonyms[syn] = synNode.key;
            }
        });
    }
    return nodeDataArray;
}

/**
 * Doorzoek de tekst en vul de contextzinnen in bij de nodes.
 * @param {string} text - De ingevoerde tekst.
 * @param {Array<Object>} nodeDataArray - Array met node data (output van parseCsvData).
 */
function findContextSentences(text, nodeDataArray) {
    // Split de tekst in zinnen (simple aanpak op punten, vraagtekens, uitroeptekens)
    const sentences = text.split(/(?<=[\.!?])\s+(?=[A-Za-z])/).map(s => s.trim()).filter(s => s);
    nodeDataArray.forEach(node => {
        if (!node.contextSentences) return;  // alleen kernwoorden/synoniemen hebben deze property
        node.contextSentences.length = 0;    // reset eventuele eerdere inhoud
        const word = node.text;
        // Regex voor het woord (case-insensitive, gehele woord)
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        sentences.forEach(sentence => {
            if (regex.test(sentence)) {
                node.contextSentences.push(sentence);
            }
        });
    });
}

/**
 * Event handler voor klik op een node in de mindmap.
 * Toont de bijbehorende contextzinnen onderaan de pagina.
 * @param {go.Node} node - De aangeklikte GoJS node.
 */
function onNodeClick(node) {
    const data = node.data;
    const contextDiv = document.getElementById("contextOutput");
    if (!contextDiv) {
        console.warn("Context output element niet gevonden.");
        return;
    }
    contextDiv.innerHTML = "";  // schoon vorige inhoud
    if (data.contextSentences && data.contextSentences.length > 0) {
        let html = `<h3>Contextzinnen voor: ${data.text}</h3><ul>`;
        data.contextSentences.forEach(sentence => {
            html += `<li>${sentence}</li>`;
        });
        html += "</ul>";
        contextDiv.innerHTML = html;
    } else {
        contextDiv.innerHTML = `<p><em>Geen contextzinnen gevonden voor: ${data.text}</em></p>`;
    }
}

/**
 * Genereer de GoJS mindmap op basis van gegeven CSV-tekst en invoertekst.
 * @param {string} csvText - Inhoud van het CSV-bestand als string.
 * @param {string} inputText - Ingevoerde tekst om te analyseren.
 */
function generateMindmap(csvText, inputText) {
    // Parse CSV naar nodeDataArray
    const nodeDataArray = parseCsvData(csvText);
    if (nodeDataArray.length === 0) {
        console.error("Geen geldige data uit CSV verkregen.");
        return;
    }
    // Zoek contextzinnen in de input tekst
    findContextSentences(inputText || "", nodeDataArray);
    // Zoek het diagram div element
    const diagramDiv = document.getElementById("myDiagramDiv");
    if (!diagramDiv) {
        console.error("Diagram container niet gevonden (controleer het ID).");
        return;
    }
    // Initialiseer GoJS Diagram
    const myDiagram = $(go.Diagram, diagramDiv, {
        initialAutoScale: go.Diagram.Uniform,
        layout: $(RadialLayout, {
            rotateNode: function(node, angle) {
                // Draai tekstlabels zodat ze leesbaar blijven
                const tb = node.findObject("TEXTBLOCK");
                if (tb) tb.angle = (angle > 90 && angle < 270) ? 180 : 0;
            }
        }),
        isReadOnly: true  // geen interactie behalve klikken
    });
    // Template voor reguliere nodes (Thema, Subthema, Kernwoord, Synoniem)
    myDiagram.nodeTemplate = $(
        go.Node, "Auto",
        { selectionAdorned: false, cursor: "pointer", click: (e, node) => onNodeClick(node) },
        $(go.Shape, "Circle",
          { name: "SHAPE", fill: "lightgray", stroke: null, strokeWidth: 0, desiredSize: new go.Size(16, 16) },
          new go.Binding("fill", "color")),
        $(go.TextBlock,
          { name: "TEXTBLOCK", font: "10pt sans-serif", margin: 4 },
          new go.Binding("text", "text"))
    );
    // Template voor de root node (categorie "Root")
    myDiagram.nodeTemplateMap.add("Root", $(
        go.Node, "Auto",
        { selectionAdorned: false },
        $(go.Shape, "Circle", { fill: "white", stroke: "gray", strokeWidth: 2, desiredSize: new go.Size(30, 30) }),
        $(go.TextBlock, { font: "bold 12pt sans-serif", margin: 5 },
          new go.Binding("text", "text"))
    ));
    // Template voor links (kromme lijnen met pijlen)
    myDiagram.linkTemplate = $(
        go.Link,
        { curve: go.Link.Bezier, selectable: false },
        $(go.Shape, { strokeWidth: 1, stroke: "#AAA" }),
        $(go.Shape, { toArrow: "Standard", stroke: "#AAA", fill: "#AAA" })
    );
    // Stel het model in met de gegenereerde nodes (TreeModel past bij hiërarchie)
    myDiagram.model = new go.TreeModel(nodeDataArray);
    // Centreer de root node (optioneel, RadialLayout pakt meestal de eerste node als center)
    const root = myDiagram.findNodeForKey(0);
    if (root) {
        myDiagram.layout.root = root;
    }
}

// Event listener voor de genereer-knop (leest CSV en bouwt mindmap)
const generateBtn = document.getElementById("generateButton");
if (generateBtn) {
    generateBtn.addEventListener("click", () => {
        const fileInput = document.getElementById("csvFile");
        const textInput = document.getElementById("textInput");
        if (!fileInput) {
            console.error("CSV file input element niet gevonden.");
            return;
        }
        // Als een CSV-bestand is gekozen via <input type="file">
        if (fileInput.files && fileInput.files.length > 0) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const csvText = e.target.result;
                const inputText = textInput ? textInput.value : "";
                generateMindmap(csvText, inputText);
            };
            reader.onerror = function(e) {
                console.error("CSV bestand lezen mislukt:", e);
            };
            reader.readAsText(fileInput.files[0]);
        } else {
            // Indien geen bestand (mogelijk tekst direct ingevoerd in een textarea)
            const csvText = fileInput.value || "";
            const inputText = textInput ? textInput.value : "";
            generateMindmap(csvText, inputText);
        }
    });
} else {
    console.warn("Generate-knop niet gevonden.");
}
