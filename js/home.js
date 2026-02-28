document.addEventListener("DOMContentLoaded", async () => {
    const modal = document.getElementById('contactModal');
    const openBtn = document.getElementById('openContactBtn');
    const closeBtn = document.getElementById('closeContactBtn');
    
    // 1. Fetch Dynamic Data from Google Sheet via Proxy
    try {
        const response = await fetch('/api/books');
        const data = await response.json();
        
        if (data.home) {
            if (data.home.Name) document.getElementById('profileName').textContent = data.home.Name;
            if (data.home.Bio) document.getElementById('profileBio').textContent = data.home.Bio;
            // Image override has been removed so it respects your GitHub folder!
        }
    } catch (err) {
        console.error("Could not load dynamic home data", err);
    }

    // 2. Modal Controls
    openBtn.addEventListener('click', () => modal.classList.add('is-open'));
    closeBtn.addEventListener('click', () => modal.classList.remove('is-open'));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('is-open');
    });

    // 3. Handle Email Form Submit via Cloudflare Proxy
    document.getElementById('emailForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const statusText = document.getElementById('formStatus');
        
        submitBtn.textContent = "Sending...";
        submitBtn.disabled = true;
        
        const payload = {
            name: document.getElementById('senderName').value,
            email: document.getElementById('senderEmail').value,
            message: document.getElementById('senderMessage').value
        };

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const result = await res.json();
            
            if (result.status === "success") {
                statusText.textContent = "Message sent successfully!";
                statusText.style.color = "green";
                e.target.reset();
            } else {
                throw new Error("Failed by server");
            }
        } catch (error) {
            statusText.textContent = "Error sending message. Please try again.";
            statusText.style.color = "red";
        } finally {
            statusText.style.display = "block";
            submitBtn.textContent = "Send Message";
            submitBtn.disabled = false;
        }
    });
});