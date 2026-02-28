let allBooks = []; // Global state 

// This URL will be replaced with your Cloudflare API link in the next phase!
const API_URL = "YOUR_CLOUDFLARE_WORKER_URL_GOES_HERE"; 

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Fetch data
    // const response = await fetch(API_URL);
    // allBooks = await response.json();
    // renderBooks(allBooks);
    console.log("App loaded. Ready to connect to Cloudflare!");
});

// Smart Event Delegation [cite: 12, 60]
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

// Function to handle image fade-in after load
function handleImageLoad(imgElement) {
    imgElement.classList.add('loaded');
    imgElement.parentElement.classList.remove('shimmer');
}
