/* corkboard.js */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ corkboard.js geladen!");

  // Zoek het 'corkboard' element (het klembord)
  const board = document.querySelector(".corkboard");
  if (!board) {
    console.error("❌ Geen element met class .corkboard gevonden.");
    return;
  }

  // Selecteer alle memo-kaarten (idea-card)
  const cards = board.querySelectorAll(".idea-card");
  if (cards.length === 0) {
    console.warn("⚠ Geen .idea-card elementen gevonden in het klembord.");
  }

  // (1) Gestapelde startpositie (zodat de kaarten niet allemaal exact overlappen)
  const baseX = 20;      // Beginpositie X binnen board
  const baseY = 20;      // Beginpositie Y binnen board
  const offsetStep = 15; // Offset per kaart

  cards.forEach((card, index) => {
    card.style.position = "absolute";
    // Zet ze in een licht gestapelde positie
    card.style.left = `${baseX + index * offsetStep}px`;
    card.style.top = `${baseY + index * offsetStep}px`;
  });

  // (2) DRAG & DROP-instellingen
  let activeCard = null;
  let offsetX = 0;
  let offsetY = 0;
  const gridSize = 20; // Snap-to-grid van 20px (optioneel)

  cards.forEach(card => {
    card.addEventListener("pointerdown", onPointerDown);
  });

  document.addEventListener("pointermove", onPointerMove);
  document.addEventListener("pointerup", onPointerUp);
  document.addEventListener("pointercancel", () => {
    activeCard = null;
  });

  function onPointerDown(e) {
    const card = e.target.closest(".idea-card");
    if (!card) return;
    activeCard = card;

    // Bepaal offset zodat de kaart niet 'springt'
    const rect = card.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    // Voor pointer events
    card.setPointerCapture(e.pointerId);

    // Visuele indicatie dat de kaart actief is
    card.style.boxShadow = "0 6px 15px rgba(0,0,0,0.3)";
  }

  function onPointerMove(e) {
    if (!activeCard) return;

    const boardRect = board.getBoundingClientRect();
    let newX = e.clientX - boardRect.left - offsetX;
    let newY = e.clientY - boardRect.top - offsetY;

    // Houd binnen de grenzen
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
      // Verwijder tijdelijke schaduw
      activeCard.style.boxShadow = "";
      console.log(`Kaart "${activeCard.querySelector("h3")?.innerText || "Zonder titel"}" neergezet.`);
    }
    activeCard = null;
  }

  // (3) "Lees meer"-knoppen logica
  let readMoreCount = 0;
  const totalNeeded = 5; // We hebben 5 kaarten waarvan de 'Lees meer' moet zijn aangeklikt

  // Zoek in elke kaart de .read-more-btn en voeg event toe
  cards.forEach(card => {
    const readMoreBtn = card.querySelector(".read-more-btn");
    if (readMoreBtn) {
      readMoreBtn.addEventListener("click", () => {
        // Tel het aantal aangeklikte 'Lees meer'
        readMoreCount++;
        console.log(`Lees meer geklikt! Totaal nu: ${readMoreCount}`);

        // Check of we alle 5 hebben
        if (readMoreCount >= totalNeeded) {
          // Roep de functie aan om de 6e memo te tonen
          showFinalMemo();
        }
      });
    }
  });

  // (4) Functie: Toon de 6e memo met typing-animatie
  let finalMemoShown = false; // Zodat we niet dubbel aanmaken
  function showFinalMemo() {
    if (finalMemoShown) return; // voorkomen dat we het 2x doen
    finalMemoShown = true;

    // Maak een nieuw div-element voor de 6e memo
    const finalCard = document.createElement("div");
    finalCard.classList.add("idea-card");
    finalCard.style.position = "absolute";
    // Plaats 'm rechtsboven op het bord
    finalCard.style.right = "20px";  // of bereken left/top naar wens
    finalCard.style.top = "20px";
    finalCard.style.width = "220px";
    finalCard.style.height = "180px";
    finalCard.style.backgroundColor = "#f5f3c1"; // lichtgeel memo
    finalCard.style.padding = "10px";
    finalCard.style.borderRadius = "10px";
    finalCard.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
    finalCard.innerHTML = `
      <h3>Eindconcept</h3>
      <div class="typing-text"></div>
    `;

    // Voeg 'm toe aan het board
    board.appendChild(finalCard);

    // Start de typing-animatie
    startTypingAnimation(finalCard.querySelector(".typing-text"));
  }

  // (5) Typewriter-effect voor de 6e memo
  function startTypingAnimation(textElem) {
    if (!textElem) return;

    const message = "Een AI-ondersteunde Triple C-tool \n die de werkdruk vermindert en \n eenduidige scholing bevordert!";
    let idx = 0;
    const speed = 50; // ms per character

    const timer = setInterval(() => {
      textElem.textContent = message.slice(0, idx);
      idx++;
      if (idx > message.length) {
        clearInterval(timer);
      }
    }, speed);
  }

});
