document.addEventListener("DOMContentLoaded", function () {
    // Controleer of GoJS correct is geladen
    if (typeof go === "undefined") {
        console.error("GoJS library niet geladen. Controleer je HTML-bestand.");
        alert("Er is een fout opgetreden bij het laden van de mindmap. Controleer je verbinding.");
        return;
    }

    // Zoek knoppen en tekstvelden
    let analyseButton = document.getElementById("analyseButton");
    let exportButton = document.getElementById("exportButton");
    let inputText = document.getElementById("inputText");
    let mindmapContainer = document.getElementById("mindmap");

    if (!analyseButton || !exportButton || !inputText || !mindmapContainer) {
        console.error("Belangrijke HTML-elementen ontbreken. Controleer je HTML-structuur.");
        return;
    }

    // **Klik event voor de analyse-knop**
    analyseButton.addEventListener("click", function () {
        let text = inputText.value.trim();
        if (text === "") {
            alert("Voer eerst tekst in!");
            return;
        }

        let themes = analyseTekst(text);
        generateMindmap(themes);
    });

    // **Klik event voor de export-knop**
    exportButton.addEventListener("click", function () {
        let diagram = go.Diagram.fromDiv("mindmap");
        if (!diagram) {
            console.error("Mindmap diagram niet gevonden.");
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

// **Thematische Analyse Functie**
function analyseTekst(text) {
    let woorden = text.toLowerCase().split(/\s+/);
    let clusters = {
        "Ondersteuning & Training": [],
        "Werkdruk & Bezetting": [],
        "Methodische Uitvoering": [],
        "Cliëntgericht Werken": [],
        "Overig": []
    };

    woorden.forEach(word => {
        if (word.includes("training") || word.includes("ondersteuning") || word.includes("scholing")) {
            clusters["Ondersteuning & Training"].push(word);
        } else if (word.includes("werkdruk") || word.includes("personeel") || word.includes("tekort")) {
            clusters["Werkdruk & Bezetting"].push(word);
        } else if (word.includes("methode") || word.includes("werkwijze") || word.includes("structuur")) {
            clusters["Methodische Uitvoering"].push(word);
        } else if (word.includes("cliënt") || word.includes("zorg") || word.includes("begeleiding")) {
            clusters["Cliëntgericht Werken"].push(word);
        } else {
            clusters["Overig"].push(word);
        }
    });

    return clusters;
}

// **Mindmap Genereren met GoJS**
function generateMindmap(themes) {
    let mindmapContainer = document.getElementById("mindmap"); // Zorg dat dit correct is
    if (!mindmapContainer) {
        console.error("Mindmap container niet gevonden.");
        return;
    }

    let $ = go.GraphObject.make;

    // **Check of het diagram al bestaat en verwijder het**
    let existingDiagram = go.Diagram.fromDiv("mindmap");
    if (existingDiagram) {
        existingDiagram.div = null; // Ontkoppel bestaand diagram
        existingDiagram.clear(); // Leeg de oude mindmap
    }

    // **Maak een nieuw diagram**
    let diagram = $(go.Diagram, "mindmap", {
        "undoManager.isEnabled": true,
        layout: $(go.TreeLayout, { angle: 90, layerSpacing: 35 })
    });

    let nodeDataArray = [];
    let linkDataArray = [];

    Object.keys(themes).forEach((theme, index) => {
        let color = getColorBySentiment(theme);
        nodeDataArray.push({ key: theme, text: theme, color: color });

        themes[theme].forEach((subtheme, subIndex) => {
            let subKey = `${theme}-${subIndex}`;
            nodeDataArray.push({ key: subKey, text: subtheme, color: "#ddd" });
            linkDataArray.push({ from: theme, to: subKey });
        });
    });

    // **Template voor de knooppunten**
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

    // **Voeg de data toe aan het diagram**
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
