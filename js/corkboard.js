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
  generateNote.style.left= "850px";
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
  <p style="margin: 4px 0;">3. Compleet? Klik op <strong>Voeg samen</strong> om het (concept) prototype te genereren.</p>
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
    const message = `Het uiteindelijke prototype zal worden ontwikkeld op basis van de inzichten uit het FFF-moment, de thematische analyse van open vragen over Triple C, het grafisch onderzoek naar gebruikersvriendelijkheid en pictogrammen, en een verkenning van bestaande AI-modellen.

Het prototype wordt een AI-ondersteunde instructievideo, waarin op visueel aantrekkelijke wijze de praktische toepassing van de Triple C-methodiek centraal zal staan. Deze video richt zich specifiek op het verminderen van de ervaren werkdruk, het vergroten van een eenduidige interpretatie van Triple C, en het versterken van kennis en vaardigheden door doelgerichte scholing. Door middel van duidelijke pictogrammen, korte praktijkgerichte instructies en herkenbare voorbeelden uit de dagelijkse praktijk van woongroep ’t Rond 51 zal het prototype begeleiders ondersteunen om methodisch en consistent te handelen volgens de Triple C-principes.

Het uiteindelijke doel van dit prototype zal zijn om begeleiders beter toe te rusten, een gezamenlijke taal en visie te stimuleren, en daarmee bij te dragen aan een verhoogde kwaliteit van zorg en ondersteuning.`;
    
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
