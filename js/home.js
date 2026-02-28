document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById('contactModal');
    const openBtn = document.getElementById('openContactBtn');
    const closeBtn = document.getElementById('closeContactBtn');

    // Open Modal
    openBtn.addEventListener('click', () => {
        modal.classList.add('is-open');
    });

    // Close Modal via button
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('is-open');
    });

    // Close Modal by clicking outside of it
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('is-open');
        }
    });

    // Handle Form Submit (Placeholder for Phase 2)
    document.getElementById('emailForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = "Sending...";
        submitBtn.disabled = true;
        
        // We will add the fetch() code to send this to Cloudflare in the next step!
        console.log("Form ready to send.");
    });
});
