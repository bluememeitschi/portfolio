const FACT_URL = 'https://uselessfacts.jsph.pl/random.json?language=en';

async function fetchFact() {
    const factEl = document.getElementById('useless-fact');
    const btn = document.getElementById('fact-refresh');
    if (!factEl || !btn) return;

    btn.disabled = true;
    btn.textContent = 'Loading…';
    try {
        const res = await fetch(FACT_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        factEl.textContent = data && data.text ? data.text : 'No fact returned.';
    } catch (err) {
        console.error('Failed to load fact:', err);
        factEl.textContent = 'Could not load a fact. Please try again.';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Another fact';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const btn = document.getElementById('fact-refresh');
    if (btn) btn.addEventListener('click', fetchFact);
    fetchFact();

    // build list of sections from navbar links (includes "Home" -> #top)
    const navLinks = Array.from(document.querySelectorAll('.navbar a[href^="#"]'));
    const sections = navLinks
        .map(a => a.getAttribute('href').slice(1))
        .map(id => document.getElementById(id))
        .filter(Boolean);

    if (navLinks.length && sections.length) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const id = entry.target.id;
                const link = document.querySelector(`.navbar a[href="#${id}"]`);
                if (!link) return;
                if (entry.isIntersecting) {
                    navLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                } else {
                    if (link.classList.contains('active')) link.classList.remove('active');
                }
            });
        }, {
            root: null,
            rootMargin: '-35% 0% -35% 0%',
            threshold: 0
        });

        sections.forEach(s => observer.observe(s));
    }

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // populate carousel from images folder then init carousel
    await populateCarouselFromImages();
    initCarousel(); // defined below
});

/* Populate carousel from images/manifest.json (preload + filter failed files) */
async function populateCarouselFromImages() {
    const track = document.querySelector('.carousel-track');
    if (!track) return;

    try {
        const res = await fetch('images/manifest.json');
        if (!res.ok) {
            console.warn('Carousel: images/manifest.json not found (HTTP ' + res.status + ').');
            return;
        }
        const list = await res.json();
        if (!Array.isArray(list) || list.length === 0) {
            console.warn('Carousel: manifest.json is empty or invalid.');
            return;
        }

        // preload each image and keep only those that successfully load
        const preload = (src) => new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(src);
            img.onerror = () => reject(src);
            img.src = src;
        });

        const attempts = await Promise.allSettled(
            list.map(filename => preload(`images/${filename}`))
        );

        const loaded = attempts
            .filter(r => r.status === 'fulfilled')
            .map(r => r.value);

        const failed = attempts
            .filter(r => r.status === 'rejected')
            .map(r => r.reason);

        if (loaded.length === 0) {
            console.warn('Carousel: no images could be loaded. Failed list:', failed);
            return;
        }

        // build slides from successfully loaded sources
        track.innerHTML = '';
        loaded.forEach(src => {
            const li = document.createElement('li');
            li.className = 'slide';
            const img = document.createElement('img');
            img.src = src;
            img.alt = '';
            li.appendChild(img);
            track.appendChild(li);
        });

        console.log(`Carousel: loaded ${loaded.length} images. Failed: ${failed.length}`, { loaded, failed });
    } catch (err) {
        console.error('Carousel: failed to load manifest.json or images', err);
    }
}

/* Carousel init (reads .carousel-track after slides are present) */
function initCarousel() {
    const carousel = document.querySelector('.carousel');
    if (!carousel) return;

    const track = carousel.querySelector('.carousel-track');
    const prevBtn = carousel.querySelector('.carousel-btn.prev');
    const nextBtn = carousel.querySelector('.carousel-btn.next');
    const dotsContainer = carousel.querySelector('.carousel-dots');
    const slides = Array.from(track.children);
    if (!slides.length) return;

    let current = 0;
    let autoplayTimer = null;
    const AUTOPLAY_MS = 4500;

    // build dots (disabled - UI uses only side buttons)
    if (dotsContainer) {
        dotsContainer.innerHTML = ''; // keep element for accessibility, but don't populate dots
    }

    function update() {
        const offset = -current * 100;
        track.style.transform = `translateX(${offset}%)`;
        dotsContainer.querySelectorAll('.carousel-dot').forEach((d, i) => {
            d.classList.toggle('active', i === current);
        });
        if (slides.length <= 1) {
            prevBtn && (prevBtn.disabled = true);
            nextBtn && (nextBtn.disabled = true);
        } else {
            prevBtn && (prevBtn.disabled = false);
            nextBtn && (nextBtn.disabled = false);
        }
    }

    function prev() { goTo((current - 1 + slides.length) % slides.length); }
    function next() { goTo((current + 1) % slides.length); }

    function goTo(index) {
        current = (index + slides.length) % slides.length;
        update();
        resetAutoplay();
    }

    prevBtn && prevBtn.addEventListener('click', prev);
    nextBtn && nextBtn.addEventListener('click', next);

    // swipe support for touch / pointer
    let startX = null;
    carousel.addEventListener('pointerdown', (ev) => { startX = ev.clientX; carousel.setPointerCapture(ev.pointerId); });
    carousel.addEventListener('pointerup', (ev) => {
        if (startX === null) return;
        const dx = ev.clientX - startX;
        startX = null;
        if (Math.abs(dx) > 40) dx > 0 ? prev() : next();
    });

    function startAutoplay() {
        if (AUTOPLAY_MS && slides.length > 1) {
            autoplayTimer = setInterval(() => next(), AUTOPLAY_MS);
        }
    }
    function stopAutoplay() { if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; } }
    function resetAutoplay() { stopAutoplay(); startAutoplay(); }

    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('mouseleave', startAutoplay);
    carousel.addEventListener('focusin', stopAutoplay);
    carousel.addEventListener('focusout', startAutoplay);

    // initial
    update();
    startAutoplay();
}