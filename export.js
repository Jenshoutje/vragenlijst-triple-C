const fs = require('fs');
const admin = require("firebase-admin");

// Laad je Firebase service account key
const serviceAccount = require("./serviceAccount.json"); // Zorg dat dit bestand in je map staat

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function exportCollection() {
    const collectionName = "decisionMatrixResponses"; // Vervang door jouw collectie
    const snapshot = await db.collection(collectionName).get();

    let data = [];
    snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() });
    });

    fs.writeFileSync("decisionMatrixResponses.json", JSON.stringify(data, null, 2));
    console.log("✅ Data succesvol geëxporteerd naar JSON!");
}

exportCollection();
