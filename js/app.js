let allBooks = []; // Global state

// Your Cloudflare proxy URL
const API_URL = "/api/books"; 

document.addEventListener("DOMContentLoaded", async () => {
    try {
        // 1. Fetch data from your Google Sheet via Cloudflare
        const response = await fetch(API_URL);
        allBooks = await response.json();
        
        // 2. Build the visual book cards
        renderBooks(allBooks);
        console.log("Books successfully loaded!");
    } catch (error) {
        console.error("Error loading books:", error);
    }
});

// Smart Event Delegation 
document.addEventListener("click", (e) => {
    // Ghost Click Protection: Ignore clicks on links or buttons inside the card [cite: 14, 62]
    if (e.target.closest('.ai-link') || e.target.closest('.btn-amazon')) {
        return; 
    }

    const clickedCard = e.target.closest(".book-card");
    
    // Close all other cards to ensure only one is open at a time [cite: 13, 61]
    document.querySelectorAll(".book-card.is-active").forEach(card => {
        if (card !== clickedCard) card.classList.remove("is-active");
    });

    // Flip the clicked card
    if (clickedCard) {
        clickedCard.classList.toggle("is-active");
    }
});

// Function to handle image fade-in after load [cite: 66, 82]
function handleImageLoad(imgElement) {
    imgElement.classList.add('loaded');
    imgElement.parentElement.classList.remove('shimmer');
}

// The blueprint for building the beautiful book cards
function renderBooks(books) {
    const grid = document.getElementById("bookshelf-grid");
    grid.innerHTML = ""; // Clear the grid before adding new books

    books.forEach(book => {
        // Create the card container
        const card = document.createElement("div");
        card.className = "book-card";

        // Inject the HTML for the card (matching the new CSS)
        card.innerHTML = `
            <div class="image-container shimmer">
                <img src="${book.cover}" alt="${book.title}" class="book-cover" loading="lazy" onload="handleImageLoad(this)">
            </div>
            <div class="book-info">
                <h3>${book.title}</h3>
                <p>by ${book.author}</p>
                <a href="${book.amazonLink}" class="btn-amazon" target="_blank">View on Amazon</a>
            </div>
        `;
        
        // Add the finished card to the screen
        grid.appendChild(card);
    });
}
