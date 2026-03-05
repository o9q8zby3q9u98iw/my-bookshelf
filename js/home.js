document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById('contactModal');
    const openBtn = document.getElementById('openContactBtn');
    const closeBtn = document.getElementById('closeContactBtn');
    const formFields = document.getElementById('formFields');
    const formStatus = document.getElementById('formStatus');
    const emailForm = document.getElementById('emailForm');
    const modalHeading = document.getElementById('modalHeading'); 
    
    openBtn.addEventListener('click', () => {
        modal.classList.add('is-open');
        formFields.style.display = 'block';
        formStatus.style.display = 'none';
        modalHeading.style.display = 'block'; 
        emailForm.reset();
    });
    
    closeBtn.addEventListener('click', () => modal.classList.remove('is-open'));
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('is-open');
    });

    const loadDynamicData = async () => {
        const updateHomeUI = (homeData) => {
            if (homeData) {
                if (homeData.Name) document.getElementById('profileName').textContent = homeData.Name;
                if (homeData.Bio) document.getElementById('profileBio').textContent = homeData.Bio;
            }
        };

        // --- PHASE 1: LOCAL-FIRST ---
        const cachedDataString = sessionStorage.getItem('bookshelfData');
        if (cachedDataString) {
            updateHomeUI(JSON.parse(cachedDataString).home);
        } else {
            try {
                const fallbackResponse = await fetch('backup.json');
                if (fallbackResponse.ok) {
                    const fallbackData = await fallbackResponse.json();
                    sessionStorage.setItem('bookshelfData', JSON.stringify(fallbackData));
                    updateHomeUI(fallbackData.home);
                }
            } catch (err) {
                console.warn("Could not load local backup on home:", err);
            }
        }

        // --- PHASE 2: BACKGROUND REVALIDATION ---
        try {
            const liveResponse = await fetch('/api/books');
            if (liveResponse.ok) {
                const liveData = await liveResponse.json();
                
                // Preserve local image paths so we don't corrupt the cache for the bookshelf page
                const currentCacheStr = sessionStorage.getItem('bookshelfData');
                if (currentCacheStr) {
                    const currentCache = JSON.parse(currentCacheStr);
                    if (currentCache.books && liveData.books) {
                        const localCovers = {};
                        currentCache.books.forEach(b => {
                            if (b.id && b.cover && !b.cover.startsWith('http')) {
                                localCovers[b.id] = b.cover;
                            }
                        });
                        liveData.books.forEach(b => {
                            if (localCovers[b.id]) {
                                b.cover = localCovers[b.id];
                            }
                        });
                    }
                }
                
                const newStringified = JSON.stringify(liveData);
                if (newStringified !== currentCacheStr) {
                    sessionStorage.setItem('bookshelfData', newStringified);
                    updateHomeUI(liveData.home);
                }
            }
        } catch (err) {
            console.warn("Background home data sync failed. Using local.", err);
        }
    };
    
    loadDynamicData();

    emailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = "Sending...";
        submitBtn.disabled = true;
        
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
