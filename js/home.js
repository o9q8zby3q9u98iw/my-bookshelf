document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById('contactModal');
    const openBtn = document.getElementById('openContactBtn');
    const closeBtn = document.getElementById('closeContactBtn');
    const formFields = document.getElementById('formFields');
    const formStatus = document.getElementById('formStatus');
    const emailForm = document.getElementById('emailForm');
    const modalHeading = document.getElementById('modalHeading'); 
    
    // 1. Modal Controls
    openBtn.addEventListener('click', () => {
        modal.classList.add('is-open');
        // Reset the form view every time the modal is opened
        formFields.style.display = 'block';
        formStatus.style.display = 'none';
        modalHeading.style.display = 'block'; 
        emailForm.reset();
    });
    
    closeBtn.addEventListener('click', () => modal.classList.remove('is-open'));
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('is-open');
    });

    // 2. Fetch Dynamic Data (Loads quietly in the background)
    const loadDynamicData = async () => {
        const updateHomeUI = (homeData) => {
            if (homeData) {
                if (homeData.Name) document.getElementById('profileName').textContent = homeData.Name;
                if (homeData.Bio) document.getElementById('profileBio').textContent = homeData.Bio;
            }
        };

        try {
            // --- PHASE 1: Check cache first ---
            const cachedData = sessionStorage.getItem('bookshelfData');
            if (cachedData) {
                updateHomeUI(JSON.parse(cachedData).home);
                return; 
            }

            // Otherwise, fetch live
            const response = await fetch('/api/books');
            if (!response.ok) throw new Error("API failed");
            const data = await response.json();
            
            sessionStorage.setItem('bookshelfData', JSON.stringify(data));
            updateHomeUI(data.home);
            
        } catch (err) {
            console.warn("Live dynamic data failed, attempting fallback:", err);
            
            // --- PHASE 1: Try local backup.json ---
            try {
                const fallbackResponse = await fetch('/backup.json');
                const fallbackData = await fallbackResponse.json();
                
                // Cache the fallback so we don't hit the failing API again this session
                sessionStorage.setItem('bookshelfData', JSON.stringify(fallbackData));
                updateHomeUI(fallbackData.home);
            } catch (fallbackErr) {
                console.error("Could not load dynamic home data from API or Backup", fallbackErr);
            }
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
                
                // Hide the inputs, button, AND the heading, showing ONLY the success banner
                formFields.style.display = "none";
                modalHeading.style.display = "none"; 
                
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