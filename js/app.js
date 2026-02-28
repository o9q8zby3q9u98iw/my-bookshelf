let allBooks = [];

document.addEventListener("DOMContentLoaded", () => {
    fetchBooks();
    
    // Search and Sort Event Listeners
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    
    if (searchInput) searchInput.addEventListener('input', filterAndSortBooks);
    if (sortSelect) sortSelect.addEventListener('change', filterAndSortBooks);
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
        const response = await fetch('/api/books');
        const data = await response.json();
        
        // 2. Read the new combo package format (data.books)
        allBooks = data.books ? data.books : data;
        
        if (!allBooks || allBooks.length === 0) {
            throw new Error("No books found");
        }

        filterAndSortBooks(); // This removes the spinner and draws the books

    } catch (error) {
        console.error("Error loading books:", error);
        
        // 3. Show the Fallback Backup Link if loading fails!
        container.innerHTML = `
            <div class="error-container">
                <p class="error-text">We're having trouble loading the live bookshelf right now.</p>
                <a href="YOUR_BACKUP_LINK_HERE" target="_blank" class="btn-email solid" style="display: inline-block; width: auto; text-decoration: none;">
                    View Backup Bookshelf
                </a>
            </div>
        `;
    }
}

function filterAndSortBooks() {
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    
    const query = searchInput ? searchInput.value.toLowerCase() : '';
    const sort = sortSelect ? sortSelect.value : 'title';

    let filtered = allBooks.filter(book => 
        (book.title && book.title.toLowerCase().includes(query)) || 
        (book.author && book.author.toLowerCase().includes(query))
    );

    if (sort === 'title') {
        filtered.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else if (sort === 'author') {
        filtered.sort((a, b) => (a.author || "").localeCompare(b.author || ""));
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

        // AI Summary Link
        const aiPrompt = `Give me a 5 bullet point summary of the book ${book.title} by ${book.author}.`;
        const aiUrl = `https://chatgpt.com/?q=${encodeURIComponent(aiPrompt)}`;
        const aiLink = document.createElement('a');
        aiLink.href = aiUrl;
        aiLink.className = 'ai-link';
        aiLink.target = '_blank';
        aiLink.innerHTML = `
            <svg class="ai-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
            <span class="ai-tooltip">Ask AI to summarize</span>
        `;
        imgContainer.appendChild(aiLink);

        card.appendChild(imgContainer);

        // Text Body
        const body = document.createElement('div');
        body.className = 'card-body';
        
        const title = document.createElement('h3');
        title.className = 'book-title';
        title.textContent = book.title;
        
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