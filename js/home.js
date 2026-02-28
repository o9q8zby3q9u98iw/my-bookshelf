document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById('contactModal');
    const openBtn = document.getElementById('openContactBtn');
    const closeBtn = document.getElementById('closeContactBtn');
    const formFields = document.getElementById('formFields');
    const formStatus = document.getElementById('formStatus');
    const emailForm = document.getElementById('emailForm');
    
    // 1. Modal Controls
    openBtn.addEventListener('click', () => {
        modal.classList.add('is-open');
        // Reset the form view every time the modal is opened
        formFields.style.display = 'block';
        formStatus.style.display = 'none';
        emailForm.reset();
    });
    closeBtn.addEventListener('click', () => modal.classList.remove('is-open'));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('is-open');
    });

    // 2. Fetch Dynamic Data (Loads quietly in the background)
    const loadDynamicData = async () => {
        try {
            const response = await fetch('/api/books');
            const data = await response.json();
            
            if (data.home) {
                if (data.home.Name) document.getElementById('profileName').textContent = data.home.Name;
                if (data.home.Bio) document.getElementById('profileBio').textContent = data.home.Bio;
            }
        } catch (err) {
            console.error("Could not load dynamic home data", err);
        }
    };
    loadDynamicData();

    // 3. Handle Email Form Submit
    emailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        submitBtn.textContent = "Sending...";
        submitBtn.disabled = true;
        
        // Clear previous styling before new submission
        formStatus.className = "";
        formStatus.style.display = "none";
        
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
            
            const rawText = await res.text();
            
            if (rawText.includes("success")) {
                formStatus.textContent = "Message sent successfully!";
                formStatus.className = "status-success";
                // Hide the inputs and button, showing ONLY the success banner
                formFields.style.display = "none";
                emailForm.reset(); 
            } else {
                throw new Error(rawText);
            }
        } catch (error) {
            console.error("Form Error:", error);
            formStatus.textContent = "Error sending message. Please try again.";
            formStatus.className = "status-error"; 
        } finally {
            formStatus.style.display = "block";
            submitBtn.textContent = "Send Message";
            submitBtn.disabled = false;
        }
    });
});