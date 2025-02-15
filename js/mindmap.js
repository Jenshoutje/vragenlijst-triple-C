document.addEventListener("DOMContentLoaded", function () {
    // Check of de knop en de invoervelden bestaan
    let analyseButton = document.getElementById("analyseButton");
    let exportButton = document.getElementById("exportButton");

    if (analyseButton) {
        analyseButton.addEventListener("click", function () {
            let inputText = document.getElementById("inputText").value;
            if (inputText.trim() === "") {
                alert("Voer eerst tekst in!");
                return;
            }

            let themes = analyseTekst(inputText);
            generateMindmap(themes);
        });
    } else {
        console.error("Knop 'analyseButton' niet gevonden.");
    }

    if (exportButton) {
        exportButton.addEventListener("click", function () {
            let diagram = go.Diagram.fromDiv("mindmap");
            let imgData = diagram.makeImageData({ background: "white" });

            let a = document.createElement("a");
            a.href = imgData;
            a.download = "mindmap.png";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    } else {
        console.error("Knop 'exportButton' niet gevonden.");
    }
});

function analyseTekst(text) {
    let woorden = text.toLowerCase().split(/\s+/);
    let thematischeClusters = {};

    woorden.forEach(word => {
        if (word.includes("training") || word.includes("ondersteuning")) {
            thematischeClusters["Ondersteuning & Training"] = thematischeClusters["Ondersteuning & Training"] || [];
            thematischeClusters["Ondersteuning & Training"].push(word);
        } else if (word.includes("werkdruk") || word.includes("personeel")) {
            thematischeClusters["Werkdruk & Bezetting"] = thematischeClusters["Werkdruk & Bezetting"] || [];
            thematischeClusters["Werkdruk & Bezetting"].push(word);
        } else {
            thematischeClusters["Overig"] = thematischeClusters["Overig"] || [];
            thematischeClusters["Overig"].push(word);
        }
    });

    return thematischeClusters;
}

function generateMindmap(themes) {
    if (!window.go) {
        console.error("GoJS library niet geladen. Controleer je HTML-bestand.");
        return;
    }

    let $ = go.GraphObject.make;
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

    let mindmapContainer = document.getElementById("mindmap");
    if (mindmapContainer) {
        mindmapContainer.style.display = "block";
    } else {
        console.error("Mindmap container niet gevonden.");
    }
}

function getColorBySentiment(theme) {
    if (theme.includes("Werkdruk")) return "#FF9999"; // Rood voor negatief
    if (theme.includes("Ondersteuning")) return "#99FF99"; // Groen voor positief
    return "#FFD700"; // Geel voor neutraal
}
