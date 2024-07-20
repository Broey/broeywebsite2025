document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('nav ul li a');

    links.forEach(link => {
        link.addEventListener('mouseover', () => {
            link.style.color = '#0f0';
        });

        link.addEventListener('mouseout', () => {
            link.style.color = '#fff';
        });
    });

    // Add more interactive features as needed
});
