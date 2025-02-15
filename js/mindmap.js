Skip to content
Navigation Menu
Jenshoutje
vragenlijst-triple-C

Type / to search
Code
Issues
Pull requests
Actions
Projects
Wiki
Security
1
Insights
Settings
vragenlijst-triple-C/js
/
mindmap.js
in
main

Edit

Preview
Indent mode

Spaces
Indent size

4
Line wrap mode

No wrap
Editing mindmap.js file contents
Selection deleted
132
133
134
135
136
137
138
139
140
141
142
143
144
145
146
147
148
149
150
151
152
153
154
155
156
157
158
159
160
161
162
163
164
165
166
167
168
169
170
171
172
173
174
175
176
177
178
179
180
181
182
183
184
185
186
187
188
    if (!mindmapContainer) {
        console.error("❌ Mindmap container niet gevonden.");
        return;
    }

    // **Verwijder bestaand diagram als die al bestaat**
    let existingDiagram = go.Diagram.fromDiv("mindmap");
    if (existingDiagram) {
        existingDiagram.div = null;
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
Use Control + Shift + m to toggle the tab key moving focus. Alternatively, use esc then tab to move to the next interactive element on the page.
Editing vragenlijst-triple-C/js/mindmap.js at main · Jenshoutje/vragenlijst-triple-C
