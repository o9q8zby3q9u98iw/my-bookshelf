class SiteNav extends HTMLElement {
    connectedCallback() {
        const activePage = this.getAttribute('active-page');
        
        this.innerHTML = `
            <nav class="top-nav">
                <div class="nav-links">
                    <a href="index.html" class="${activePage === 'home' ? 'active' : ''}">Home</a>
                    <a href="bookshelf.html" class="${activePage === 'bookshelf' ? 'active' : ''}">Bookshelf</a>
                    <a href="https://www.linkedin.com/in/cmhershey" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                </div>
            </nav>
        `;
    }
}
customElements.define('site-nav', SiteNav);
