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
});