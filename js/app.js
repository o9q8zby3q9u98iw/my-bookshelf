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
    const cachedDataString = sessionStorage.getItem('bookshelfData');
    let hasLoadedLocal = false;

    if (cachedDataString) {
        // Load immediately from the browser cache if available
        loadDataIntoView(JSON.parse(cachedDataString));
        hasLoadedLocal = true;
    } else {
        try {
            // Fetch the lightning-fast local backup on first load
            const fallbackResponse = await fetch('backup.json');
            if (fallbackResponse.ok) {
                const fallbackData = await fallbackResponse.json();
                sessionStorage.setItem('bookshelfData', JSON.stringify(fallbackData));
                loadDataIntoView(fallbackData);
                hasLoadedLocal = true;
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
            
            // FIX: Map optimized local cover paths onto the live data
            // so it doesn't trigger a false "change" and reload the images.
            const currentCacheString = sessionStorage.getItem('bookshelfData');
            
            if (currentCacheString) {
                const currentCacheData = JSON.parse(currentCacheString);
                
                if (currentCacheData.books && liveData.books) {
                    // 1. Create a lookup map of ID -> Local Cover Path
                    const localCoversMap = {};
                    currentCacheData.books.forEach(b => {
                        // Check if the cover exists and is NOT a raw HTTP link
                        if (b.id && b.cover && !b.cover.startsWith('http')) {
                            localCoversMap[b.id] = b.cover;
                        }
                    });
                    
                    // 2. Inject local covers into the incoming live data
                    liveData.books.forEach(b => {
                        if (localCoversMap[b.id]) {
                            b.cover = localCoversMap[b.id];
                        }
                    });
                }
            }
            
            const newStringified = JSON.stringify(liveData);
            
            // Only update the screen if the live database is TRULY different 
            // (e.g., you added a new book or edited a summary in Google Sheets)
            if (newStringified !== currentCacheString) {
                sessionStorage.setItem('bookshelfData', newStringified);
                loadDataIntoView(liveData);
                console.log("Background sync complete: Changes found, updating shelf.");
            }
        }
    } catch (error) {
        console.warn("Live API background sync failed. Continuing to use local data.", error);
        
        if (!hasLoadedLocal) {
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

    currentFilteredBooks = filtered;
    displayCount = 0;
    
    const container = document.getElementById('bookshelf');
    container.innerHTML = ''; 

    let anchor = document.getElementById('scrollAnchor');
    if (!anchor) {
        anchor = document.createElement('div');
        anchor.id = 'scrollAnchor';
        anchor.style.height = '1px';
        document.getElementById('main-content').appendChild(anchor);
    }

    setupIntersectionObserver(anchor);
    loadMoreBooks(); 
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
    if (displayCount >= currentFilteredBooks.length) return;

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
        
        card.addEventListener('click', (e) => {
            if (e.target.tagName.toLowerCase() === 'a') return;
            document.querySelectorAll('.book-card.is-active').forEach(c => {
                if (c !== card) c.classList.remove('is-active');
            });
            card.classList.toggle('is-active');
        });

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

        if (book.summary) {
            const overlay = document.createElement('div');
            overlay.className = 'summary-overlay';
            overlay.innerHTML = `<div class="summary-content"><p class="summary-text">${book.summary}</p></div>`;
            imgContainer.appendChild(overlay);
        }

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
