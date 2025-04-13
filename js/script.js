document.addEventListener('DOMContentLoaded', function() {
    // Firebase referansını al (library.html'de zaten başlatıldı)
    let db;
    
    try {
        // Global firebase nesnesinden database referansını al
        db = firebase.database();
        console.log("Firebase database referansı başarıyla alındı.");
        
        // Firebase'den verileri yükle
        loadCategoriesFromFirebase();
    } catch (error) {
        console.error("Firebase database referansı alınamadı:", error);
        // Firebase başlatılamazsa statik içeriği kullan
        initCategoryAccordion();
        initSearch();
    }
    
    // Firebase'den kategorileri ve kaynakları yükle
    function loadCategoriesFromFirebase() {
        const container = document.querySelector(".categories-container");
        if (!container) {
            console.error("categories-container bulunamadı!");
            return;
        }
        
        console.log("Firebase'den kategoriler yükleniyor...");
        
        // Kategorileri çek
        db.ref("categories").once("value").then(snapshot => {
            console.log("Firebase kategori verisi döndü:", snapshot.val());
            const categories = snapshot.val();
            
            if (!categories) {
                console.log("Firebase'de kategori bulunamadı, statik içerik kullanılıyor.");
                container.innerHTML = "<p>Henüz kategori eklenmemiş.</p>";
                initCategoryAccordion();
                initSearch();
                return;
            }
            
            // HTML içeriğini temizle
            container.innerHTML = "";
            
            // Her kategori için HTML oluştur
            Object.entries(categories).forEach(([catId, catData]) => {
                const categoryDiv = document.createElement("div");
                categoryDiv.className = "category";
                categoryDiv.id = catId;
                categoryDiv.innerHTML = `
                    <div class="category-header">
                        <h2>${catData.title}</h2>
                        <span class="toggle-icon">+</span>
                    </div>
                    <div class="category-content">
                        <ul class="resource-list" id="list-${catId}">
                            <li>Yükleniyor...</li>
                        </ul>
                    </div>
                `;
                container.appendChild(categoryDiv);
                
                // Her kategori için kaynakları çek
                db.ref("resources").orderByChild("categoryId").equalTo(catId).once("value").then(resSnap => {
                    const resList = categoryDiv.querySelector(`#list-${catId}`);
                    resList.innerHTML = "";
                    
                    const resources = resSnap.val();
                    if (!resources) {
                        resList.innerHTML = "<li class='resource-item'>Bu kategoride henüz kaynak bulunmamaktadır.</li>";
                        return;
                    }
                    
                    // Kaynakları ekle
                    Object.entries(resources).forEach(([resId, res]) => {
                        const resItem = document.createElement("li");
                        resItem.className = "resource-item";
                        let citation = '';
                        
                        if (res.authors) citation += res.authors + ' ';
                        if (res.year) citation += `(${res.year}) `;
                        if (res.title) citation += res.title;
                        
                        resItem.innerHTML = `
                            <a href="#" class="resource-title" onclick="toggleResourceLinks('${resId}'); return false;">${citation}</a>
                            <div id="${resId}" class="resource-links" style="display: none;">
                                <div class="resource-citation">
                                    ${res.journal ? `<em>${res.journal}</em>` : ''}
                                </div>
                                ${res.url ? `<div class="url-list">
                                    <a href="${res.url}" target="_blank" class="resource-link">Kaynak Bağlantısı</a>
                                </div>` : ''}
                            </div>
                        `;
                        resList.appendChild(resItem);
                    });
                }).catch(error => {
                    console.error(`Kategori ${catId} için kaynaklar yüklenirken hata:`, error);
                    resList.innerHTML = "<li class='resource-item'>Kaynaklar yüklenirken hata oluştu.</li>";
                });
            });
            
            // Kategori akordiyon ve arama fonksiyonlarını başlat
            initCategoryAccordion();
            initSearch();
        }).catch(error => {
            console.error("Kategoriler yüklenirken hata:", error);
            container.innerHTML = "<p>Kategoriler yüklenirken hata oluştu.</p>";
            initCategoryAccordion();
            initSearch();
        });
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
        // Remove previous event listeners if any
        const newHeader = header.cloneNode(true);
        header.parentNode.replaceChild(newHeader, header);
        
        newHeader.addEventListener('click', function() {
            // Toggle active class on the category
            this.parentElement.classList.toggle('active');
            
            // Toggle the plus/minus icon
            const icon = this.querySelector('.toggle-icon');
            if (icon) {
                icon.textContent = this.parentElement.classList.contains('active') ? '-' : '+';
            }
            
            // Toggle the content visibility
            const content = this.nextElementSibling;
            if (content) {
                if (content.style.maxHeight) {
                    content.style.maxHeight = null;
                } else {
                    content.style.maxHeight = content.scrollHeight + "px";
                }
            }
        });
    });
}

// Function to initialize search functionality
function initSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        filterResources(searchTerm);
    });
    
    // Clear search when X is clicked
    const clearSearchBtn = document.getElementById('clear-search');
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', function() {
            searchInput.value = '';
            filterResources('');
        });
    }
}

// Function to filter resources based on search term
function filterResources(searchTerm) {
    const resourceItems = document.querySelectorAll('.resource-item');
    const categories = document.querySelectorAll('.category');
    let totalVisible = 0;
    
    // Restore all categories first
    categories.forEach(category => {
        category.style.display = '';
    });
    
    if (!searchTerm) {
        // If search is empty, show all resources
        resourceItems.forEach(item => {
            item.style.display = '';
        });
        return;
    }
    
    // For each resource item
    resourceItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        const isVisible = text.includes(searchTerm);
        
        item.style.display = isVisible ? '' : 'none';
        
        if (isVisible) {
            totalVisible++;
            // Make sure its category is visible
            let category = item.closest('.category');
            if (category) {
                category.style.display = '';
                // Expand the category if it contains matches
                if (!category.classList.contains('active')) {
                    category.classList.add('active');
                    const icon = category.querySelector('.toggle-icon');
                    if (icon) icon.textContent = '-';
                    
                    const content = category.querySelector('.category-content');
                    if (content) {
                        content.style.maxHeight = content.scrollHeight + "px";
                    }
                }
            }
        }
    });
    
    // Hide categories with no visible resources
    categories.forEach(category => {
        const visibleResources = category.querySelectorAll('.resource-item[style="display: none;"]');
        if (visibleResources.length === 0 && searchTerm) {
            category.style.display = 'none';
        }
    });
    
    // Show no results message if needed
    const noResultsMsg = document.getElementById('no-results-message');
    if (noResultsMsg) {
        noResultsMsg.style.display = totalVisible === 0 ? 'block' : 'none';
    }
}
