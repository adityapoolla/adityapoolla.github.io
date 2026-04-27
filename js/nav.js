/* js/nav.js — Navbar scroll state, active link spy, hamburger */

(function () {
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.querySelector('.nav-links');
  const sections  = document.querySelectorAll('section[id]');
  const links     = document.querySelectorAll('.nav-links a[data-section]');

  /* ── Scroll: navbar bg + active section ── */
  function onScroll() {
    // Navbar bg
    navbar.classList.toggle('scrolled', window.scrollY > 40);

    // Active section highlight
    let current = '';
    sections.forEach(sec => {
      const top = sec.getBoundingClientRect().top;
      if (top <= 80) current = sec.id;
    });
    links.forEach(a => {
      a.classList.toggle('active', a.dataset.section === current);
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Hamburger ── */
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });

  /* ── Close mobile menu on link click ── */
  links.forEach(a => {
    a.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });
})();
