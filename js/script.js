document.addEventListener('DOMContentLoaded', function() {
    // Firebase yapılandırması
    const firebaseConfig = {
        apiKey: "AIzaSyAWCI8GDMCDeknLgKJidhBp2f86OHgZsYU",
        authDomain: "sinirbilimportali-kaynaklar.firebaseapp.com",
        databaseURL: "https://sinirbilimportali-kaynaklar-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "sinirbilimportali-kaynaklar",
        storageBucket: "sinirbilimportali-kaynaklar.firebasestorage.app",
        messagingSenderId: "750308737969",
        appId: "1:750308737969:web:788597d7c7fba399527390"
    };

    // Firebase başlatma
    let firebaseInitialized = false;
    let db;

    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.database();
        firebaseInitialized = true;
        console.log("Firebase başarıyla başlatıldı.");
        
        // Firebase'den verileri yükle
        loadCategoriesFromFirebase();
    } catch (error) {
        console.error("Firebase başlatılamadı:", error);
        // Firebase başlatılamazsa statik içeriği kullan
        initCategoryAccordion();
        initSearch();
    }
    
    // Firebase'den kategorileri ve kaynakları yükle
    function loadCategoriesFromFirebase() {
        if (!firebaseInitialized) {
            initCategoryAccordion();
            initSearch();
            return;
        }
        
        // Kategorileri dinle
        db.ref("categories").on("value", (snapshot) => {
            const categoriesData = snapshot.val();
            if (categoriesData) {
                console.log("Firebase'den kategoriler yükleniyor...");
                
                // Kaynakları da yükle
                db.ref("resources").once("value", (resourcesSnapshot) => {
                    const resourcesData = resourcesSnapshot.val();
                    
                    // HTML oluştur
                    generateCategoryHTML(categoriesData, resourcesData);
                });
            } else {
                console.log("Firebase'de kategori bulunamadı, statik içerik kullanılıyor.");
                initCategoryAccordion();
                initSearch();
            }
        });
    }
    
    // Firebase verilerinden HTML oluştur
    function generateCategoryHTML(categoriesData, resourcesData) {
        // Kategoriler container
        const categoriesContainer = document.querySelector(".categories-container");
        if (!categoriesContainer) return;
        
        let html = '';
        
        // Kategorileri döngüye al
        Object.entries(categoriesData).forEach(([categoryId, category]) => {
            html += `<!-- ${category.title} Category -->
            <div class="category" id="${categoryId}">
                <div class="category-header">
                    <h2>${category.title}</h2>
                    <span class="toggle-icon">+</span>
                </div>
                <div class="category-content">
                    <ul class="resource-list">`;
            
            // Bu kategorideki kaynakları filtrele
            const categoryResources = resourcesData ? 
                Object.entries(resourcesData)
                    .filter(([_, resource]) => resource.categoryId === categoryId)
                    .map(([id, resource]) => ({id, ...resource})) 
                : [];
            
            if (categoryResources.length === 0) {
                html += `<li class="resource-item">Bu kategoride henüz kaynak bulunmamaktadır.</li>`;
            } else {
                // Kaynakları ekle
                categoryResources.forEach((resource, index) => {
                    const resourceId = `${categoryId}-resource-${index}`;
                    
                    html += `<li class="resource-item">
                        <a href="#" class="resource-title" onclick="toggleResourceLinks('${resourceId}'); return false;">
                            ${resource.authors ? resource.authors : ''} ${resource.year ? `(${resource.year})` : ''} ${resource.title}
                        </a>
                        <div id="${resourceId}" class="resource-links" style="display: none;">
                            <div class="resource-citation">${formatCitation(resource)}</div>`;
                    
                    if (resource.urls && resource.urls.length > 0) {
                        html += `<ul class="url-list">`;
                        resource.urls.forEach((url, urlIndex) => {
                            html += `<li><a href="${url}" target="_blank">Kaynak Bağlantısı ${urlIndex + 1}</a></li>`;
                        });
                        html += `</ul>`;
                    } else if (resource.url) {
                        html += `<ul class="url-list">
                            <li><a href="${resource.url}" target="_blank">Kaynak Bağlantısı</a></li>
                        </ul>`;
                    }
                    
                    html += `</div>
                    </li>`;
                });
            }
            
            html += `</ul>
                </div>
            </div>`;
        });
        
        // HTML'i sayfaya ekle
        categoriesContainer.innerHTML = html;
        
        // Accordion fonksiyonunu başlat
        initCategoryAccordion();
        
        // Arama fonksiyonunu başlat
        initSearch();
    }
    
    // Kaynak formatını oluştur
    function formatCitation(resource) {
        let citation = '';
        
        if (resource.authors) {
            citation += resource.authors;
        }
        
        if (resource.year) {
            citation += ` (${resource.year})`;
        }
        
        if (resource.title) {
            citation += ` <em>${resource.title}</em>.`;
        }
        
        if (resource.journal) {
            citation += ` <strong>${resource.journal}`;
            
            if (resource.volume) {
                citation += `, ${resource.volume}`;
            }
            
            citation += '</strong>';
        }
        
        if (resource.pages) {
            citation += `, ${resource.pages}`;
        }
        
        return citation;
    }
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
