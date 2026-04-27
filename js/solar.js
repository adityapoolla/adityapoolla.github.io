/* js/solar.js — Planet click → smooth scroll to section */

(function () {
  document.querySelectorAll('.planet[data-target]').forEach(planet => {
    planet.addEventListener('click', () => {
      const target = document.querySelector(planet.dataset.target);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    // Tooltip pulse on hover
    planet.addEventListener('mouseenter', () => {
      planet.style.animationPlayState = 'paused';
      planet.closest('.orbit').style.borderColor = 'rgba(79,195,247,0.35)';
    });
    planet.addEventListener('mouseleave', () => {
      planet.style.animationPlayState = '';
      planet.closest('.orbit').style.borderColor = '';
    });
  });
})();
