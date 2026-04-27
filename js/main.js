/* js/main.js — Scroll reveal, contact form */

(function () {

  /* ── Scroll Reveal ── */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  // Mark elements for reveal
  const targets = [
    '.section-title', '.about-text', '.about-visual',
    '.skill-card', '.timeline-item', '.contact-info', '.contact-form-wrap'
  ];
  targets.forEach(sel => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${i * 60}ms`;
      revealObserver.observe(el);
    });
  });

  /* ── Contact Form ── */
  const form    = document.getElementById('contactForm');
  const success = document.querySelector('.form-success');

  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();

      // Replace with your preferred form service (Formspree, Netlify Forms, etc.)
      // For now, show a success message
      form.style.display = 'none';
      if (success) {
        success.style.display = 'block';
        success.textContent = '✓ MESSAGE SENT — I\'ll get back to you shortly!';
      }

      // To use Formspree: set form action="https://formspree.io/f/YOUR_ID" method="POST"
      // and remove this JS handler.
    });
  }

})();
