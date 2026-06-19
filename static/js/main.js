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
    
    // Theme Switch
    const themeCheckbox = document.getElementById('theme-checkbox');
    
    // Export Dropdown Elements
    const exportBtn = document.getElementById('export-btn');
    const exportDropdownContainer = document.getElementById('export-dropdown-container');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const exportXmlBtn = document.getElementById('export-xml-btn');
    
    // Modal Elements
    const tweetModal = document.getElementById('tweet-modal');
    const refUpdateTitle = document.getElementById('ref-update-title');
    const tweetTextarea = document.getElementById('tweet-textarea');
    const charCounter = document.getElementById('char-counter');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelTweetBtn = document.getElementById('cancel-tweet-btn');
    const sendTweetBtn = document.getElementById('send-tweet-btn');

    // Theme Toggle State Persistence
    const currentTheme = localStorage.getItem('theme') || 'dark';
    if (currentTheme === 'light') {
        document.body.classList.add('light-theme');
        themeCheckbox.checked = true;
    }

    themeCheckbox.addEventListener('change', () => {
        if (themeCheckbox.checked) {
            document.body.classList.add('light-theme');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.remove('light-theme');
            localStorage.setItem('theme', 'dark');
        }
    });

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

    // Get current filtered list of releases
    function getFilteredReleases() {
        const query = searchInput.value.toLowerCase().trim();
        return allReleases.filter(release => {
            return (
                release.title.toLowerCase().includes(query) ||
                release.content.toLowerCase().includes(query) ||
                release.date.toLowerCase().includes(query)
            );
        });
    }

    // Render releases based on search query
    function renderReleases() {
        const filtered = getFilteredReleases();

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
                        <div class="card-actions">
                            <button class="btn-card-action btn-copy-action" data-id="${release.id}" title="Copy release notes to clipboard">
                                <i class="fa-regular fa-copy"></i>
                                <span>Copy</span>
                            </button>
                            <button class="btn-card-action btn-tweet-action" data-id="${release.id}" title="Tweet about this update">
                                <i class="fa-brands fa-x-twitter"></i>
                                <span>Tweet</span>
                            </button>
                        </div>
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

        // Wire up Copy buttons
        document.querySelectorAll('.btn-copy-action').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const releaseId = e.currentTarget.getAttribute('data-id');
                const release = allReleases.find(r => r.id === releaseId);
                if (release) {
                    // Extract text content from the release content (removes HTML tags)
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = release.content;
                    const plainContent = tempDiv.textContent || tempDiv.innerText || "";
                    
                    const textToCopy = `BigQuery Release Update: ${release.title}\nDate: ${release.date}\n\n${plainContent}\n\nRead more: ${release.link}`;
                    
                    try {
                        await navigator.clipboard.writeText(textToCopy);
                        
                        // Visual Feedback
                        const originalHTML = e.currentTarget.innerHTML;
                        e.currentTarget.innerHTML = `<i class="fa-solid fa-check" style="color: var(--success-color)"></i> <span>Copied!</span>`;
                        e.currentTarget.disabled = true;
                        
                        setTimeout(() => {
                            e.currentTarget.innerHTML = originalHTML;
                            e.currentTarget.disabled = false;
                        }, 2000);
                    } catch (err) {
                        console.error('Failed to copy text: ', err);
                    }
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

    // Export Dropdown Click Trigger
    exportBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        exportDropdownContainer.classList.toggle('active');
    });

    // Click outside to close dropdown
    document.addEventListener('click', (e) => {
        if (exportDropdownContainer && !exportDropdownContainer.contains(e.target)) {
            exportDropdownContainer.classList.remove('active');
        }
    });

    // CSV Helper Escaper
    function escapeCSV(text) {
        if (!text) return '';
        // Extract text content from the release HTML content for clean CSV fields
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = text;
        let cleanText = tempDiv.textContent || tempDiv.innerText || "";
        cleanText = cleanText.replace(/"/g, '""'); // Escape inner double quotes
        if (cleanText.includes(',') || cleanText.includes('\n') || cleanText.includes('"')) {
            return `"${cleanText}"`;
        }
        return cleanText;
    }

    // Export to CSV Function
    exportCsvBtn.addEventListener('click', () => {
        const listToExport = getFilteredReleases();
        if (listToExport.length === 0) return;

        let csvContent = "\uFEFF"; // Byte Order Mark for Excel UTF-8 support
        csvContent += "ID,Title,Date,Link,Content\n";
        
        listToExport.forEach(r => {
            csvContent += `${escapeCSV(r.id)},${escapeCSV(r.title)},${escapeCSV(r.date)},${escapeCSV(r.link)},${escapeCSV(r.content)}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "bigquery_release_notes.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        exportDropdownContainer.classList.remove('active');
    });

    // XML Helper Escaper
    function escapeXML(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    // Export to XML Function
    exportXmlBtn.addEventListener('click', () => {
        const listToExport = getFilteredReleases();
        if (listToExport.length === 0) return;

        let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<releases>\n';
        listToExport.forEach(r => {
            xmlContent += '  <release>\n';
            xmlContent += `    <id>${escapeXML(r.id)}</id>\n`;
            xmlContent += `    <title>${escapeXML(r.title)}</title>\n`;
            xmlContent += `    <date>${escapeXML(r.date)}</date>\n`;
            xmlContent += `    <link>${escapeXML(r.link)}</link>\n`;
            xmlContent += `    <content><![CDATA[${r.content}]]></content>\n`;
            xmlContent += '  </release>\n';
        });
        xmlContent += '</releases>';

        const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "bigquery_release_notes.xml");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        exportDropdownContainer.classList.remove('active');
    });

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

    // Initialize Page
    fetchReleases();
});
