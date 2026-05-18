document.addEventListener('DOMContentLoaded', function() {

    const backToTopButton = document.getElementById('back-to-top');

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 400) {
            backToTopButton.classList.add('show');
        } else {
            backToTopButton.classList.remove('show');
        }
    });

    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('#navbar .nav-links a');

    window.addEventListener('scroll', navHighlighter);

    function navHighlighter() {
        let currentSection = '';
        const scrollY = window.pageYOffset;

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 80;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                currentSection = sectionId;
            } else if (scrollY + window.innerHeight >= document.documentElement.scrollHeight && sectionId === sections[sections.length - 1].id) {
                currentSection = sectionId;
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').substring(1) === currentSection) {
                link.classList.add('active');
            }
        });

        if (currentSection === '' && scrollY < sections[0].offsetTop - 80) {
            if (navLinks.length > 0 && navLinks[0].getAttribute('href') === '#about') {
                navLinks[0].classList.add('active');
            }
        }
    }

    navHighlighter();
});

async function checkStatus() {
    const badge = document.getElementById('ocr-status');
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