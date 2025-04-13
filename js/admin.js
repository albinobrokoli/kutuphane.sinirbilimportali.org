/**
 * kutuphane.sinirbilimportali.org Admin Panel
 * JavaScript functionality for the admin interface
 */

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
} catch (error) {
    console.error("Firebase başlatılamadı:", error);
}

// Data structure for categories and resources
let categories = [];
let resources = [];
let bulkResources = []; // Array to hold parsed bulk resources

// Admin credentials (Demo purposes only - in production this should be server-side)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'sinirbilim2025';

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * Initialize the admin application
 */
function initializeApp() {
    // Check if user is logged in
    checkLoginStatus();
    
    // Initialize UI elements
    initializeUI();
    
    // Test Firebase connection and debug data
    setTimeout(() => {
        debugFirebaseData();
    }, 1000);
    
    // Load data from localStorage or Firebase
    loadData();
    
    // Add a Debug button to admin interface
    const adminHeader = document.querySelector('.admin-header');
    if (adminHeader) {
        const debugBtn = document.createElement('button');
        debugBtn.textContent = 'Firebase Veritabanını Kontrol Et';
        debugBtn.className = 'btn debug-btn';
        debugBtn.style.marginRight = '10px';
        debugBtn.addEventListener('click', debugFirebaseData);
        adminHeader.appendChild(debugBtn);
    }
}

/**
 * Initialize UI elements and event listeners
 */
function initializeUI() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Tab navigation
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // Category management
    const addCategoryBtn = document.getElementById('add-category-btn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', () => openCategoryModal());
    }
    
    const categoryForm = document.getElementById('category-form');
    if (categoryForm) {
        categoryForm.addEventListener('submit', handleCategorySave);
    }
    
    const cancelCategoryBtn = document.getElementById('cancel-category');
    if (cancelCategoryBtn) {
        cancelCategoryBtn.addEventListener('click', closeCategoryModal);
    }
    
    // Resource management
    const addResourceBtn = document.getElementById('add-resource-btn');
    if (addResourceBtn) {
        addResourceBtn.addEventListener('click', () => openResourceModal());
    }
    
    const resourceForm = document.getElementById('resource-form');
    if (resourceForm) {
        resourceForm.addEventListener('submit', handleResourceSave);
    }
    
    const cancelResourceBtn = document.getElementById('cancel-resource');
    if (cancelResourceBtn) {
        cancelResourceBtn.addEventListener('click', closeResourceModal);
    }
    
    // Modal close buttons
    const closeModalButtons = document.querySelectorAll('.close-modal, .close-resource-modal, .close-delete-modal');
    closeModalButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal);
        });
    });
    
    // Bulk resource parsing
    const parseBulkBtn = document.getElementById('parse-bulk-btn');
    if (parseBulkBtn) {
        parseBulkBtn.addEventListener('click', parseBulkResources);
    }
    
    // Delete confirmation
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDelete);
    }
    
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            closeModal(document.getElementById('delete-modal'));
        });
    }
    
    // Export functionality
    const generateHtmlBtn = document.getElementById('generate-html-btn');
    if (generateHtmlBtn) {
        generateHtmlBtn.addEventListener('click', generateHtml);
    }
    
    const copyHtmlBtn = document.getElementById('copy-html-btn');
    if (copyHtmlBtn) {
        copyHtmlBtn.addEventListener('click', copyGeneratedHtml);
    }
    
    const downloadJsonBtn = document.getElementById('download-json-btn');
    if (downloadJsonBtn) {
        downloadJsonBtn.addEventListener('click', downloadJson);
    }
    
    const uploadJsonBtn = document.getElementById('upload-json-btn');
    if (uploadJsonBtn) {
        uploadJsonBtn.addEventListener('click', uploadJson);
    }
    
    // Add slug generator for category title
    const categoryTitle = document.getElementById('category-title');
    const categorySlug = document.getElementById('category-slug');
    if (categoryTitle && categorySlug) {
        categoryTitle.addEventListener('input', () => {
            // Only auto-generate slug if it's empty or matches previous auto-generation
            if (!categorySlug.dataset.manuallyEdited) {
                categorySlug.value = generateSlug(categoryTitle.value);
            }
        });
        
        categorySlug.addEventListener('input', () => {
            // Mark as manually edited
            categorySlug.dataset.manuallyEdited = 'true';
        });
    }
    
    // Initialize URL add buttons functionality
    initializeUrlButtons();
}

/**
 * Initialize URL add buttons functionality
 */
function initializeUrlButtons() {
    // Add event listener for the "Add URL" button click
    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('add-url-btn')) {
            addNewUrlField(e.target);
        }
        
        if (e.target && e.target.classList.contains('remove-url-btn')) {
            const urlEntry = e.target.closest('.url-entry');
            const urlContainer = document.getElementById('url-container');
            
            if (urlEntry && urlContainer && urlContainer.children.length > 1) {
                urlEntry.remove();
            }
        }
    });
}

/**
 * Add a new URL input field
 */
function addNewUrlField(button) {
    const urlContainer = document.getElementById('url-container');
    if (!urlContainer) return;
    
    // Create new URL entry
    const newUrlEntry = document.createElement('div');
    newUrlEntry.className = 'url-entry';
    newUrlEntry.innerHTML = `
        <div class="url-input-group">
            <input type="url" class="resource-url" placeholder="https://..." required>
            <button type="button" class="btn add-url-btn">+</button>
            <button type="button" class="btn remove-url-btn">-</button>
        </div>
        <small>Kaynağın tam URL adresi, https:// ile başlamalı</small>
    `;
    
    // Append to container
    urlContainer.appendChild(newUrlEntry);
    
    // Add remove button to the first URL entry if it doesn't have one yet
    if (urlContainer.children.length > 1) {
        const firstUrlEntry = urlContainer.children[0];
        const firstInputGroup = firstUrlEntry.querySelector('.url-input-group');
        
        if (firstInputGroup && !firstInputGroup.querySelector('.remove-url-btn')) {
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'btn remove-url-btn';
            removeBtn.textContent = '-';
            firstInputGroup.appendChild(removeBtn);
        }
    }
}

/**
 * Check if user is logged in and show appropriate screen
 */
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    
    if (isLoggedIn) {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
    } else {
        loginSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
    }
}

/**
 * Handle login form submission
 */
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('login-error');
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // Successful login
        localStorage.setItem('adminLoggedIn', 'true');
        checkLoginStatus();
        errorElement.textContent = '';
    } else {
        // Failed login
        errorElement.textContent = 'Hatalı kullanıcı adı veya şifre.';
    }
}

/**
 * Handle logout
 */
function handleLogout() {
    localStorage.removeItem('adminLoggedIn');
    checkLoginStatus();
}

/**
 * Switch between tabs
 */
function switchTab(tabId) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.add('hidden'));
    
    // Deactivate all tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab content and activate button
    document.getElementById(`${tabId}-tab`).classList.remove('hidden');
    document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');
    
    // Update UI for the selected tab
    if (tabId === 'categories') {
        renderCategories();
    } else if (tabId === 'resources') {
        renderResources();
        updateCategoryFilters();
    }
}

/**
 * Load data from localStorage or Firebase
 */
function loadData() {
    if (firebaseInitialized) {
        // Firebase'den verileri yükle
        console.log("Firebase'den veri yükleniyor...");
        
        // Kategorileri yükle
        db.ref("categories").on("value", (snapshot) => {
            const fbCategories = snapshot.val();
            if (fbCategories) {
                categories = Object.entries(fbCategories).map(([key, value]) => {
                    return { ...value, id: key };
                });
                console.log("Firebase'den kategoriler yüklendi:", categories);
                renderCategories();
                updateCategoryFilters();
            } else {
                console.log("Firebase'de hiç kategori bulunamadı");
                // Firebase'de veri yoksa localStorage'dan yükle
                loadFromLocalStorage();
            }
        });
            
        // Kaynakları yükle
        db.ref("resources").on("value", (snapshot) => {
            const fbResources = snapshot.val();
            if (fbResources) {
                resources = Object.entries(fbResources).map(([key, value]) => {
                    return { ...value, id: key };
                });
                console.log("Firebase'den kaynaklar yüklendi:", resources.length + " kaynak var");
                renderResources();
            } else {
                console.log("Firebase'de hiç kaynak bulunamadı");
                // Firebase'de veri yoksa localStorage'dan yükle (kategoriler zaten yüklendi)
                const storedResources = localStorage.getItem('sinirbilimportali_resources');
                if (storedResources) {
                    resources = JSON.parse(storedResources);
                }
            }
        });
    } else {
        // Firebase başlatılamadıysa localStorage'dan yükle
        loadFromLocalStorage();
    }
}

/**
 * Load data from localStorage (fallback)
 */
function loadFromLocalStorage() {
    // Load categories from localStorage
    const storedCategories = localStorage.getItem('sinirbilimportali_categories');
    if (storedCategories) {
        categories = JSON.parse(storedCategories);
        renderCategories();
    }
    
    // Load resources from localStorage
    const storedResources = localStorage.getItem('sinirbilimportali_resources');
    if (storedResources) {
        resources = JSON.parse(storedResources);
        renderResources();
    }
    
    updateCategoryFilters();
}

/**
 * Save categories to localStorage and Firebase
 */
function saveCategories() {
    // Save to localStorage for backward compatibility
    localStorage.setItem('sinirbilimportali_categories', JSON.stringify(categories));
    
    // Save to Firebase if available
    if (firebaseInitialized) {
        // Önceden kaldırma yerine doğrudan güncelleme yapalım
        categories.forEach(category => {
            const { id, ...categoryData } = category;
            db.ref(`categories/${id}`).set(categoryData);
        });
        console.log("Kategoriler Firebase'e kaydedildi");
    }
}

/**
 * Save resources to localStorage and Firebase
 */
function saveResources() {
    // Save to localStorage for backward compatibility
    localStorage.setItem('sinirbilimportali_resources', JSON.stringify(resources));
    
    // Save to Firebase if available
    if (firebaseInitialized) {
        // Önceden kaldırma yerine doğrudan güncelleme yapalım
        resources.forEach(resource => {
            const { id, ...resourceData } = resource;
            db.ref(`resources/${id}`).set(resourceData);
        });
        console.log("Kaynaklar Firebase'e kaydedildi");
    }
}

/**
 * Render categories list
 */
function renderCategories() {
    const categoriesList = document.getElementById('categories-list');
    if (!categoriesList) return;
    
    categoriesList.innerHTML = '';
    
    if (categories.length === 0) {
        categoriesList.innerHTML = '<p class="empty-message">Henüz kategori eklenmemiş.</p>';
        return;
    }
    
    categories.forEach(category => {
        const resourceCount = resources.filter(r => r.categoryId === category.id).length;
        
        const categoryElement = document.createElement('div');
        categoryElement.className = 'category-item';
        categoryElement.innerHTML = `
            <div class="item-info">
                <h3 class="item-title">${category.title}</h3>
                <p class="item-subtitle">ID: ${category.id} | ${resourceCount} kaynak</p>
            </div>
            <div class="item-actions">
                <button class="edit-btn" data-id="${category.id}">Düzenle</button>
                <button class="delete-btn" data-id="${category.id}" data-type="category">Sil</button>
            </div>
        `;
        
        categoriesList.appendChild(categoryElement);
        
        // Add event listeners to buttons
        const editBtn = categoryElement.querySelector('.edit-btn');
        editBtn.addEventListener('click', () => openCategoryModal(category));
        
        const deleteBtn = categoryElement.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => openDeleteModal('category', category));
    });
}

/**
 * Render resources list
 */
function renderResources(filterCategoryId = '') {
    const resourcesList = document.getElementById('resources-list');
    resourcesList.innerHTML = '';

    // Filter resources by category if specified
    let filteredResources = resources;
    if (filterCategoryId) {
        filteredResources = resources.filter(resource => resource.categoryId === filterCategoryId);
    }
    
    // Check if there are any resources
    if (filteredResources.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.classList.add('empty-message');
        emptyMessage.textContent = filterCategoryId 
            ? 'Bu kategoride henüz kaynak bulunmamaktadır.' 
            : 'Henüz kaynak eklenmemiştir.';
        resourcesList.appendChild(emptyMessage);
        return;
    }
    
    // Sort resources by category and then by authors
    filteredResources.sort((a, b) => {
        // First sort by category
        const categoryA = categories.find(c => c.id === a.categoryId)?.title || '';
        const categoryB = categories.find(c => c.id === b.categoryId)?.title || '';
        
        if (categoryA !== categoryB) {
            return categoryA.localeCompare(categoryB);
        }
        
        // Then sort by year (descending)
        if (a.year !== b.year) {
            return b.year - a.year;
        }
        
        // Finally sort by authors
        return a.authors.localeCompare(b.authors);
    });
    
    // Create resources table
    const table = document.createElement('table');
    table.classList.add('data-table');
    
    // Create table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Kategori</th>
            <th>Yazar(lar)</th>
            <th>Yıl</th>
            <th>Başlık</th>
            <th>İşlemler</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement('tbody');
    
    filteredResources.forEach(resource => {
        const tr = document.createElement('tr');
        
        // Find category name
        const category = categories.find(c => c.id === resource.categoryId);
        const categoryName = category ? category.title : 'Kategori Bulunamadı';
        
        tr.innerHTML = `
            <td>${categoryName}</td>
            <td>${resource.authors}</td>
            <td>${resource.year}</td>
            <td>${resource.title}</td>
            <td class="actions">
                <button class="edit-btn" data-id="${resource.id}">Düzenle</button>
                <button class="delete-btn" data-id="${resource.id}">Sil</button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
    
    table.appendChild(tbody);
    resourcesList.appendChild(table);
    
    // Add event listeners to edit and delete buttons
    const editButtons = resourcesList.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', () => {
            const resourceId = button.getAttribute('data-id');
            const resource = resources.find(r => r.id === resourceId);
            
            if (resource) {
                openResourceModal(resource);
            }
        });
    });
    
    const deleteButtons = resourcesList.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const resourceId = button.getAttribute('data-id');
            const resource = resources.find(r => r.id === resourceId);
            
            if (resource) {
                openDeleteModal('resource', resource);
            }
        });
    });
}

/**
 * Update category filters in resource section
 */
function updateCategoryFilters() {
    const categoryFilter = document.getElementById('resource-category-filter');
    const resourceCategory = document.getElementById('resource-category');
    
    if (categoryFilter) {
        // Keep the first option (All Categories)
        categoryFilter.innerHTML = '<option value="">Tüm Kategoriler</option>';
        
        // Add categories
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.title;
            categoryFilter.appendChild(option);
        });
    }
    
    if (resourceCategory) {
        resourceCategory.innerHTML = '';
        
        // Add categories
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.title;
            resourceCategory.appendChild(option);
        });
    }
}

/**
 * Open category modal for add/edit
 */
function openCategoryModal(category = null) {
    const modal = document.getElementById('category-modal');
    const modalTitle = document.getElementById('category-modal-title');
    const categoryForm = document.getElementById('category-form');
    const categoryId = document.getElementById('category-id');
    const categoryTitle = document.getElementById('category-title');
    const categorySlug = document.getElementById('category-slug');
    
    // Reset manually edited flag
    if (categorySlug) {
        categorySlug.dataset.manuallyEdited = null;
    }
    
    if (category) {
        // Edit mode
        modalTitle.textContent = 'Kategori Düzenle';
        categoryId.value = category.id;
        categoryTitle.value = category.title;
        categorySlug.value = category.id;
    } else {
        // Add mode
        modalTitle.textContent = 'Yeni Kategori Ekle';
        categoryForm.reset();
        categoryId.value = '';
    }
    
    modal.style.display = 'block';
}

/**
 * Close category modal
 */
function closeCategoryModal() {
    const modal = document.getElementById('category-modal');
    closeModal(modal);
}

/**
 * Open resource modal for add/edit
 */
function openResourceModal(resource = null) {
    const modal = document.getElementById('resource-modal');
    if (!modal) return;
    
    // Clear previous URL entries
    const urlContainer = document.getElementById('url-container');
    if (urlContainer) {
        urlContainer.innerHTML = '';
    }
    
    // Set modal title
    const modalTitle = document.getElementById('resource-modal-title');
    if (modalTitle) {
        modalTitle.textContent = resource ? 'Kaynak Düzenle' : 'Kaynak Ekle';
    }
    
    // Fill form with resource data if editing
    if (resource) {
        document.getElementById('resource-id').value = resource.id;
        document.getElementById('resource-category').value = resource.categoryId;
        document.getElementById('resource-authors').value = resource.authors;
        document.getElementById('resource-year').value = resource.year;
        document.getElementById('resource-title').value = resource.title;
        document.getElementById('resource-journal').value = resource.journal;
        document.getElementById('resource-volume').value = resource.volume || '';
        document.getElementById('resource-pages').value = resource.pages || '';
        
        // Add URLs
        if (resource.urls && resource.urls.length > 0) {
            resource.urls.forEach((url, index) => {
                if (index === 0) {
                    // First URL goes in the default entry
                    const firstUrlEntry = document.createElement('div');
                    firstUrlEntry.className = 'url-entry';
                    firstUrlEntry.innerHTML = `
                        <div class="url-input-group">
                            <input type="url" class="resource-url" value="${url}" placeholder="https://..." required>
                            <button type="button" class="btn add-url-btn">+</button>
                        </div>
                        <small>Kaynağın tam URL adresi, https:// ile başlamalı</small>
                    `;
                    urlContainer.appendChild(firstUrlEntry);
                } else {
                    // Additional URLs get new entries
                    const urlEntry = document.createElement('div');
                    urlEntry.className = 'url-entry';
                    urlEntry.innerHTML = `
                        <div class="url-input-group">
                            <input type="url" class="resource-url" value="${url}" placeholder="https://..." required>
                            <button type="button" class="btn add-url-btn">+</button>
                            <button type="button" class="btn remove-url-btn">-</button>
                        </div>
                        <small>Kaynağın tam URL adresi, https:// ile başlamalı</small>
                    `;
                    urlContainer.appendChild(urlEntry);
                }
            });
        } else if (resource.url) {
            // Convert old format with single URL
            const urlEntry = document.createElement('div');
            urlEntry.className = 'url-entry';
            urlEntry.innerHTML = `
                <div class="url-input-group">
                    <input type="url" class="resource-url" value="${resource.url}" placeholder="https://..." required>
                    <button type="button" class="btn add-url-btn">+</button>
                </div>
                <small>Kaynağın tam URL adresi, https:// ile başlamalı</small>
            `;
            urlContainer.appendChild(urlEntry);
        }
    } else {
        // Clear form for new resource
        document.getElementById('resource-form').reset();
        document.getElementById('resource-id').value = '';
        
        // Add default URL entry
        const urlEntry = document.createElement('div');
        urlEntry.className = 'url-entry';
        urlEntry.innerHTML = `
            <div class="url-input-group">
                <input type="url" class="resource-url" placeholder="https://..." required>
                <button type="button" class="btn add-url-btn">+</button>
            </div>
            <small>Kaynağın tam URL adresi, https:// ile başlamalı</small>
        `;
        urlContainer.appendChild(urlEntry);
    }
    
    // Show modal
    modal.style.display = 'block';
}

/**
 * Close resource modal
 */
function closeResourceModal() {
    const modal = document.getElementById('resource-modal');
    closeModal(modal);
    
    // Reset form
    document.getElementById('resource-form').reset();
    document.getElementById('resource-id').value = '';
    document.getElementById('resource-modal-title').textContent = 'Kaynak Ekle';
}

/**
 * Close any modal
 */
function closeModal(modal) {
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Handle category form submission
 */
function handleCategorySave(event) {
    event.preventDefault();
    
    const categoryId = document.getElementById('category-id').value;
    const categoryTitle = document.getElementById('category-title').value;
    const categorySlug = document.getElementById('category-slug').value;
    
    if (!categoryTitle || !categorySlug) {
        alert('Kategori başlığı ve ID gereklidir!');
        return;
    }
    
    // Check for duplicate slug (except when editing the same category)
    const slugExists = categories.some(c => c.id === categorySlug && c.id !== categoryId);
    if (slugExists) {
        alert('Bu ID zaten kullanımda. Lütfen benzersiz bir ID girin.');
        return;
    }
    
    if (categoryId) {
        // Update existing category
        const index = categories.findIndex(c => c.id === categoryId);
        
        if (index !== -1) {
            const oldId = categories[index].id;
            
            // Update category
            categories[index] = {
                id: categorySlug,
                title: categoryTitle
            };
            
            // Update resources if category ID changed
            if (oldId !== categorySlug) {
                resources.forEach(resource => {
                    if (resource.categoryId === oldId) {
                        resource.categoryId = categorySlug;
                    }
                });
            }
        }
    } else {
        // Add new category
        categories.push({
            id: categorySlug,
            title: categoryTitle
        });
    }
    
    // Save changes
    saveCategories();
    saveResources();
    
    // Update UI
    renderCategories();
    updateCategoryFilters();
    
    // Close modal
    closeCategoryModal();
}

/**
 * Handle resource form submission
 */
function handleResourceSave(event) {
    event.preventDefault();
    
    const resourceId = document.getElementById('resource-id').value;
    const resourceCategory = document.getElementById('resource-category').value;
    
    if (!resourceCategory) {
        alert('Lütfen bir kategori seçin!');
        return;
    }
    
    // Check if we have bulk resources to save
    if (bulkResources.length > 0) {
        // Generate IDs for each bulk resource
        bulkResources.forEach(resource => {
            resource.id = 'resource_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
            resources.push(resource);
        });
        
        alert(`${bulkResources.length} kaynak başarıyla eklendi.`);
        bulkResources = []; // Clear bulk resources
    } else {
        // Handle single resource
        const resourceAuthors = document.getElementById('resource-authors').value;
        const resourceYear = document.getElementById('resource-year').value;
        const resourceTitle = document.getElementById('resource-title').value;
        const resourceJournal = document.getElementById('resource-journal').value;
        const resourceVolume = document.getElementById('resource-volume').value;
        const resourcePages = document.getElementById('resource-pages').value;
        
        // Get all URLs from the form
        const urlInputs = document.querySelectorAll('.resource-url');
        const urls = Array.from(urlInputs).map(input => input.value).filter(url => url.trim() !== '');
        
        if (!resourceAuthors || !resourceYear || !resourceTitle || !resourceJournal || urls.length === 0) {
            alert('Lütfen tüm zorunlu alanları doldurun ve en az bir URL ekleyin!');
            return;
        }
        
        const resourceData = {
            categoryId: resourceCategory,
            authors: resourceAuthors,
            year: parseInt(resourceYear),
            title: resourceTitle,
            journal: resourceJournal,
            volume: resourceVolume,
            pages: resourcePages,
            urls: urls
        };
        
        if (resourceId) {
            // Update existing resource
            const index = resources.findIndex(r => r.id === resourceId);
            
            if (index !== -1) {
                resourceData.id = resourceId;
                resources[index] = resourceData;
            }
        } else {
            // Add new resource
            resourceData.id = 'resource_' + Date.now();
            resources.push(resourceData);
        }
    }
    
    // Save changes
    saveResources();
    
    // Update UI
    renderResources(document.getElementById('resource-category-filter').value);
    
    // Close modal
    closeResourceModal();
}

/**
 * Open delete confirmation modal
 */
function openDeleteModal(type, item) {
    const deleteModal = document.getElementById('delete-modal');
    const deleteMessage = document.getElementById('delete-message');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    
    if (!deleteModal || !deleteMessage || !confirmDeleteBtn) return;
    
    let message = '';
    
    if (type === 'category') {
        const category = categories.find(c => c.id === item.id);
        if (category) {
            message = `"${category.title}" kategorisini silmek istediğinizden emin misiniz? Bu işlem bu kategorideki tüm kaynakları da silecektir.`;
        }
    } else if (type === 'resource') {
        const resource = resources.find(r => r.id === item.id);
        if (resource) {
            message = `"${resource.title}" kaynağını silmek istediğinizden emin misiniz?`;
        }
    }
    
    deleteMessage.textContent = message;
    
    // Veri özniteliklerini ayarla
    confirmDeleteBtn.dataset.type = type;
    confirmDeleteBtn.dataset.id = item.id;
    
    // Modalı göster
    deleteModal.style.display = 'block';
}

/**
 * Confirm delete action
 */
function confirmDelete() {
    const type = document.getElementById('confirm-delete').dataset.type;
    const id = document.getElementById('confirm-delete').dataset.id;
    
    if (type === 'category') {
        // Delete category
        const index = categories.findIndex(c => c.id === id);
        
        if (index !== -1) {
            // Also delete all resources in this category
            resources = resources.filter(r => r.categoryId !== id);
            saveResources();
            
            // Delete the category
            categories.splice(index, 1);
            saveCategories();
            
            // If Firebase is enabled, directly delete from database
            if (firebaseInitialized) {
                db.ref(`categories/${id}`).remove()
                    .then(() => {
                        console.log(`Kategori silindi: ${id}`);
                    })
                    .catch((error) => {
                        console.error("Firebase kategori silme hatası:", error);
                    });
                
                // Delete related resources
                db.ref("resources").orderByChild("categoryId").equalTo(id).once("value")
                    .then((snapshot) => {
                        const resourcesData = snapshot.val();
                        if (resourcesData) {
                            Object.keys(resourcesData).forEach(key => {
                                db.ref(`resources/${key}`).remove();
                            });
                            console.log(`Kategoriye ait kaynaklar silindi: ${id}`);
                        }
                    })
                    .catch((error) => {
                        console.error("Firebase kategori kaynaklarını silme hatası:", error);
                    });
            }
            
            // Update UI
            renderCategories();
            renderResources();
        }
    } else if (type === 'resource') {
        // Delete resource
        const index = resources.findIndex(r => r.id === id);
        
        if (index !== -1) {
            resources.splice(index, 1);
            saveResources();
            
            // If Firebase is enabled, directly delete from database
            if (firebaseInitialized) {
                db.ref(`resources/${id}`).remove()
                    .then(() => {
                        console.log(`Kaynak silindi: ${id}`);
                    })
                    .catch((error) => {
                        console.error("Firebase kaynak silme hatası:", error);
                    });
            }
            
            // Update UI
            renderResources();
        }
    }
    
    // Close the modal
    closeModal(document.getElementById('delete-modal'));
}

/**
 * Format citation for a resource
 */
function formatCitation(resource) {
    let citation = '';
    
    citation += resource.authors;
    
    if (resource.year) {
        citation += ` (${resource.year}). `;
    } else {
        citation += '. ';
    }
    
    citation += `<em>${resource.title}</em>. `;
    
    if (resource.journal) {
        citation += `<strong>${resource.journal}`;
        
        if (resource.volume) {
            citation += `, ${resource.volume}`;
        }
        
        if (resource.pages) {
            citation += `, ${resource.pages}`;
        }
        
        citation += '</strong>.';
    }
    
    return citation;
}

/**
 * Generate HTML code for library.html
 */
function generateHtml() {
    // Start with the container
    let html = '<!-- Categories generated by admin panel - Start -->\n';
    html += '<div class="categories-container">\n';
    
    // Add each category
    categories.forEach(category => {
        html += `    <!-- ${category.title} Category -->\n`;
        html += `    <div class="category" id="${category.id}">\n`;
        html += `        <div class="category-header">\n`;
        html += `            <h2>${category.title}</h2>\n`;
        html += `            <span class="toggle-icon">+</span>\n`;
        html += `        </div>\n`;
        html += `        <div class="category-content">\n`;
        html += `            <ul class="resource-list">\n`;
        
        // Get resources for this category
        const categoryResources = resources.filter(r => r.categoryId === category.id);
        
        if (categoryResources.length === 0) {
            html += `                <li class="resource-item">Bu kategoride henüz kaynak bulunmamaktadır.</li>\n`;
        } else {
            // Create a resource item for each resource
            categoryResources.forEach((resource, index) => {
                const resourceGroupId = `${category.id}-resource-${index}`;
                
                html += `                <li class="resource-item">\n`;
                html += `                    <a href="#" class="resource-title" onclick="toggleResourceLinks('${resourceGroupId}'); return false;">\n`;
                html += `                        ${resource.authors} (${resource.year}) ${resource.title}\n`;
                html += `                    </a>\n`;
                html += `                    <div id="${resourceGroupId}" class="resource-links" style="display: none;">\n`;
                
                if (resource.urls && resource.urls.length > 0) {
                    html += `                        <div class="resource-citation">${formatCitation(resource)}</div>\n`;
                    html += `                        <ul class="url-list">\n`;
                    
                    // Add each URL
                    resource.urls.forEach((url, urlIndex) => {
                        html += `                            <li><a href="${url}" target="_blank">Kaynak Bağlantısı ${urlIndex + 1}</a></li>\n`;
                    });
                    
                    html += `                        </ul>\n`;
                } else if (resource.url) {
                    // Backward compatibility
                    html += `                        <div class="resource-citation">${formatCitation(resource)}</div>\n`;
                    html += `                        <ul class="url-list">\n`;
                    html += `                            <li><a href="${resource.url}" target="_blank">Kaynak Bağlantısı</a></li>\n`;
                    html += `                        </ul>\n`;
                }
                
                html += `                    </div>\n`;
                html += `                </li>\n`;
            });
        }
        
        html += `            </ul>\n`;
        html += `        </div>\n`;
        html += `    </div>\n`;
    });
    
    html += '</div>\n';
    html += '<!-- Categories generated by admin panel - End -->';
    
    // Display the generated HTML
    const codeContainer = document.getElementById('generated-code-container');
    const codeElement = document.getElementById('generated-html-code');
    
    if (codeContainer && codeElement) {
        codeElement.textContent = html;
        codeContainer.classList.remove('hidden');
    }
}

/**
 * Copy generated HTML to clipboard
 */
function copyGeneratedHtml() {
    const generatedHtmlCode = document.getElementById('generated-html-code');
    const codeText = generatedHtmlCode.textContent;
    
    navigator.clipboard.writeText(codeText)
        .then(() => {
            alert('HTML kodu panoya kopyalandı!');
        })
        .catch(err => {
            console.error('Kopyalama hatası:', err);
            alert('Kopyalama işlemi başarısız oldu. Lütfen kodu manuel olarak kopyalayın.');
        });
}

/**
 * Download data as JSON file
 */
function downloadJson() {
    const data = {
        categories: categories,
        resources: resources
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileName = 'sinirbilimportali-data.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
}

/**
 * Upload and import JSON data
 */
function uploadJson() {
    const fileInput = document.getElementById('json-file-input');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Lütfen önce bir JSON dosyası seçin.');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.categories && Array.isArray(data.categories) && 
                data.resources && Array.isArray(data.resources)) {
                
                // Confirm before replacing all data
                if (confirm('Bu işlem mevcut tüm kategorileri ve kaynakları yüklenecek verilerle değiştirecektir. Devam etmek istiyor musunuz?')) {
                    categories = data.categories;
                    resources = data.resources;
                    
                    saveCategories();
                    saveResources();
                    
                    renderCategories();
                    renderResources();
                    updateCategoryFilters();
                    
                    alert('Veriler başarıyla içe aktarıldı!');
                    
                    // Reset file input
                    fileInput.value = '';
                }
            } else {
                alert('Geçersiz veri formatı. Dosya gerekli kategori ve kaynak verilerini içermiyor.');
            }
        } catch (error) {
            alert('Dosya ayrıştırma hatası: ' + error.message);
        }
    };
    
    reader.readAsText(file);
}

/**
 * Generate slug from text (URL-friendly string)
 */
function generateSlug(text) {
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD')                   // Normalize diacritics
        .replace(/[\u0300-\u036f]/g, '')   // Remove diacritics
        .replace(/[^a-z0-9\s-]/g, '')      // Remove non-alphanumeric chars
        .replace(/\s+/g, '-')              // Replace spaces with hyphens
        .replace(/-+/g, '-')               // Remove consecutive hyphens
        .trim()                            // Trim whitespace
        .replace(/^-+|-+$/g, '');          // Remove leading/trailing hyphens
}

/**
 * Parse bulk resources from text
 */
function parseBulkResources() {
    const bulkResourcesText = document.getElementById('bulk-resources').value;
    if (!bulkResourcesText.trim()) {
        alert('Lütfen toplu kaynakları yazı alanına girin!');
        return;
    }
    
    const lines = bulkResourcesText.split('\n').filter(line => line.trim() !== '');
    const categoryId = document.getElementById('resource-category').value;
    
    if (!categoryId) {
        alert('Lütfen bir kategori seçin!');
        return;
    }
    
    bulkResources = [];
    
    lines.forEach(line => {
        // Try to extract URL from the line
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = [];
        let urlMatch;
        
        while ((urlMatch = urlRegex.exec(line)) !== null) {
            urls.push(urlMatch[0]);
        }
        
        // Use the whole line as title if no URL is found
        if (urls.length > 0) {
            const citation = line.replace(urlRegex, '').trim();
            
            // Basic parsing of citation text
            let authors = '';
            let year = '';
            let title = '';
            let journal = '';
            let volume = '';
            let pages = '';
            
            // Try to extract year from citation
            const yearMatch = citation.match(/\((\d{4})\)/);
            if (yearMatch) {
                year = yearMatch[1];
                
                // Try to split authors and title based on year
                const parts = citation.split(/\(\d{4}\)/);
                if (parts.length > 0) {
                    authors = parts[0].trim();
                    
                    if (parts.length > 1) {
                        // Try to split title and journal
                        const titleParts = parts[1].split(/\.(?=[^.]*$)/);
                        if (titleParts.length > 0) {
                            title = titleParts[0].trim().replace(/^\./, '').trim();
                            
                            if (titleParts.length > 1) {
                                journal = titleParts[1].trim();
                            }
                        }
                    }
                }
            } else {
                // If no year found, use the whole citation as title
                title = citation;
            }
            
            bulkResources.push({
                categoryId: categoryId,
                authors: authors,
                year: year ? parseInt(year) : new Date().getFullYear(),
                title: title || 'Başlıksız Kaynak',
                journal: journal || '',
                volume: volume,
                pages: pages,
                urls: urls
            });
        }
    });
    
    const parsedCount = bulkResources.length;
    if (parsedCount > 0) {
        alert(`${parsedCount} kaynak başarıyla analiz edildi. Kaydet butonuna tıkladığınızda eklenecekler.`);
        
        // Show a preview of what was parsed
        const singleResourceFields = document.getElementById('single-resource-fields');
        if (singleResourceFields) {
            singleResourceFields.innerHTML = `
                <div class="bulk-preview">
                    <h3>Toplu Kaynak Önizleme (${parsedCount} kaynak)</h3>
                    <div class="preview-container">
                        <p>İlk birkaç kaynak:</p>
                        <ul>
                            ${bulkResources.slice(0, 3).map(res => `<li>${res.authors} (${res.year}) ${res.title} - ${res.urls.length} URL</li>`).join('')}
                            ${bulkResources.length > 3 ? `<li>... ve ${bulkResources.length - 3} kaynak daha</li>` : ''}
                        </ul>
                    </div>
                </div>
            `;
        }
    } else {
        alert('Hiç kaynak bulunamadı. Metinde URL\\\'ler olduğundan emin olun.');
    }
}

/**
 * Verify and log Firebase data
 */
function debugFirebaseData() {
    if (firebaseInitialized) {
        console.log("Firebase bağlantısı aktif, veritabanını kontrol ediyorum...");
        
        // Tüm veri yollarını kontrol et
        db.ref().once("value", (snapshot) => {
            const allData = snapshot.val();
            console.log("Firebase'deki tüm veriler:", allData);
            
            if (allData && allData.categories) {
                console.log("Kategoriler bulundu:", Object.keys(allData.categories).length);
                categories = Object.entries(allData.categories).map(([key, value]) => {
                    return { ...value, id: key };
                });
                renderCategories();
                updateCategoryFilters();
            } else {
                console.error("Firebase'de categories yolu bulunamadı!");
            }
            
            if (allData && allData.resources) {
                console.log("Kaynaklar bulundu:", Object.keys(allData.resources).length);
                resources = Object.entries(allData.resources).map(([key, value]) => {
                    return { ...value, id: key };
                });
                renderResources();
            } else {
                console.error("Firebase'de resources yolu bulunamadı!");
            }
        });
    }
}
