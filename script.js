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

document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.animated-button');

    buttons.forEach(button => {
        button.addEventListener('mouseover', () => {
            button.style.transform = 'translateY(-5px)';
        });

        button.addEventListener('mouseout', () => {
            button.style.transform = 'translateY(0)';
        });
    });
});

/* JavaScript interaction */
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
