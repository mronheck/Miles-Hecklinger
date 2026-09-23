document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const isOpen = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    links.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Split headline text into per-word spans for a staggered, dramatic entrance
  const escapeHtml = (str) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  document.querySelectorAll('[data-split-words]').forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words
      .map((word, i) => `<span class="word" style="--i:${i}">${escapeHtml(word)}</span>`)
      .join(' ');
  });

  // Scroll-triggered reveal animations (words + full elements)
  const revealEls = document.querySelectorAll('.reveal, .word');
  if (prefersReducedMotion) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -80px 0px' }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  // Scroll progress bar
  const progressBar = document.getElementById('progressBar');
  if (progressBar) {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = `${progress}%`;
    };
    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
  }

  // Active nav link tracking
  const navLinks = links ? Array.from(links.querySelectorAll('a[href^="#"]')) : [];
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if (navLinks.length && sections.length && 'IntersectionObserver' in window) {
    const setActive = (id) => {
      navLinks.forEach((link) => {
        link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
      });
    };

    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );

    sections.forEach((section) => navObserver.observe(section));
  }

  // Parallax drift on hero background blobs
  const parallaxEls = Array.from(document.querySelectorAll('.parallax'));
  if (parallaxEls.length && !prefersReducedMotion) {
    let ticking = false;
    const updateParallax = () => {
      const scrollY = window.scrollY;
      parallaxEls.forEach((el) => {
        const speed = parseFloat(el.dataset.parallax || '0.2');
        el.style.transform = `translateY(${scrollY * speed}px)`;
      });
      ticking = false;
    };
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(updateParallax);
        }
      },
      { passive: true }
    );
    updateParallax();
  }

  // Weighted, eased scrolling for a slower, more cinematic pace.
  // Skipped for touch devices (native momentum scrolling already feels right)
  // and for anyone who prefers reduced motion.
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  if (!prefersReducedMotion && !isCoarsePointer && 'requestAnimationFrame' in window) {
    let current = window.scrollY;
    let target = window.scrollY;
    let raf = null;
    const ease = 0.085;

    const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    const step = () => {
      current += (target - current) * ease;
      if (Math.abs(target - current) < 0.5) {
        current = target;
      }
      // behavior: 'instant' avoids double-easing against the page's own
      // CSS `scroll-behavior: smooth`, since this loop does its own easing.
      window.scrollTo({ top: current, left: 0, behavior: 'instant' });

      if (current !== target) {
        raf = requestAnimationFrame(step);
      } else {
        raf = null;
      }
    };

    window.addEventListener(
      'wheel',
      (e) => {
        if (e.ctrlKey) return; // allow pinch-zoom
        e.preventDefault();
        target = Math.min(maxScroll(), Math.max(0, target + e.deltaY));
        if (!raf) {
          raf = requestAnimationFrame(step);
        }
      },
      { passive: false }
    );

    // Keep target in sync with scrolling that doesn't come from our own
    // rAF loop (keyboard, scrollbar drag, in-page anchor links).
    window.addEventListener(
      'scroll',
      () => {
        if (Math.abs(window.scrollY - current) > 2) {
          target = window.scrollY;
          current = window.scrollY;
        }
      },
      { passive: true }
    );

    window.addEventListener('resize', () => {
      target = Math.min(maxScroll(), target);
    });
  }
});
