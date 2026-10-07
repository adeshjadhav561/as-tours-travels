/* ===== AS TOURS & TRAVELS - MAIN JAVASCRIPT ===== */

// Preloader
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    setTimeout(() => preloader.classList.add('hidden'), 1800);
  }
});

// Navbar scroll
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }
  
  const scrollTop = document.querySelector('.scroll-top');
  if (scrollTop) {
    scrollTop.classList.toggle('visible', window.scrollY > 500);
  }
});

// Hamburger
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('active');
    });
    
    document.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });
  }
  
  // Scroll to top
  const scrollTop = document.querySelector('.scroll-top');
  if (scrollTop) {
    scrollTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href && href !== '#') {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// 3D tilt on fleet & pricing cards
document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.fleet-card, .pricing-card, .service-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rx = (y - rect.height / 2) / 25;
      const ry = (rect.width / 2 - x) / 25;
      card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-8px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
});

// Booking requests are sent to the business email endpoint without opening a chat app.
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('#contactForm, [data-booking-form]').forEach(form => {
    const status = form.querySelector('.form-status') || document.getElementById('bookingStatus') || (() => {
      const node = document.createElement('p');
      node.className = 'form-status';
      node.setAttribute('role', 'status');
      node.setAttribute('aria-live', 'polite');
      form.appendChild(node);
      return node;
    })();
    const vehicleSelect = form.querySelector('#booking-car');
    const dateInput = form.querySelector('#booking-date');
    if (dateInput) {
      const now = new Date();
      dateInput.min = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
    const bookingParams = new URLSearchParams(window.location.search);
    const requestedVehicle = bookingParams.get('vehicle');
    if (vehicleSelect && requestedVehicle) {
      const match = [...vehicleSelect.options].find(option => option.textContent.toLowerCase().includes(requestedVehicle.toLowerCase()));
      if (match) vehicleSelect.value = match.value || match.textContent;
    }
    const bookingFields = {
      pickup: form.querySelector('#booking-pickup'),
      destination: form.querySelector('#booking-destination'),
      travel_date: form.querySelector('#booking-date'),
      notes: form.querySelector('#booking-notes')
    };
    Object.entries(bookingFields).forEach(([key, field]) => {
      const value = bookingParams.get(key);
      if (field && value) field.value = value;
    });
    const passengerCount = Number(bookingParams.get('passengers'));
    const passengerSelect = form.querySelector('#booking-passengers');
    if (passengerSelect && passengerCount) {
      passengerSelect.value = passengerCount <= 2 ? '1–2 people' : passengerCount <= 4 ? '3–4 people' : '5–7 people';
    }

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const button = form.querySelector('[type="submit"]');
      const original = button?.innerHTML;
      const isBooking = form.hasAttribute('data-booking-form');
      const payload = isBooking
        ? Object.fromEntries(new FormData(form).entries())
        : {
            _subject: 'New ride request — AS Tours & Travels',
            _template: 'table',
            name: form.querySelector('#name')?.value.trim(),
            phone: form.querySelector('#phone')?.value.trim(),
            email: form.querySelector('#email')?.value.trim(),
            vehicle: form.querySelector('#service')?.selectedOptions[0]?.textContent,
            pickup: form.querySelector('#pickup')?.value.trim(),
            destination: form.querySelector('#destination')?.value.trim(),
            travel_date: form.querySelector('#date')?.value,
            notes: form.querySelector('#message')?.value.trim()
          };

      if ((payload.phone || '').replace(/\D/g, '').length < 10) {
        status.textContent = 'Please enter a valid phone number with at least 10 digits.';
        status.classList.add('is-error');
        return;
      }

      if (button) {
        button.disabled = true;
        button.innerHTML = '<span>Sending request…</span><i class="fas fa-spinner fa-spin"></i>';
      }
      status.textContent = '';
      status.classList.remove('is-error', 'is-success');

      try {
        const response = await fetch('https://formsubmit.co/ajax/adeshjadhav561@gmail.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (!response.ok || result.success === false) throw new Error(result.message || 'Request failed');
        status.textContent = 'Request received. Our team will contact you shortly.';
        status.classList.add('is-success');
        form.reset();
      } catch (error) {
        status.textContent = 'We could not send your request right now. Please call +91 95613 45579 or email adeshjadhav561@gmail.com.';
        status.classList.add('is-error');
      } finally {
        if (button) {
          button.disabled = false;
          button.innerHTML = original;
        }
      }
    });
  });
});
// Parallax on hero car
document.addEventListener('mousemove', (e) => {
  const wrap = document.querySelector('.hero-car-wrap');
  if (wrap) {
    const x = (e.clientX / window.innerWidth - 0.5) * 15;
    const y = (e.clientY / window.innerHeight - 0.5) * 15;
    wrap.style.transform = `translate(${x}px, ${y}px)`;
  }
});

// Pinned, scroll-controlled Innova journey on the home page.
document.addEventListener('DOMContentLoaded', () => {
  const section = document.querySelector('.drive-story');
  if (!section || !window.gsap || !window.ScrollTrigger) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const car = section.querySelector('.drive-car');
  const progress = section.querySelector('.drive-progress span');
  const chapter = section.querySelector('.drive-chapter');
  const chapterCopy = [
    ['01 — 04', 'THE JOURNEY, REIMAGINED', 'Meet the road.', 'Settle in. Your Innova Crysta is ready to carry everyone and everything along.'],
    ['02 — 04', 'ROOM FOR EVERYONE', 'Bring everyone.', 'Thoughtful space and a smooth ride make the miles feel easy.'],
    ['03 — 04', 'MADE FOR THE LONG WAY', 'Take the long way.', 'Stretch out, watch the scenery change, and leave the driving to us.'],
    ['04 — 04', 'YOUR JOURNEY, YOUR WAY', 'Arrive in comfort.', 'From the first pickup to the final stop, travel at your own pace.']
  ];
  const kicker = section.querySelector('.drive-kicker');
  const title = section.querySelector('.drive-title');
  const description = section.querySelector('.drive-description');

  window.gsap.registerPlugin(window.ScrollTrigger);
  section.classList.add('is-enhanced');
  const timeline = window.gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.1,
      onUpdate: self => {
        const current = Math.min(chapterCopy.length - 1, Math.floor(self.progress * chapterCopy.length));
        const [label, eyebrow, heading, body] = chapterCopy[current];
        chapter.textContent = label;
        if (section.dataset.chapter !== String(current)) {
          section.dataset.chapter = String(current);
          window.gsap.to([kicker, title, description], { y: 12, autoAlpha: 0, duration: .16, stagger: .025, overwrite: true, onComplete: () => {
            kicker.textContent = eyebrow;
            title.innerHTML = `${heading}<br><span>${current === 0 ? 'Make it yours.' : 'With AS Tours.'}</span>`;
            description.textContent = body;
            window.gsap.fromTo([kicker, title, description], { y: -10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .25, stagger: .035, overwrite: true });
          }});
        }
        window.gsap.set(progress, { scaleY: self.progress });
      }
    }
  });
  timeline.to(section.querySelector('.drive-atmosphere'), { scale: 1.22, rotation: -4, duration: 4, ease: 'none' }, 0);
  timeline.to(section.querySelector('.drive-orbit-one'), { rotate: 58, scale: 1.12, duration: 4, ease: 'none' }, 0);
  timeline.to(section.querySelector('.drive-orbit-two'), { rotate: -46, scale: .9, duration: 4, ease: 'none' }, 0);
  timeline.fromTo(car, { x: '18vw', y: '-3vh', z: -180, scale: .62, rotateY: -24, rotateZ: -3 },
    { x: '-2vw', y: '8vh', z: 30, scale: 1.04, rotateY: 5, rotateZ: 0, duration: 1.1, ease: 'none' }, 0);
  timeline.to(car, { x: '-10vw', y: '17vh', z: 170, scale: 1.3, rotateY: 15, rotateZ: 2, duration: 1, ease: 'none' }, 1.1);
  timeline.to(car, { x: '12vw', y: '4vh', z: -40, scale: .72, rotateY: -12, rotateZ: -1, duration: 1, ease: 'none' }, 2.1);
  timeline.to(car, { x: '28vw', y: '-17vh', z: -250, scale: .28, rotateY: -23, rotateZ: 2, duration: .9, ease: 'none' }, 3.1);
  timeline.to(section.querySelector('.drive-reflection'), { scaleX: 1.55, opacity: .55, duration: 4, ease: 'none' }, 0);
  timeline.to(section.querySelector('.drive-car-shadow'), { scaleX: 1.25, opacity: .22, duration: 4, ease: 'none' }, 0);
  window.ScrollTrigger.refresh();
});

// Gallery lightbox
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', function() {
      const img = this.querySelector('img');
      if (!img) return;
      
      const lb = document.createElement('div');
      lb.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);display:flex;align-items:center;justify-content:center;z-index:99999;cursor:pointer;opacity:0;transition:opacity 0.4s ease';
      
      const lbImg = document.createElement('img');
      lbImg.src = img.src;
      lbImg.style.cssText = 'max-width:90%;max-height:90%;border-radius:4px;box-shadow:0 30px 80px rgba(0,0,0,0.8);transform:scale(0.85);transition:transform 0.4s ease';
      
      lb.appendChild(lbImg);
      document.body.appendChild(lb);
      
      requestAnimationFrame(() => {
        lb.style.opacity = '1';
        lbImg.style.transform = 'scale(1)';
      });
      
      lb.addEventListener('click', () => {
        lb.style.opacity = '0';
        lbImg.style.transform = 'scale(0.85)';
        setTimeout(() => lb.remove(), 400);
      });
    });
  });
});

window.dispatchEvent(new Event('scroll'));
console.log('%c AS Tours & Travels', 'font-size:2rem;font-weight:700;color:#C5A55A;font-family:serif');
console.log('%cScroll-driven travel experience', 'font-size:0.9rem;color:#C8C0B8;font-weight:300');
