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
            
            if (currentScrollY < lastScrollY && currentScrollY > 350) {
                backToTopBtn.classList.add('is-visible');
            } else {
                backToTopBtn.classList.remove('is-visible');
            }
            
            lastScrollY = currentScrollY;
        }, { passive: true });

        // Smooth scroll back to top when clicked
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});

async function fetchBooks() {
    const container = document.getElementById('bookshelf');
    
    // Instantly show the Loading Spinner (will likely disappear too fast to see now!)
    container.innerHTML = `
        <div class="loader-container">
            <div class="spinner"></div>
        </div>
    `;

    // Helper function to render data
    const loadDataIntoView = (data) => {
        allBooks = data.books ? data.books : data;
        if (allBooks && allBooks.length > 0) {
            filterAndSortBooks();
        }
    };

    // --- PHASE 1: LOCAL-FIRST (Stale Data) ---
    const cachedData = sessionStorage.getItem('bookshelfData');
    if (cachedData) {
        // Load immediately from the user's browser cache if available
        loadDataIntoView(JSON.parse(cachedData));
    } else {
        try {
            // Fetch the lightning-fast local backup on first load
            const fallbackResponse = await fetch('/backup.json');
            if (fallbackResponse.ok) {
                const fallbackData = await fallbackResponse.json();
                loadDataIntoView(fallbackData);
            }
        } catch (err) {
            console.warn("Could not load local backup.json:", err);
        }
    }

    // --- PHASE 2: BACKGROUND REVALIDATION (Live Data) ---
    try {
        const liveResponse = await fetch('/api/books');
        
        if (liveResponse.ok) {
            const liveData = await liveResponse.json();
            const newStringified = JSON.stringify(liveData);
            
            // Only update the screen if the live database is DIFFERENT from our local/cached data
            if (newStringified !== sessionStorage.getItem('bookshelfData')) {
                sessionStorage.setItem('bookshelfData', newStringified);
                loadDataIntoView(liveData);
                console.log("Background sync complete: New books found and added to the shelf.");
            }
        }
    } catch (error) {
        console.warn("Live API background sync failed. Continuing to use local data.", error);
        
        // Only show an error if absolutely no data loaded at all
        if (allBooks.length === 0) {
            container.innerHTML = `
                <div class="error-container">
                    <h2 style="color: #1d1d1f; font-weight: 600; margin-bottom: 0.5rem;">Library Unavailable</h2>
                    <p style="color: #86868b; font-size: 1.05rem; margin-bottom: 1.5rem;">We couldn't load the books from the live server or the local backup.</p>
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

    // Reset for Chunked Rendering
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
    }, { rootMargin: "400px" });

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
        container.appendChild(card);
    });
}
