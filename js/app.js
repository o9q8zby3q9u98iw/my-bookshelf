let allBooks = [];
let currentFilteredBooks = [];
let displayCount = 0;
const CHUNK_SIZE = 30;
let scrollObserver;

document.addEventListener("DOMContentLoaded", () => {
    fetchBooks();
    
    // Search and Sort Event Listeners
    const searchInput = document.getElementById('searchInput');
    const sortBox = document.getElementById('sortBox'); 
    
    if (searchInput) searchInput.addEventListener('input', filterAndSortBooks);
    if (sortBox) sortBox.addEventListener('change', filterAndSortBooks); 

    // --- Back to Top Button Logic ---
    const backToTopBtn = document.getElementById('backToTop');
    if (backToTopBtn) {
        let lastScrollY = window.scrollY;

        // Show/hide button based on scroll position AND scroll direction
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            
            // Only show if the user is scrolling UP and is past the 350px mark
            if (currentScrollY < lastScrollY && currentScrollY > 350) {
                backToTopBtn.classList.add('is-visible');
            } else {
                // Hide if scrolling DOWN or near the top
                backToTopBtn.classList.remove('is-visible');
            }
            
            lastScrollY = currentScrollY;
        }, { passive: true }); // passive: true improves scroll performance

        // Smooth scroll back to top when clicked
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});

async function fetchBooks() {
    const container = document.getElementById('bookshelf');
    
    // 1. Instantly show the Loading Spinner
    container.innerHTML = `
        <div class="loader-container">
            <div class="spinner"></div>
        </div>
    `;

    try {
        // --- PHASE 1: Session Storage Cache ---
        const cachedData = sessionStorage.getItem('bookshelfData');
        if (cachedData) {
            const data = JSON.parse(cachedData);
            allBooks = data.books ? data.books : data;
            filterAndSortBooks();
            return; // Exit early since we have the data locally
        }

        // Attempt to fetch live data
        const response = await fetch('/api/books');
        
        if (!response.ok) {
            if (response.status === 404) throw new Error("API Endpoint Not Found (404). Check Cloudflare routing.");
            if (response.status === 500) throw new Error("Server Error (500). Cloudflare failed to fetch the Google Script URL.");
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            throw new Error("Invalid JSON returned. Your Google Script might not be deployed as 'Anyone' or the URL is incorrect.");
        }
        
        allBooks = data.books ? data.books : data;
        
        if (!allBooks || allBooks.length === 0) {
            throw new Error("API connection successful, but no books were found in the database. Ensure your Google Sheet has data.");
        }

        // Save to cache for the session
        sessionStorage.setItem('bookshelfData', JSON.stringify(data));
        filterAndSortBooks(); 

    } catch (error) {
        console.warn("Live API failed, attempting fallback...", error);
        
        // --- PHASE 1: Local Fallback (backup.json) ---
        try {
            const fallbackResponse = await fetch('/backup.json');
            if (!fallbackResponse.ok) throw new Error("Local backup.json not found.");
            
            const fallbackData = await fallbackResponse.json();
            
            // Save fallback to cache so we don't keep trying to fetch the broken API this session
            sessionStorage.setItem('bookshelfData', JSON.stringify(fallbackData));
            allBooks = fallbackData.books ? fallbackData.books : fallbackData;
            filterAndSortBooks();
            
        } catch (fallbackError) {
            console.error("Database connection AND local fallback failed:", fallbackError);
            
            // Graceful error UI that prints both specific error messages for troubleshooting
            container.innerHTML = `
                <div class="error-container">
                    <h2 style="color: #1d1d1f; font-weight: 600; margin-bottom: 0.5rem;">Library Unavailable</h2>
                    <p style="color: #86868b; font-size: 1.05rem; margin-bottom: 1.5rem;">We couldn't load the books from the live server or the local backup.</p>
                    
                    <div style="background-color: #ffebee; color: #c62828; padding: 16px; border-radius: 8px; border: 1px solid #ffcdd2; font-family: monospace; font-size: 0.9rem; text-align: left; display: inline-block; max-width: 100%; word-break: break-word;">
                        <strong>Diagnostic Error:</strong><br>
                        Live: ${error.message}<br>
                        Backup: ${fallbackError.message}
                    </div>
                </div>
            `;
        }
    }
}

function filterAndSortBooks() {
    const searchInput = document.getElementById('searchInput');
    const sortBox = document.getElementById('sortBox'); 
    
    const query = searchInput ? searchInput.value.toLowerCase() : '';
    const sort = sortBox ? sortBox.value : 'none';

    let filtered = allBooks.filter(book => 
        (book.title && book.title.toLowerCase().includes(query)) || 
        (book.author && book.author.toLowerCase().includes(query))
    );

    if (sort === 'titleAsc') {
        filtered.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else if (sort === 'titleDesc') {
        filtered.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
    } else if (sort === 'authorAsc') {
        filtered.sort((a, b) => (a.author || "").localeCompare(b.author || ""));
    } else if (sort === 'authorDesc') {
        filtered.sort((a, b) => (b.author || "").localeCompare(a.author || ""));
    }

    // --- PHASE 1: Reset for Chunked Rendering ---
    currentFilteredBooks = filtered;
    displayCount = 0;
    
    const container = document.getElementById('bookshelf');
    container.innerHTML = ''; // Clear out the grid entirely

    // Setup the infinite scroll anchor if it doesn't exist
    let anchor = document.getElementById('scrollAnchor');
    if (!anchor) {
        anchor = document.createElement('div');
        anchor.id = 'scrollAnchor';
        anchor.style.height = '1px';
        document.getElementById('main-content').appendChild(anchor);
    }

    setupIntersectionObserver(anchor);
    loadMoreBooks(); // Load the first chunk
}

function setupIntersectionObserver(anchor) {
    if (scrollObserver) scrollObserver.disconnect();
    
    scrollObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            loadMoreBooks();
        }
    }, { rootMargin: "400px" }); // Pre-load when user is 400px away from the bottom

    scrollObserver.observe(anchor);
}

function loadMoreBooks() {
    if (displayCount >= currentFilteredBooks.length) return; // All books rendered

    const nextChunk = currentFilteredBooks.slice(displayCount, displayCount + CHUNK_SIZE);
    displayCount += CHUNK_SIZE;
    renderBooks(nextChunk);
}

function renderBooks(booksChunk) {
    const container = document.getElementById('bookshelf');

    if (booksChunk.length === 0 && displayCount === 0) {
        container.innerHTML = '<p class="empty-state">No books match your search.</p>';
        return;
    }

    booksChunk.forEach(book => {
        const card = document.createElement('div');
        card.className = 'book-card';
        
        // Click to flip card
        card.addEventListener('click', (e) => {
            if (e.target.tagName.toLowerCase() === 'a') return;
            document.querySelectorAll('.book-card.is-active').forEach(c => {
                if (c !== card) c.classList.remove('is-active');
            });
            card.classList.toggle('is-active');
        });

        // Image with Shimmer loading effect
        const imgContainer = document.createElement('div');
        imgContainer.className = 'img-container';
        
        const img = document.createElement('img');
        img.className = 'cover-img';
        img.alt = book.title;
        img.loading = 'lazy';
        
        img.onload = () => {
            img.classList.add('loaded');
            imgContainer.classList.add('stop-shimmer');
        };
        img.onerror = () => {
            img.src = 'https://placehold.co/250x375/e8e8ed/1d1d1f?text=No+Cover';
            img.classList.add('loaded');
            imgContainer.classList.add('stop-shimmer');
        };
        
        img.src = book.cover || 'https://placehold.co/250x375/e8e8ed/1d1d1f?text=No+Cover';
        imgContainer.appendChild(img);

        // Summary Overlay
        if (book.summary) {
            const overlay = document.createElement('div');
            overlay.className = 'summary-overlay';
            overlay.innerHTML = `<div class="summary-content"><p class="summary-text">${book.summary}</p></div>`;
            imgContainer.appendChild(overlay);
        }

        // MINIMALIST AI SUMMARY LINK
        const aiPrompt = `Give me a 5 bullet point summary of the book ${book.title} by ${book.author}.`;
        const aiUrl = `https://chatgpt.com/?q=${encodeURIComponent(aiPrompt)}`;
        const aiLink = document.createElement('a');
        aiLink.href = aiUrl;
        aiLink.className = 'ai-link';
        aiLink.target = '_blank';
        aiLink.innerHTML = `
            <svg class="ai-sparkle" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 8l-1.06-2.31L15.62 4.62 17.94 3.56 19 1.25l1.06 2.31L22.38 4.62l-2.32 1.06L19 8zm-8 14l-2.6-5.7L2.7 13.7l5.7-2.6L11 5.4l2.6 5.7 5.7 2.6-5.7 2.6L11 22z"/></svg>
            Ai summary: Read more
        `;
        imgContainer.appendChild(aiLink);

        card.appendChild(imgContainer);

        // Text Body
        const body = document.createElement('div');
        body.className = 'card-body';
        
        const title = document.createElement('h3');
        title.className = 'book-title';
        title.textContent = book.title;
        title.title = book.title; 
        
        const author = document.createElement('p');
        author.className = 'book-author';
        author.textContent = `by ${book.author}`;
        
        body.appendChild(title);
        body.appendChild(author);

        // Amazon Button
        if (book.amazonLink) {
            const btn = document.createElement('a');
            btn.href = book.amazonLink;
            btn.target = '_blank';
            btn.className = 'btn-amazon';
            btn.textContent = 'View on Amazon';
            body.appendChild(btn);
        }

        card.appendChild(body);
        
        // Append instead of clear to support endless scroll
        container.appendChild(card);
    });
}