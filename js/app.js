let allBooks = [];

document.addEventListener("DOMContentLoaded", () => {
    fetchBooks();
    
    // Search and Sort Event Listeners
    const searchInput = document.getElementById('searchInput');
    const sortBox = document.getElementById('sortBox'); // Fixed ID to match HTML
    
    if (searchInput) searchInput.addEventListener('input', filterAndSortBooks);
    if (sortBox) sortBox.addEventListener('change', filterAndSortBooks); // Fixed ID to match HTML

    // --- NEW: Back to Top Button Logic ---
    const backToTopBtn = document.getElementById('backToTop');
    if (backToTopBtn) {
        // Show/hide button based on scroll position
        window.addEventListener('scroll', () => {
            if (window.scrollY > 350) {
                backToTopBtn.classList.add('is-visible');
            } else {
                backToTopBtn.classList.remove('is-visible');
            }
        });

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
        // ATTEMPT 1: Try the live Google Sheet API
        const response = await fetch('/api/books');
        if (!response.ok) throw new Error("Live API failed");
        const data = await response.json();
        
        allBooks = data.books ? data.books : data;
        if (!allBooks || allBooks.length === 0) throw new Error("No live books found");

        filterAndSortBooks(); // Success! Draw the books.

    } catch (error) {
        console.warn("Live database failed. Attempting to load backup...", error);
        
        try {
            // ATTEMPT 2: The Invincible Local Backup
            const backupResponse = await fetch('/backup.json');
            const backupData = await backupResponse.json();
            
            allBooks = backupData.books ? backupData.books : backupData;
            if (!allBooks || allBooks.length === 0) throw new Error("Backup file empty");
            
            filterAndSortBooks(); // Success! Draw the backup books.
            
        } catch (backupError) {
            console.error("Total failure. Showing polite error:", backupError);
            
            // ATTEMPT 3: Only show this if EVERYTHING completely breaks
            container.innerHTML = `
                <div class="error-container">
                    <p class="error-text">We're having a little trouble connecting to the database right now. Please check back in a few minutes!</p>
                </div>
            `;
        }
    }
}

function filterAndSortBooks() {
    const searchInput = document.getElementById('searchInput');
    const sortBox = document.getElementById('sortBox'); // Fixed ID
    
    const query = searchInput ? searchInput.value.toLowerCase() : '';
    const sort = sortBox ? sortBox.value : 'none';

    let filtered = allBooks.filter(book => 
        (book.title && book.title.toLowerCase().includes(query)) || 
        (book.author && book.author.toLowerCase().includes(query))
    );

    // Completely updated sorting logic for Ascending and Descending
    if (sort === 'titleAsc') {
        filtered.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else if (sort === 'titleDesc') {
        filtered.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
    } else if (sort === 'authorAsc') {
        filtered.sort((a, b) => (a.author || "").localeCompare(b.author || ""));
    } else if (sort === 'authorDesc') {
        filtered.sort((a, b) => (b.author || "").localeCompare(a.author || ""));
    }

    renderBooks(filtered);
}

function renderBooks(books) {
    const container = document.getElementById('bookshelf');
    container.innerHTML = ''; // Clear loader or previous books

    if (books.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No books match your search.</p>';
        return;
    }

    books.forEach(book => {
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
            img.src = 'https://via.placeholder.com/250x375?text=No+Cover';
            img.classList.add('loaded');
            imgContainer.classList.add('stop-shimmer');
        };
        
        img.src = book.cover || 'https://via.placeholder.com/250x375?text=No+Cover';
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
        title.title = book.title; // Native HTML tooltip so users can hover to see the full long title
        
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