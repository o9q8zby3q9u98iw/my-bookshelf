let allBooks = [];
let searchTimeout = null;
const API_URL = "/api/books"; // Points to your Cloudflare proxy

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch(API_URL);
        allBooks = await response.json();
        applyFilters(); // Renders the initial list
    } catch (error) {
        document.getElementById('bookshelf').innerHTML = `<p style="text-align:center; grid-column:1/-1; color:#ff3b30;">Error loading books.</p>`;
    }
});

// Search and Sort Listeners
document.getElementById('searchInput').addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(applyFilters, 250);
});
document.getElementById('sortBox').addEventListener('change', applyFilters);

// Smart Event Delegation for Card Clicks
document.addEventListener('click', function(e) {
    if (e.target.closest('.btn-amazon') || e.target.closest('.ai-link')) return; 
    
    const clickedCard = e.target.closest('.book-card');
    const allActiveCards = document.querySelectorAll('.book-card.is-active');

    if (!clickedCard) {
        allActiveCards.forEach(card => card.classList.remove('is-active'));
        return;
    }

    const isAlreadyOpen = clickedCard.classList.contains('is-active');
    allActiveCards.forEach(card => card.classList.remove('is-active'));
    if (!isAlreadyOpen) { clickedCard.classList.add('is-active'); }
});

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const sortValue = document.getElementById('sortBox').value;
    
    let filtered = allBooks.filter(b => 
        (b.title || '').toLowerCase().includes(searchTerm) || 
        (b.author || '').toLowerCase().includes(searchTerm)
    );
    
    // Multi-parameter sorting utilizing native .localeCompare() methods
    if (sortValue === 'titleAsc') filtered.sort((a,b) => (a.title || '').localeCompare(b.title || ''));
    if (sortValue === 'titleDesc') filtered.sort((a,b) => (b.title || '').localeCompare(a.title || ''));
    if (sortValue === 'authorAsc') filtered.sort((a,b) => (a.author || '').localeCompare(b.author || ''));
    if (sortValue === 'authorDesc') filtered.sort((a,b) => (b.author || '').localeCompare(a.author || ''));
    
    renderBooks(filtered);
}

function renderBooks(books) {
    const shelf = document.getElementById('bookshelf');
    if (books.length === 0) {
        shelf.innerHTML = "<div style='grid-column: 1 / -1; text-align: center; padding: 3rem;'>No results found.</div>";
        return;
    }
    
    shelf.innerHTML = books.map(book => {
        const imgHtml = book.cover ? `<img src="${book.cover}" class="cover-img" onload="this.classList.add('loaded'); this.parentElement.classList.add('stop-shimmer')" loading="lazy">` : '';
        
        let summaryHtml = 'No summary available.';
        if (book.summary) {
            try { summaryHtml = decodeURIComponent(book.summary); } catch(err) { summaryHtml = book.summary; }
        }

        // Advanced Prompting for Google AI Overview
        const aiQuery = encodeURIComponent(`Provide a detailed AI summary, key takeaways, and chapter breakdown of "${book.title}" by ${book.author}`);
        const aiLinkUrl = `https://www.google.com/search?q=${aiQuery}`;

        return `
          <div class="book-card">
            <div class="img-container shimmer">
              ${imgHtml}
              <div class="summary-overlay">
                <div class="summary-content"><div class="summary-text">${summaryHtml}</div></div>
                <a href="${aiLinkUrl}" target="_blank" class="ai-link">
                  <span class="ai-tooltip">AI Summary: Read More</span>
                  <svg class="ai-icon" viewBox="0 0 24 24"><path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/></svg>
                </a>
              </div>
            </div>
            <div class="card-body">
              <h6 class="book-title">${book.title}</h6>
              <p class="book-author">by ${book.author}</p>
              <a href="${book.amazonLink}" target="_blank" class="btn-amazon">View on Amazon</a>
            </div>
          </div>`;
    }).join('');
}