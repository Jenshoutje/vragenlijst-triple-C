// script.js

// Globale variabelen om te tracken
let activeCard = null;
let offsetX = 0;
let offsetY = 0;

window.addEventListener("DOMContentLoaded", () => {
  // Selecteer alle kaarten
  const cards = document.querySelectorAll(".idea-card");

  cards.forEach(card => {
    // Mousedown = begin van drag
    card.addEventListener("mousedown", onMouseDown);
  });

  // Mousemove en mouseup op document-level, zodat je ook buiten de kaart kunt "loslaten"
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
});

function onMouseDown(e) {
  // e.target is het element waarop je klikt
  // Controleren of je op een kaart klikt
  if (e.target.classList.contains("idea-card") || e.target.closest(".idea-card")) {
    // Bepaal welke kaart 'actief' is
    activeCard = e.target.classList.contains("idea-card") 
      ? e.target 
      : e.target.closest(".idea-card");

    // Bereken offset binnen de kaart, zodat de kaart niet springt naar (0,0)
    const rect = activeCard.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    // Event default voorkomen (bv. tekstselectie)
    e.preventDefault();
  }
}

function onMouseMove(e) {
  if (!activeCard) return;

  // Nieuwe coordinaten voor de actieve kaart
  const board = document.querySelector(".idea-board");
  const boardRect = board.getBoundingClientRect();

  // Bepaal de (x,y) binnen het bord
  let newX = e.clientX - boardRect.left - offsetX;
  let newY = e.clientY - boardRect.top - offsetY;

  // Houd de kaart binnen het bord
  // (optioneel, als je wilt dat de kaart niet buiten de rand gaat)
  const maxX = boardRect.width - activeCard.offsetWidth;
  const maxY = boardRect.height - activeCard.offsetHeight;

  // Clamp
  newX = Math.max(0, Math.min(newX, maxX));
  newY = Math.max(0, Math.min(newY, maxY));

  // Update de left/top van de kaart
  activeCard.style.left = `${newX}px`;
  activeCard.style.top = `${newY}px`;
}

function onMouseUp(e) {
  // Drag is klaar
  activeCard = null;
}
