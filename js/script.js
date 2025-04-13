document.addEventListener('DOMContentLoaded', function() {
    // Initialize accordion functionality for categories
    initCategoryAccordion();
    
    // Initialize search functionality
    initSearch();
});

// Function to toggle resource links visibility
function toggleResourceLinks(resourceId) {
    const resourceLinks = document.getElementById(resourceId);
    if (resourceLinks) {
        const isCurrentlyHidden = resourceLinks.style.display === 'none' || resourceLinks.style.display === '';
        
        // First close all other open resource links
        const allResourceLinks = document.querySelectorAll('.resource-links');
        allResourceLinks.forEach(link => {
            if (link.id !== resourceId && link.style.display !== 'none') {
                link.style.display = 'none';
                link.style.maxHeight = '0';
                link.style.opacity = '0';
            }
        });
        
        // Now toggle the clicked resource link
        if (isCurrentlyHidden) {
            resourceLinks.style.display = 'block';
            resourceLinks.style.maxHeight = 'none'; // Allow full height
            resourceLinks.style.opacity = '1';
            
            // Scroll to make the opened content visible
            setTimeout(() => {
                resourceLinks.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        } else {
            resourceLinks.style.display = 'none';
            resourceLinks.style.maxHeight = '0';
            resourceLinks.style.opacity = '0';
        }
    }
}

// Function to initialize accordion functionality for categories
function initCategoryAccordion() {
    const categoryHeaders = document.querySelectorAll('.category-header');
    
    categoryHeaders.forEach(header => {
        header.addEventListener('click', function() {
            // Toggle the 'open' class on the parent category element
            const category = this.parentElement;
            category.classList.toggle('open');
            
            // Toggle the display of the category content
            const content = this.nextElementSibling;
            
            // Update the toggle icon
            const toggleIcon = this.querySelector('.toggle-icon');
            if (category.classList.contains('open')) {
                toggleIcon.textContent = '×';
            } else {
                toggleIcon.textContent = '+';
            }
            
            // Add smooth animation
            if (category.classList.contains('open')) {
                // Set max-height properly based on content height
                content.style.maxHeight = content.scrollHeight + 'px';
            } else {
                content.style.maxHeight = '0';
            }
        });
    });
    
    // Check if URL contains a hash (anchor link)
    if (window.location.hash) {
        const targetId = window.location.hash.substring(1); // Remove the # character
        const targetCategory = document.getElementById(targetId);
        
        if (targetCategory) {
            // Scroll to the target category
            setTimeout(() => {
                targetCategory.scrollIntoView({ behavior: 'smooth' });
                
                // Open the target category
                const header = targetCategory.querySelector('.category-header');
                if (header) {
                    header.click();
                }
            }, 300);
        }
    }
}

// Function to initialize search functionality
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    
    if (!searchInput || !searchButton) return;
    
    // Search when the search button is clicked
    searchButton.addEventListener('click', performSearch);
    
    // Also search when Enter key is pressed in the search input
    searchInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            performSearch();
        }
    });
}

// Function to perform search in resources
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (!searchTerm) return;
    
    const resourceItems = document.querySelectorAll('.resource-item');
    const categories = document.querySelectorAll('.category');
    
    // Reset all categories and resources
    categories.forEach(category => {
        category.classList.remove('open');
        const content = category.querySelector('.category-content');
        content.style.maxHeight = '0';
        const toggleIcon = category.querySelector('.toggle-icon');
        toggleIcon.textContent = '+';
    });
    
    resourceItems.forEach(item => {
        item.style.display = 'block';
        item.classList.remove('highlight');
    });
    
    let hasResults = false;
    
    // Filter resources based on search term
    resourceItems.forEach(item => {
        const resourceText = item.textContent.toLowerCase();
        
        if (resourceText.includes(searchTerm)) {
            // This resource matches the search term
            hasResults = true;
            
            // Highlight the resource item
            item.classList.add('highlight');
            
            // Open the parent category
            const parentCategory = item.closest('.category');
            if (parentCategory) {
                parentCategory.classList.add('open');
                const content = parentCategory.querySelector('.category-content');
                content.style.maxHeight = content.scrollHeight + 'px';
                const toggleIcon = parentCategory.querySelector('.toggle-icon');
                toggleIcon.textContent = '×';
                
                // Scroll to the first matching result
                if (!hasResults) {
                    setTimeout(() => {
                        item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                }
            }
        } else {
            // Hide non-matching resources when there's a search term
            item.style.display = 'none';
        }
    });
    
    // Add CSS for highlighted items
    const style = document.createElement('style');
    style.textContent = `
        .resource-item.highlight {
            background-color: rgba(32, 178, 170, 0.1);
            border-radius: 4px;
            padding: 8px;
            border-left: 3px solid var(--accent-primary);
        }
    `;
    document.head.appendChild(style);
    
    // Show a message if no results were found
    if (!hasResults && searchTerm) {
        alert('Arama sonucu bulunamadı: "' + searchTerm + '"');
    }
}

// Function to animate elements when they come into view
function animateOnScroll() {
    const elements = document.querySelectorAll('.category, .hero-content, .quick-link-btn');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    elements.forEach(element => {
        observer.observe(element);
    });
}

// Call animate on scroll after the page loads
window.addEventListener('load', animateOnScroll);

// Add CSS animations
const animationStyles = document.createElement('style');
animationStyles.textContent = `
    .category, .hero-content, .quick-link-btn {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.5s ease-out, transform 0.5s ease-out;
    }
    
    .animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .category {
        animation-delay: calc(var(--animation-order) * 0.1s);
    }
`;
document.head.appendChild(animationStyles);
