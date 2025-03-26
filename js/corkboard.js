"use strict";

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ corkboard.js geladen!");

  const board = document.querySelector(".corkboard");
  if (!board) {
    console.error("❌ Geen element met class .corkboard gevonden.");
    return;
  }

  const cards = board.querySelectorAll(".idea-card");
  if (cards.length === 0) {
    console.warn("⚠ Geen .idea-card elementen gevonden in het klembord.");
  }

  // (1) Plaats de kaarten met lichte offset
  const baseX = 20;
  const baseY = 20;
  const offsetStep = 15;

  cards.forEach((card, index) => {
    card.style.position = "absolute";
    card.style.left = `${baseX + index * offsetStep}px`;
    card.style.top = `${baseY + index * offsetStep}px`;
  });

  // (2) Drag & Drop
  let activeCard = null;
  let offsetX = 0;
  let offsetY = 0;
  const gridSize = 20;

  cards.forEach(card => {
    // Zorg dat elke kaart een positionering heeft
    if (!["absolute", "relative"].includes(window.getComputedStyle(card).position)) {
      card.style.position = "absolute";
    }
    card.addEventListener("pointerdown", onPointerDown);
  });

  document.addEventListener("pointermove", onPointerMove);
  document.addEventListener("pointerup", onPointerUp);
  document.addEventListener("pointercancel", () => {
    activeCard = null;
  });

  function onPointerDown(e) {
    // Als er op de link "Lees meer" wordt geklikt, geen drag starten
    const link = e.target.closest(".card-link");
    if (link) {
      return;
    }

    const card = e.target.closest(".idea-card");
    if (!card) return;

    activeCard = card;
    const rect = card.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    card.setPointerCapture(e.pointerId);
    card.style.boxShadow = "0 6px 15px rgba(0,0,0,0.3)";
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!activeCard) return;

    const boardRect = board.getBoundingClientRect();
    let newX = e.clientX - boardRect.left - offsetX;
    let newY = e.clientY - boardRect.top - offsetY;

    const maxX = boardRect.width - activeCard.offsetWidth;
    const maxY = boardRect.height - activeCard.offsetHeight;

    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    // Snap-to-grid
    newX = Math.round(newX / gridSize) * gridSize;
    newY = Math.round(newY / gridSize) * gridSize;

    activeCard.style.left = `${newX}px`;
    activeCard.style.top = `${newY}px`;
  }

  function onPointerUp(e) {
    if (activeCard) {
      activeCard.releasePointerCapture(e.pointerId);
      activeCard.style.boxShadow = "";
      console.log(`Kaart "${activeCard.querySelector("h4")?.innerText || "zonder titel"}" neergezet.`);
    }
    activeCard = null;
  }

  // (3) Maak een “sticky note”-achtig memo-briefje rechtsonder aan
  const generateNote = document.createElement("div");
  generateNote.classList.add("idea-card", "generate-note");
  generateNote.style.position = "sticky";
  generateNote.style.top = "13px";
  generateNote.style.left= "875px";
  generateNote.style.width = "187px";
  generateNote.style.minHeight = "150px";
  generateNote.style.backgroundColor = "#fff8a8"; // Pastelkleur
  generateNote.style.padding = "10px";
  generateNote.style.borderRadius = "8px";
  generateNote.style.boxSizing = "border-box";
  generateNote.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
  generateNote.style.fontSize = "15px";
  generateNote.style.lineHeight = "1.2";
  generateNote.style.fontWeight = "700"; 
  generateNote.style.zIndex = "999"; // Zodat deze boven andere elementen blijft

  // Inhoud van het memo-briefje
  generateNote.innerHTML = `
  <h2 style="margin-bottom: 8px;">TO DO</h2>
  <p style="margin: 4px 0;">1. Plak alle memo-briefjes op het bord.</p>
  <p style="margin: 4px 0;">2. Lees meer over de vier componenten.</p>
  <p style="margin: 4px 0;">3. Compleet? Klik op <strong>"Voeg samen"</strong> om het (concept) prototype te genereren.</p>
  <button id="generatePrototype" style="margin-top:10px; cursor:pointer;">Voeg samen</button>
`;

  // Voeg het memo-briefje toe aan het board
  board.appendChild(generateNote);

  // (4) Eventlistener voor de “Voeg samen & genereer” knop
const generateButton = generateNote.querySelector("#generatePrototype");
generateButton.addEventListener("click", () => {
  console.log("Genereer Prototype knop geklikt.");
  animateHuddle().then(() => {
    // Haal opnieuw alle .idea-card elementen op (inclusief de to-do memo)
    const allCards = board.querySelectorAll(".idea-card");
    allCards.forEach(card => card.remove());
    showFinalMemo();
  });
});

  // (5) Functie: Animatie waarbij alle kaarten naar het midden bewegen ("huddelen")
  function animateHuddle() {
    return new Promise((resolve) => {
      const boardRect = board.getBoundingClientRect();
      const centerX = boardRect.width / 2;
      const centerY = boardRect.height / 2;

       const allCards = board.querySelectorAll(".idea-card");

      allCards.forEach(card => {
        // Voeg een CSS-transitie toe voor een vloeiende animatie
        card.style.transition = "left 0.5s ease, top 0.5s ease";
        const cardWidth = card.offsetWidth;
        const cardHeight = card.offsetHeight;
        // Bepaal de nieuwe positie zodat de kaart gecentreerd is
        const newLeft = centerX - cardWidth / 2;
        const newTop = centerY - cardHeight / 2;
        card.style.left = `${newLeft}px`;
        card.style.top = `${newTop}px`;
      });

      // Wacht tot de animatie voltooid is
      setTimeout(() => {
        resolve();
      }, 600); // 600ms geeft wat speling voor de transitie
    });
  }

  // (6) Functie: Maak het prototype memo blaadje aan met typewriter-effect
  let finalMemoShown = false;
  function showFinalMemo() {
    if (finalMemoShown) return;
    finalMemoShown = true;

    // Bepaal de positie in het midden van het board voor het prototype memo
    const boardRect = board.getBoundingClientRect();
    const prototypeWidth = 700; 
    const prototypeHeight = 550;
    const centerX = boardRect.width / 2;
    const centerY = boardRect.height / 2;
    const leftPos = centerX - prototypeWidth / 2;
    const topPos = centerY - prototypeHeight / 2;

    // Maak het nieuwe memo-element aan
    const finalCard = document.createElement("div");
    finalCard.classList.add("idea-card", "final-memo");
    finalCard.style.position = "absolute";
    finalCard.style.left = `${leftPos}px`;
    finalCard.style.top = `${topPos}px`;
    finalCard.style.width = `${prototypeWidth}px`;
    finalCard.style.height = `${prototypeHeight}px`;
    finalCard.style.backgroundColor = "#EEDBFFB3";
    finalCard.style.padding = "10px";
    finalCard.style.borderRadius = "10px";
    finalCard.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
    finalCard.style.opacity = "0.8";
    finalCard.style.transform = "rotate(3deg)";
    finalCard.innerHTML = `
      <h2>Prototype</h2>
      <div class="typing-text"></div>
    `;

    board.appendChild(finalCard);

    // Laat het prototype met een fade-in effect verschijnen
    setTimeout(() => {
      finalCard.style.transition = "opacity 0.5s ease";
      finalCard.style.opacity = "0.7";
    }, 50);

    // Voeg drag functionaliteit toe aan het nieuwe element
    finalCard.addEventListener("pointerdown", onPointerDown);

    // Geef de .typing-text een vaste hoogte en verberg overflow
    const finalTextContainer = finalCard.querySelector(".typing-text");
    finalTextContainer.style.height = "calc(100% - 40px)"; 
    finalTextContainer.style.overflow = "hidden"; 
    finalTextContainer.style.whiteSpace = "pre-wrap";

    // Start de typewriter-animatie
    startTypingAnimation(finalTextContainer);
  }

  // (7) Typewriter-effect voor het prototype memo
  function startTypingAnimation(textElem) {
    if (!textElem) return;
    const message = `Conceptprototype 

In het hart van de Triple C-methodiek ligt het streven naar eenduidigheid, nabijheid en het bieden van een betekenisvol bestaan voor cliënten. Vanuit die visie is binnen dit ontwerpgericht onderzoek gezocht naar een interventie die begeleiders ondersteunt in het consequent toepassen van Triple C, ondanks werkdruk, beperkte scholing of uiteenlopende interpretaties binnen het team.

Wat uit het onderzoek naar voren kwam, is dat begeleiders op woongroep ’t Rond 51 wel degelijk gemotiveerd zijn om methodisch te werken volgens Triple C, maar dat zij tegen praktische barrières aanlopen: een gebrek aan gezamenlijke taal, tijdsdruk en onvoldoende toegang tot concrete handvatten. Dit vormt de voedingsbodem voor het ontwerp van een interventie die compact, visueel en direct toepasbaar is in de praktijk.

Visie op het prototype

Het prototype – voorlopig aangeduid als Triple C Snapshots – is ontworpen als een digitale microleermodule die gebruikmaakt van korte, krachtige video’s van maximaal twintig seconden. Elke video belicht één essentieel aspect van Triple C, verankerd in herkenbare praktijksituaties en visueel vertaald naar de dagelijkse realiteit op de werkvloer.

De insteek is niet om begeleiders op te leiden in de volledige methodiek, maar juist om bestaande kennis te activeren, te versterken en op visueel aantrekkelijke wijze te verhelderen. De kern ligt in herhaling, herkenbaarheid en eenvoud.

De vorm sluit aan op het format van hedendaagse short-form content, zoals dat breed wordt ingezet op sociale en educatieve platforms, maar is specifiek afgestemd op de behoeften en context van begeleiders in de gehandicaptenzorg. Daarbij wordt rekening gehouden met beperkte cognitieve ruimte, verschillen in leerstijl en de noodzaak tot snel toepasbare informatie.

 Inhoud en ontwikkeling

De inhoud van de video’s is gebaseerd op de primaire principes uit het Triple C-handboek, aangevuld met inzichten uit de thematische analyse en reflecties van begeleiders zelf. Denk aan situaties als:
• “Wat betekent het om naast iemand te staan in plaats van boven iemand te staan?”
• “Hoe herken je spanning bij cliënten en hoe kun je hier proactief op inspelen?”
• “Wat betekent het om de ‘normale dagstructuur’ leidend te maken, zelfs in onrustige momenten?”

Deze fragmenten worden visueel uitgewerkt, met behulp van AI-tools zoals Sora, die realistische en aanpasbare video’s kan genereren op basis van tekstuele input. Daarbij blijft menselijke regie essentieel: begeleiders worden actief betrokken bij het toetsen van de inhoud, het herkennen van de situaties, en het beoordelen van begrijpelijkheid en toepasbaarheid.

De vormgeving van de video’s wordt ontwikkeld volgens principes van visueel ontwerp voor begrijpelijke zorgcommunicatie. Denk aan rustige kleurcontrasten, gebruik van pictogrammen en herkenbare zorgsettings. Zo ontstaat een serie visuele miniaturen die als het ware ‘snaps’ vormen: kleine brokjes herkenbare, gedeelde kennis.

Gebruik en implementatie

De video’s kunnen op meerdere manieren worden ingezet:
• Als aanvulling binnen het bestaande leerplein van Alliade;
• Als visueel startpunt tijdens teamoverleggen of intervisies;
• Of als ‘on the go’-tool via een mobiele webomgeving.

Door deze flexibiliteit kan de tool inspelen op verschillende praktijksituaties – zonder dat er sprake is van een overbelasting of extra scholingsdruk.

Reflectieve kanttekening

Hoewel het prototype in potentie een krachtige bijdrage kan leveren aan het realiseren van een gedeelde visie binnen teams, staat het ontwerp nog in zijn conceptuele fase. Het is (nog) niet geïmplementeerd, getest of gevalideerd op grote schaal. In lijn met kritisch ontwerpdenken wordt in de Deliverfase van dit onderzoek stilgestaan bij de beperkingen, ethische overwegingen en vragen omtrent het gebruik van AI in zorgcontexten.

De uiteindelijke keuze om het prototype daadwerkelijk te implementeren, zal afhangen van verdere toetsing, feedback uit de praktijk en het ethisch afwegingskader dat in het slothoofdstuk wordt behandeld.
`;
    
    let idx = 0;
    const speed = 30; // iets snellere typingsnelheid

    const timer = setInterval(() => {
      textElem.textContent = message.slice(0, idx);
      idx++;
      if (idx > message.length) {
        clearInterval(timer);
      }
    }, speed);
  }
});
