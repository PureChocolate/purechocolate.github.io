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