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

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('fact-refresh');
    if (btn) btn.addEventListener('click', fetchFact);
    fetchFact();

    // highlight navbar links as sections come into view
    const navLinks = document.querySelectorAll('.navbar a');
    const sections = document.querySelectorAll('#projects, #skills');

    if (navLinks.length && sections.length) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const id = entry.target.id;
                const link = document.querySelector(`.navbar a[href="#${id}"]`);
                if (!link) return;
                if (entry.isIntersecting) link.classList.add('active');
                else link.classList.remove('active');
            });
        }, {
            root: null,
            rootMargin: `-35% 0% -35% 0%`,
            threshold: 0
        });

        sections.forEach(s => observer.observe(s));
    }
});