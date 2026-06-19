document.addEventListener('DOMContentLoaded', () => {
    // State management
    let allReleases = [];
    let activeRelease = null;

    // DOM Elements
    const refreshBtn = document.getElementById('refresh-btn');
    const spinnerIcon = document.getElementById('spinner-icon');
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const releasesCount = document.getElementById('releases-count');
    const releasesContainer = document.getElementById('releases-container');
    
    // Modal Elements
    const tweetModal = document.getElementById('tweet-modal');
    const refUpdateTitle = document.getElementById('ref-update-title');
    const tweetTextarea = document.getElementById('tweet-textarea');
    const charCounter = document.getElementById('char-counter');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelTweetBtn = document.getElementById('cancel-tweet-btn');
    const sendTweetBtn = document.getElementById('send-tweet-btn');

    // Categorization Helper
    function getReleaseCategory(title, content) {
        const text = (title + ' ' + content).toLowerCase();
        if (text.includes('deprecat') || text.includes('end support') || text.includes('ends support') || text.includes('removal') || text.includes('retire')) {
            return { label: 'Deprecation', class: 'badge-deprecation' };
        }
        if (text.includes('introduce') || text.includes('new feature') || text.includes('support for') || text.includes('now available') || text.includes('added') || text.includes('preview')) {
            return { label: 'Feature', class: 'badge-feature' };
        }
        return { label: 'Change', class: 'badge-change' };
    }

    // Shimmer effect HTML
    function getShimmerHTML() {
        return `
            <div class="loading-state">
                <div class="shimmer-card"></div>
                <div class="shimmer-card"></div>
                <div class="shimmer-card"></div>
            </div>
        `;
    }

    // Fetch Releases
    async function fetchReleases() {
        // Start Loading State
        refreshBtn.disabled = true;
        spinnerIcon.classList.add('fa-spin-custom');
        releasesContainer.innerHTML = getShimmerHTML();

        try {
            const response = await fetch('/api/releases');
            const data = await response.json();
            
            if (data.success) {
                allReleases = data.releases;
                renderReleases();
            } else {
                renderError(data.error || 'Failed to fetch release notes.');
            }
        } catch (error) {
            renderError('Could not connect to the server. Please ensure the backend is running.');
            console.error('Error fetching releases:', error);
        } finally {
            // End Loading State
            refreshBtn.disabled = false;
            spinnerIcon.classList.remove('fa-spin-custom');
        }
    }

    // Render releases based on search query
    function renderReleases() {
        const query = searchInput.value.toLowerCase().trim();
        
        const filtered = allReleases.filter(release => {
            return (
                release.title.toLowerCase().includes(query) ||
                release.content.toLowerCase().includes(query) ||
                release.date.toLowerCase().includes(query)
            );
        });

        // Update stats
        releasesCount.textContent = `Showing ${filtered.length} update${filtered.length !== 1 ? 's' : ''}`;

        if (filtered.length === 0) {
            releasesContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fa-regular fa-folder-open"></i>
                    <h3>No matching updates found</h3>
                    <p>Try searching for keywords like "analytics", "pricing", or "SQL".</p>
                </div>
            `;
            return;
        }

        releasesContainer.innerHTML = filtered.map(release => {
            const category = getReleaseCategory(release.title, release.content);
            
            return `
                <article class="card" id="release-${release.id || Math.random()}">
                    <div class="card-header">
                        <div class="card-meta">
                            <span class="card-date">
                                <i class="fa-regular fa-calendar"></i>
                                ${release.date}
                            </span>
                            <span class="badge ${category.class}">${category.label}</span>
                        </div>
                        <button class="btn-tweet-action" data-id="${release.id}" title="Tweet about this update">
                            <i class="fa-brands fa-x-twitter"></i>
                            <span>Tweet</span>
                        </button>
                    </div>
                    <h2 class="card-title">${release.title}</h2>
                    <div class="card-content">
                        ${release.content}
                    </div>
                </article>
            `;
        }).join('');

        // Wire up Tweet buttons
        document.querySelectorAll('.btn-tweet-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const releaseId = e.currentTarget.getAttribute('data-id');
                const release = allReleases.find(r => r.id === releaseId);
                if (release) {
                    openTweetModal(release);
                }
            });
        });
    }

    // Show Error State
    function renderError(message) {
        releasesContainer.innerHTML = `
            <div class="error-state">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <h3>An error occurred</h3>
                <p>${message}</p>
                <button id="retry-btn" class="btn btn-secondary" style="margin-top: 1rem;">
                    <i class="fa-solid fa-arrows-rotate"></i> Retry
                </button>
            </div>
        `;
        
        const retryBtn = document.getElementById('retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', fetchReleases);
        }
    }

    // Twitter Modal Functions
    function openTweetModal(release) {
        activeRelease = release;
        refUpdateTitle.textContent = release.title;
        
        // Construct pre-filled tweet text
        const handle = "BigQuery Update:";
        const hashtag = " #GCP #BigQuery";
        const link = release.link ? ` ${release.link}` : "";
        
        // Truncate title if it is too long to fit with the link and hashtags
        const maxTitleLen = 280 - handle.length - hashtag.length - link.length - 4; // safety offset
        let cleanTitle = release.title;
        if (cleanTitle.length > maxTitleLen) {
            cleanTitle = cleanTitle.substring(0, maxTitleLen - 3) + "...";
        }
        
        tweetTextarea.value = `${handle} "${cleanTitle}"${link}${hashtag}`;
        
        // Show modal
        tweetModal.classList.add('active');
        tweetModal.setAttribute('aria-hidden', 'false');
        updateCharCount();
        
        // Focus textarea
        setTimeout(() => tweetTextarea.focus(), 100);
    }

    function closeTweetModal() {
        tweetModal.classList.remove('active');
        tweetModal.setAttribute('aria-hidden', 'true');
        activeRelease = null;
    }

    function updateCharCount() {
        const len = tweetTextarea.value.length;
        const remaining = 280 - len;
        charCounter.textContent = remaining;

        // Visual warnings based on character usage
        charCounter.className = 'char-counter';
        if (remaining <= 20) {
            charCounter.classList.add('danger');
        } else if (remaining <= 50) {
            charCounter.classList.add('warning');
        }

        // Enable/Disable Tweet Button
        if (len === 0 || remaining < 0) {
            sendTweetBtn.disabled = true;
            sendTweetBtn.style.opacity = '0.5';
            sendTweetBtn.style.cursor = 'not-allowed';
        } else {
            sendTweetBtn.disabled = false;
            sendTweetBtn.style.opacity = '1';
            sendTweetBtn.style.cursor = 'pointer';
        }
    }

    // Event Listeners
    refreshBtn.addEventListener('click', fetchReleases);

    searchInput.addEventListener('input', () => {
        if (searchInput.value.trim().length > 0) {
            clearSearchBtn.style.display = 'block';
        } else {
            clearSearchBtn.style.display = 'none';
        }
        renderReleases();
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchBtn.style.display = 'none';
        searchInput.focus();
        renderReleases();
    });

    // Modal Events
    closeModalBtn.addEventListener('click', closeTweetModal);
    cancelTweetBtn.addEventListener('click', closeTweetModal);
    tweetTextarea.addEventListener('input', updateCharCount);

    // Close on click outside modal card
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) {
            closeTweetModal();
        }
    });

    // Escape key closes modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && tweetModal.classList.contains('active')) {
            closeTweetModal();
        }
    });

    // Action to Twitter Web Intent
    sendTweetBtn.addEventListener('click', () => {
        const text = tweetTextarea.value.trim();
        if (text.length > 0 && text.length <= 280) {
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
            window.open(twitterUrl, '_blank', 'noopener,noreferrer');
            closeTweetModal();
        }
    });

    // Initialize Page
    fetchReleases();
});
