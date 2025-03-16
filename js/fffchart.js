// fffchart.js (Firebase v9, modulaire aanpak)

// 1. Importeer Firebase-modulaire modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

// 2. Firebase configuratie & initialisatie
const firebaseConfig = {
  apiKey: "AIzaSyCWMYvuSm2vuq85Kr3LjeZ5NyJRHn8XnJs",
  authDomain: "ontwerpgerichtonderzoek.firebaseapp.com",
  projectId: "ontwerpgerichtonderzoek",
  storageBucket: "ontwerpgerichtonderzoek.firebasestorage.app",
  messagingSenderId: "1087936453818",
  appId: "1:1087936453818:web:9ec4f6c8b8cbcc503ff683",
  measurementId: "G-078FVL26HV"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
console.log("✅ Firebase (v9) succesvol geïnitialiseerd!");

// 3. Definieer de 9 vragen en hun bijbehorende opties
const fields = [
  { label: "1. Pictogramstijl",    A: "realistisch",    B: "abstract" },
  { label: "2. Emotie-uitdrukking", A: "neutraal",       B: "gebruik van expressie" },
  { label: "3. Kleurgebruik",       A: "monochroom",     B: "kleur gecodeerd" },
  { label: "4. Vorm van ondersteuning",       A: "Informatie voornamelijk als teskt",    B: "Minder infomratie als tekst, met visuele ondersteuning" },
  { label: "5. Scenario gevarieerde uitleg",    A: "situatie/client gerichte uitleg", B: "algemene richtlijnen" },
  { label: "6. Vraag beschrijving",           A: "focus op client, client in hoofdpersoon?",         B: "focus op client, begeleider als hoofdpersoon?" },
  { label: "7. Videostructuur",     A: "lineair",        B: "interactief" },
  { label: "8. Implementatie",      A: "losse onderdelen", B: "geïntegreerd" },
  { label: "9. Tempo",              A: "vast",           B: "instelbaar" }
];

// 4. Haal de FFF-responses op uit Firestore en aggregeer de tellingen
async function fetchAndAggregateFFFResponses() {
  try {
    const querySnap = await getDocs(collection(db, "fff-bijeenkomstResponses"));
    const responses = [];
    querySnap.forEach(doc => {
      responses.push(doc.data());
    });
    console.log("🔎 Ontvangen documenten:", responses);

    const numQuestions = fields.length; // Verwacht 9 antwoorden
    const countsA = Array(numQuestions).fill(0);
    const countsB = Array(numQuestions).fill(0);

    responses.forEach((response, docIndex) => {
      const answers = response.antwoorden;
      if (!Array.isArray(answers)) {
        console.warn(`Document #${docIndex + 1} bevat geen 'antwoorden' array; overslaan.`);
        return;
      }
      answers.forEach((answer, idx) => {
        if (idx >= numQuestions) return; // Negeer extra items
        // Verwijder leestekens en extra spaties, en vergelijk case-insensitief
        const cleaned = answer.trim().toLowerCase().replace(/[.,!?]/g, "");
        const expectedA = fields[idx].A.toLowerCase().replace(/[.,!?]/g, "");
        const expectedB = fields[idx].B.toLowerCase().replace(/[.,!?]/g, "");
        if (cleaned === expectedA) {
          countsA[idx]++;
        } else if (cleaned === expectedB) {
          countsB[idx]++;
        } else {
          console.warn(`Geen match voor vraag ${idx + 1} in document #${docIndex + 1}, antwoord="${answer}" (cleaned="${cleaned}")`);
        }
      });
    });

    console.log("Aggregated Data => A:", countsA, "B:", countsB);
    return { countsA, countsB };
  } catch (error) {
    console.error("Fout bij ophalen van FFF-responses:", error);
    return null;
  }
}

// 5. Maak de Chart.js bar chart aan met de geaggregeerde data
async function renderFFFChart() {
  const aggregated = await fetchAndAggregateFFFResponses();
  if (!aggregated) return;

  const { countsA, countsB } = aggregated;
  const labels = fields.map(field => field.label);

  const canvasEl = document.getElementById("fffChart");
  if (!canvasEl) {
    console.warn("Geen #fffChart canvas gevonden in de HTML.");
    return;
  }
  const ctx = canvasEl.getContext("2d");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Optie A",
          data: countsA,
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1
        },
        {
          label: "Optie B",
          data: countsB,
          backgroundColor: "rgba(255, 99, 132, 0.6)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Aantal stemmen"
          },
          ticks: {
            precision: 0
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: "Resultaten FFF-Bijeenkomst: Keuze per Vraag"
        },
        tooltip: {
          callbacks: {
            label: context => `${context.dataset.label}: ${context.parsed.y} stemmen`
          }
        }
      }
    }
  });
  
  setupLegendInteractions(aggregated);
}

// 6. Laad de ruwe data in een <pre> element met id "rawDataContainer"
async function loadRawData() {
  try {
    const querySnap = await getDocs(collection(db, "fff-bijeenkomstResponses"));
    const rawData = [];
    querySnap.forEach(doc => {
      rawData.push({ id: doc.id, ...doc.data() });
    });
    const rawDataContainer = document.getElementById("rawDataContainer");
    if (rawDataContainer) {
      rawDataContainer.textContent = JSON.stringify(rawData, null, 2);
    }
  } catch (error) {
    console.error("Fout bij laden van ruwe data:", error);
  }
}
function setupLegendInteractions(aggregatedData) {
  // Haal alle <li data-question="X"> in de legenda op
  const legendItems = document.querySelectorAll(".chart-legend ul li");
  if (!legendItems) return;

  legendItems.forEach((item) => {
    item.addEventListener("click", () => {
      // Lees de index uit data-question
      const index = parseInt(item.dataset.question, 10);
      if (isNaN(index)) return;

      // Bereken percentages
      const aCount = aggregatedData.countsA[index];
      const bCount = aggregatedData.countsB[index];
      const total = aCount + bCount;
      const pctA = total > 0 ? Math.round((aCount / total) * 100) : 0;
      const pctB = total > 0 ? Math.round((bCount / total) * 100) : 0;

      // Eventueel extra context
      const extra = getExtraContext(index);

      // Toon pop-up
      showLegendPopup(index, pctA, pctB, extra);
    });
  });
}

// 7. Voorbeeld extra context per vraag
function getExtraContext(index) {
  // Vul dit aan met eigen toelichtingen, per vraag
  const contextArray = [
    "Pictogrammen spelen een belangrijke rol in visuele communicatie. Een realistische stijl kan herkenning en begrip vergroten, terwijl een abstracte stijl eenvoudiger en minder afleidend kan zijn. In de context van Triple C, waarin eenduidigheid en voorspelbaarheid essentieel zijn, is het van belang om te onderzoeken welke stijl het best aansluit bij begeleiders en cliënten.",
    "Gezichtsuitdrukkingen kunnen ondersteuning bieden bij de interpretatie van emoties en situaties. Expressieve pictogrammen kunnen de herkenbaarheid vergroten, terwijl neutrale pictogrammen minder ruimte laten voor subjectieve interpretatie. Binnen Triple C, waar voorspelbare interacties centraal staan, is het relevant te bepalen welke mate van emotie-uitdrukking het meest bijdraagt aan de effectiviteit van de instructie.",
    "Kleurgebruik kan structuur aanbrengen en de verwerking van informatie versnellen. Kleurgecodeerde pictogrammen kunnen categorieën verduidelijken en de herkenbaarheid van instructies verbeteren. Tegelijkertijd kan te veel kleur afleiding veroorzaken. In een omgeving waarin begeleiders snel moeten handelen, is het belangrijk om te bepalen of kleur een functionele toevoeging is of juist overbodige ruis creëert.",
    "De mate van detail in instructiemateriaal beïnvloedt de manier waarop begeleiders informatie verwerken. Korte instructies kunnen efficiënter zijn in de dagelijkse praktijk, terwijl uitgebreide uitleg meer context biedt en helpt bij dieper begrip. Binnen Triple C, waar begeleiders onder tijdsdruk werken, is het van belang om de balans te vinden tussen beknoptheid en volledigheid.",
    "Casusgestuurde instructie kan helpen om kennis beter toepasbaar te maken in de praktijk. Door concrete situaties uit te werken, kunnen begeleiders beter inschatten hoe Triple C in specifieke gevallen kan worden toegepast. Algemene richtlijnen bieden daarentegen een bredere houvast. Deze keuze heeft invloed op de mate waarin de instructievideo aansluit bij de praktijkervaringen van begeleiders.",
    "De focus in visueel materiaal kan liggen op de begeleider, om praktische handvatten te bieden, of op de cliënt, om inzicht te geven in de impact van Triple C. De keuze tussen deze perspectieven heeft invloed op de manier waarop begeleiders zich betrokken voelen bij de instructie en hoe zij deze kennis in de praktijk toepassen.",
    "Een lineaire video biedt een vaste structuur en volgorde van instructies, terwijl een interactieve video de mogelijkheid biedt om zelf keuzes te maken en de leerervaring af te stemmen op de gebruiker. Binnen Triple C kan een interactieve video bijdragen aan een betere toepassing in de praktijk, omdat begeleiders actief worden betrokken bij het leerproces.",
    "Een instructievideo kan zelfstandig worden ingezet of worden geïntegreerd in een bredere scholing. Blended learning, waarbij digitale instructie wordt gecombineerd met reflectie en oefening, wordt vaak als effectiever beschouwd. Binnen Triple C is het relevant om te bepalen of een video op zichzelf voldoende ondersteuning biedt, of dat een combinatie met andere scholingsvormen wenselijk is.",
    "De snelheid waarmee instructiemateriaal wordt aangeboden, heeft invloed op de leerervaring. Een vast tempo zorgt voor uniformiteit, terwijl een instelbaar tempo gebruikers de mogelijkheid biedt om de instructie aan te passen aan hun eigen leerstijl en behoefte. Dit kan vooral relevant zijn in een team waarin begeleiders met verschillende ervaringsniveaus werken."
  ];
  return contextArray[index] || "";
}

// 8. Pop-up tonen
function showLegendPopup(index, pctA, pctB, extraContext) {
  const popup = document.getElementById("legendPopup");
  if (!popup) {
    console.warn("Geen #legendPopup element in HTML gevonden.");
    return;
  }

  const contentDiv = popup.querySelector(".legend-popup-content");
  if (!contentDiv) {
    console.warn("Geen .legend-popup-content element in #legendPopup gevonden.");
    return;
  }

  // Stel de HTML van de pop-up samen
  contentDiv.innerHTML = `
    <h4>Vraag ${index + 1}</h4>
    <p><strong>Optie A:</strong> ${pctA}%</p>
    <p><strong>Optie B:</strong> ${pctB}%</p>
    <p class="extra-info">${extraContext}</p>
    <button id="closePopupBtn">Sluiten</button>
  `;

  // Pop-up zichtbaar maken (verwijder .hidden class)
  popup.classList.remove("hidden");

  // Sluitknop
  const closeBtn = document.getElementById("closePopupBtn");
  closeBtn.addEventListener("click", () => {
    popup.classList.add("hidden");
  });
}


// 7. Zodra de DOM volledig is geladen, render de chart en laad de ruwe data
document.addEventListener("DOMContentLoaded", () => {
  renderFFFChart();
  loadRawData();
});
