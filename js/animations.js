(() => {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const preloader = document.getElementById('preloader');

  const revealPage = () => {
    if (preloader) window.setTimeout(() => preloader.classList.add('hidden'), reducedMotion ? 0 : 760);
    if (!gsap || !ScrollTrigger || reducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);
    gsap.fromTo('.navbar', { y: -24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.85, ease: 'power3.out' });
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) gsap.fromTo(heroContent.children, { y: 34, autoAlpha: 0 }, {
      y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.1, ease: 'power3.out', delay: 0.1
    });

    const revealTargets = document.querySelectorAll(
      '.page-header > :not(.page-header-bg), .section-header, .about-grid > *, .fleet-card, .pricing-card, .service-card, .gallery-item, .contact-item, .contact-form-box, .booking-aside'
    );
    revealTargets.forEach((element, index) => {
      gsap.fromTo(element, { y: 34, rotateX: 2, autoAlpha: 0 }, {
        y: 0, rotateX: 0, autoAlpha: 1, duration: 0.85, delay: (index % 4) * 0.035,
        ease: 'power3.out',
        scrollTrigger: { trigger: element, start: 'top 88%', once: true }
      });
    });

    document.querySelectorAll('.about-img-box, .fleet-card-img, .gallery-item, .hero-car-display').forEach((visual, index) => {
      gsap.fromTo(visual, { transformPerspective: 1200, rotateY: index % 2 ? 4 : -4, scale: 0.96 }, {
        rotateY: 0, scale: 1, ease: 'none',
        scrollTrigger: { trigger: visual, start: 'top bottom', end: 'center 58%', scrub: 0.7 }
      });
    });

    document.querySelectorAll('.hero-car-wrap, .drive-car-visual').forEach(visual => {
      gsap.to(visual, { yPercent: -7, ease: 'none', scrollTrigger: { trigger: visual, start: 'top bottom', end: 'bottom top', scrub: 1 } });
    });

    const pageHeaderBg = document.querySelector('.page-header-bg');
    if (pageHeaderBg) gsap.to(pageHeaderBg, { yPercent: 18, scale: 1.1, ease: 'none', scrollTrigger: { trigger: '.page-header', start: 'top top', end: 'bottom top', scrub: 0.8 } });
    ScrollTrigger.refresh();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', revealPage, { once: true });
  else revealPage();

  document.addEventListener('pointermove', event => {
    if (reducedMotion || !gsap || event.pointerType !== 'mouse') return;
    const visual = document.querySelector('.hero-car-wrap');
    if (!visual) return;
    const x = (event.clientX / innerWidth - 0.5) * 7;
    const y = (event.clientY / innerHeight - 0.5) * 5;
    gsap.to(visual, { rotateY: x, rotateX: -y, duration: 0.7, ease: 'power2.out', overwrite: 'auto' });
  });
})();
