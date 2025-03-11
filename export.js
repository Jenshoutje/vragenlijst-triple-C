const fs = require('fs');
const admin = require("firebase-admin");

// Laad je Firebase service account key (zorg dat je 'serviceAccount.json' hebt)
const serviceAccount = require("./serviceAccount.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function exportCollection() {
    const collectionName = "decisionMatrixResponses"; // Verander naar je collectie
    const snapshot = await db.collection(collectionName).get();

    let data = [];
    snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() });
    });

    // JSON opslaan
    fs.writeFileSync("decisionMatrixResponses.json", JSON.stringify(data, null, 2));
    console.log("✅ Data geëxporteerd naar JSON!");

    // JSON naar CSV converteren
    const csv = convertToCSV(data);
    fs.writeFileSync("decisionMatrixResponses.csv", csv);
    console.log("✅ Data omgezet naar CSV!");
}

// Functie om JSON om te zetten naar CSV
function convertToCSV(data) {
    if (data.length === 0) return "";

    const header = Object.keys(data[0]).join(",") + "\n";
    const rows = data.map(row => Object.values(row).map(value => `"${value}"`).join(",")).join("\n");
    return header + rows;
}

// Roep de functie aan
exportCollection();
