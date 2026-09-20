document.addEventListener('DOMContentLoaded', function () {

    /* ---------- back to top ---------- */
    const backToTopButton = document.getElementById('back-to-top');
    window.addEventListener('scroll', () => {
        backToTopButton.classList.toggle('show', window.pageYOffset > 400);
    }, { passive: true });

    /* ---------- nav active section ---------- */
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('#navbar .nav-links a');

    function navHighlighter() {
        let currentSection = '';
        const scrollY = window.pageYOffset;

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 80;
            if (scrollY >= sectionTop && scrollY < sectionTop + section.offsetHeight) {
                currentSection = section.getAttribute('id');
            } else if (scrollY + window.innerHeight >= document.documentElement.scrollHeight
                       && section === sections[sections.length - 1]) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href').substring(1) === currentSection);
        });
    }

    window.addEventListener('scroll', navHighlighter, { passive: true });
    navHighlighter();

    /* ---------- reveal on scroll ---------- */
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const revealEls = document.querySelectorAll('.reveal');

    if (prefersReduced || !('IntersectionObserver' in window)) {
        revealEls.forEach(el => el.classList.add('in'));
    } else {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.05 });
        revealEls.forEach(el => observer.observe(el));
    }

    /* ---------- project filters ---------- */
    const chips = document.querySelectorAll('.filters .chip');
    const cards = document.querySelectorAll('.project-card');
    const groupHeadings = document.querySelectorAll('.group-heading');

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const filter = chip.dataset.filter;
            chips.forEach(c => c.classList.toggle('active', c === chip));

            cards.forEach(card => {
                const show = filter === 'all' || card.dataset.pillar === filter;
                card.style.display = show ? '' : 'none';
            });

            // hide a group heading when all of its cards are filtered out
            groupHeadings.forEach(heading => {
                let sibling = heading.nextElementSibling;
                let anyVisible = false;
                while (sibling && !sibling.classList.contains('group-heading')) {
                    if (sibling.classList.contains('project-card')
                        && sibling.style.display !== 'none') {
                        anyVisible = true;
                        break;
                    }
                    sibling = sibling.nextElementSibling;
                }
                heading.style.display = anyVisible ? '' : 'none';
            });
        });
    });

    /* ---------- lightbox ---------- */
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = lightbox.querySelector('img');
    const lightboxCaption = lightbox.querySelector('.lb-caption');

    document.querySelectorAll('.lightbox-link').forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            lightboxImg.src = link.getAttribute('href');
            lightboxImg.alt = link.dataset.caption || '';
            lightboxCaption.textContent = link.dataset.caption || '';
            lightbox.showModal();
        });
    });

    lightbox.querySelector('.lb-close').addEventListener('click', () => lightbox.close());
    lightbox.addEventListener('click', event => {
        if (event.target === lightbox) lightbox.close();
    });

});

/* ============================================================
   OCR Translate live demo (home server via Cloudflare tunnel)
   ============================================================ */

async function checkStatus() {
    const badge = document.getElementById('ocr-status');
    if (!badge) return;
    try {
        const res = await fetch('https://ocr.gurkirat.net/api/health', { method: 'GET', signal: AbortSignal.timeout(10000) });
        if (res.ok) {
            badge.textContent = 'online';
            badge.className = 'ocr-status online';
            return;
        }
    } catch (_) {}
    badge.textContent = 'offline';
    badge.className = 'ocr-status offline';
}
checkStatus();

async function handleOCR(e) {
    e.preventDefault();
    const file = document.getElementById('ocr-file').files[0];
    if (!file) return;
    const result = document.getElementById('ocr-result');
    const spinner = document.getElementById('ocr-spinner');
    result.innerText = '';
    result.classList.remove('error');
    spinner.classList.remove('hidden');
    const form = new FormData();
    form.append('image', file);
    try {
        const res = await fetch('https://ocr.gurkirat.net/api/translate', { method: 'POST', body: form });
        const data = await res.json();
        let out = '';
        if (data.extracted) out += data.extracted;
        if (data.translation) out += '\n\n--- Translation ---\n' + data.translation;
        result.innerText = out || data.error || 'No output';
        if (data.error || !out) result.classList.add('error');
    } catch (err) {
        result.innerText = 'Connection failed: ' + err.message;
        result.classList.add('error');
    } finally {
        spinner.classList.add('hidden');
    }
}

async function handleTextTranslate(e) {
    e.preventDefault();
    const text = document.getElementById('text-input').value.trim();
    if (!text) return;
    const result = document.getElementById('ocr-result');
    const spinner = document.getElementById('ocr-spinner');
    result.innerText = '';
    result.classList.remove('error');
    spinner.classList.remove('hidden');
    try {
        const res = await fetch('https://ocr.gurkirat.net/api/translate-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text }),
        });
        const data = await res.json();
        result.innerText = data.translation || data.error || 'No output';
        if (data.error) result.classList.add('error');
    } catch (err) {
        result.innerText = 'Connection failed: ' + err.message;
        result.classList.add('error');
    } finally {
        spinner.classList.add('hidden');
    }
}
