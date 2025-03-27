document.addEventListener('DOMContentLoaded', () => {
  const terugKnop = document.querySelector('.terug-knop');
  if (terugKnop) {
    terugKnop.addEventListener('click', function(e) {
      e.preventDefault();
      window.history.back();
    });
  }
});
