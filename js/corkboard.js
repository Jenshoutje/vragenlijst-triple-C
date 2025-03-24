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

  // (1) Gestapelde startpositie: een lichte offset zodat de kaarten niet exact overlappen
  const baseX = 20;      // Beginpositie X binnen board
  const baseY = 20;      // Beginpositie Y binnen board
  const offsetStep = 15; // Offset per kaart

  cards.forEach((card, index) => {
    card.style.position = "absolute";
    card.style.left = `${baseX + index * offsetStep}px`;
    card.style.top = `${baseY + index * offsetStep}px`;
  });

  // (2) DRAG & DROP-instellingen
  let activeCard = null;
  let offsetX = 0;
  let offsetY = 0;
  const gridSize = 20; // Snap-to-grid (20px)

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
    // Controleer of de klik op de "Lees meer"-link is
    const link = e.target.closest(".card-link");
    if (link) {
      // Bij klikken op de link niet starten met draggen.
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
      console.log(`Kaart "${activeCard.querySelector("h3")?.innerText || "zonder titel"}" neergezet.`);
    }
    activeCard = null;
  }

  // (3) "Lees meer"-knoppen logica
  let readMoreCount = 0;
  const totalNeeded = 5; // Aantal knoppen dat moet worden aangeklikt

  // Zoek alle "Lees meer" knoppen binnen de kaarten (verondersteld dat ze de class .card-link hebben)
  const readMoreButtons = board.querySelectorAll(".card-link");
  readMoreButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      readMoreCount++;
      console.log(`Lees meer geklikt! Totaal nu: ${readMoreCount}`);

      if (readMoreCount >= totalNeeded) {
        // Start de huddle-animatie en maak daarna het prototype memo aan
        animateHuddle().then(() => {
          // Verwijder de oude kaarten
          cards.forEach(card => card.remove());
          showFinalMemo();
        });
      }
    });
  });

  // (4) Functie: Animatie waarbij alle kaarten naar het midden bewegen ("huddelen")
  function animateHuddle() {
    return new Promise((resolve) => {
      const boardRect = board.getBoundingClientRect();
      const centerX = boardRect.width / 2;
      const centerY = boardRect.height / 2;

      cards.forEach(card => {
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

  // (5) Functie: Maak het prototype memo blaadje aan met typewriter-effect
  let finalMemoShown = false;
  function showFinalMemo() {
    if (finalMemoShown) return;
    finalMemoShown = true;

    // Bepaal de positie in het midden van het board voor het prototype memo
    const boardRect = board.getBoundingClientRect();
    const prototypeWidth = 500; // Aangepaste breedte voor prototype memo
    const prototypeHeight = 350;
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
    finalCard.style.backgroundColor = "#ffff";
    finalCard.style.padding = "10px";
    finalCard.style.borderRadius = "10px";
    finalCard.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
    finalCard.style.opacity = "0";
    finalCard.innerHTML = `
      <h3>Prototype</h3>
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

    // Start de typewriter-animatie
    startTypingAnimation(finalCard.querySelector(".typing-text"));
  }

  // (6) Typewriter-effect voor het prototype memo
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
