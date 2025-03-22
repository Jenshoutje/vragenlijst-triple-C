"use strict";

// Registreer GSAP plugins
gsap.registerPlugin(Draggable, InertiaPlugin);

// Zodra de DOM geladen is, maak de kaarten draggable
document.addEventListener("DOMContentLoaded", function() {
  // Maak alle elementen met de klasse 'idea-card' draggable binnen de '.corkboard'
  Draggable.create(".idea-card", {
    bounds: ".corkboard",
    inertia: true,
    edgeResistance: 0.9,
    type: "x,y",
    snap: {
      x: function(value) {
        return Math.round(value / 10) * 10;  // Pas de grid-grootte aan naar wens
      },
      y: function(value) {
        return Math.round(value / 10) * 10;
      }
    },
    onDragEnd: function() {
      console.log("Kaart verplaatst naar:", this.x, this.y);
    }
  });
});
