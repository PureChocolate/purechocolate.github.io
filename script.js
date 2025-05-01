document.addEventListener('DOMContentLoaded', function() {

    // --- Back to Top Button Functionality ---
    const backToTopButton = document.getElementById('back-to-top');

    // Show/Hide button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) { // Show after scrolling 300px
            backToTopButton.classList.add('show');
        } else {
            backToTopButton.classList.remove('show');
        }
    });

    // Smooth scroll to top when button is clicked (handled by CSS `scroll-behavior: smooth` on <a> link)
    // If you wanted JS-based smooth scroll (e.g., for a <button>):
    // backToTopButton.addEventListener('click', (e) => {
    //     e.preventDefault(); // Prevent default if it was a link
    //     window.scrollTo({ top: 0, behavior: 'smooth' });
    // });


    // --- Navbar Active Link Highlighting ---
    const sections = document.querySelectorAll('section[id]'); // Get all sections with an ID
    const navLinks = document.querySelectorAll('#navbar .nav-links a');

    window.addEventListener('scroll', navHighlighter);

    function navHighlighter() {
        let currentSection = '';
        const scrollY = window.pageYOffset;

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100; // Offset slightly more than nav height + padding
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                currentSection = sectionId;
            }
            // Handle edge case for bottom section filling the viewport
             else if (scrollY + window.innerHeight >= document.documentElement.scrollHeight && sectionId === sections[sections.length-1].id) {
                currentSection = sectionId;
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            // Compare link's href attribute (removing the '#') with the currentSection id
            if (link.getAttribute('href').substring(1) === currentSection) {
                link.classList.add('active');
            }
        });

        // Handle case when scrolled to the very top (highlight 'Summary' or first link)
         if (currentSection === '' && scrollY < sections[0].offsetTop - 100 ) {
             if (navLinks.length > 0 && navLinks[0].getAttribute('href') === '#about') {
                 navLinks[0].classList.add('active');
             }
        }
    }

    // Initial call to set active link on page load
    navHighlighter();


    // --- Smooth scroll for Navbar links (redundant if html scroll-behavior is set, but good practice) ---
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // We can let the browser's smooth scroll handle this via CSS
            // If we needed more control or browsers didn't support it:
            // e.preventDefault();
            // const targetId = this.getAttribute('href'); // e.g., "#about"
            // const targetElement = document.querySelector(targetId);
            // if (targetElement) {
            //     const navHeight = document.getElementById('navbar').offsetHeight;
            //     const targetPosition = targetElement.offsetTop - navHeight - 10; // Adjust offset
            //     window.scrollTo({
            //         top: targetPosition,
            //         behavior: 'smooth'
            //     });
            // }

            // Optionally close mobile menu here if you add one later
        });
    });


}); // End DOMContentLoaded