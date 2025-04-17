document.addEventListener('DOMContentLoaded', () => {
    // Basit giriş doğrulama (örnek: admin/admin)
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            // Basit kontrol, gerçek projede güvenli yöntemler kullanılmalı
            if (username === 'admin' && password === 'admin') {
                loginSection.classList.add('hidden');
                dashboardSection.classList.remove('hidden');
                loginError.textContent = '';
            } else {
                loginError.textContent = 'Kullanıcı adı veya şifre yanlış!';
            }
        });
    }

    // Firebase referansı
    const db = firebase.database();

    // Sekme geçişleri ve çıkış butonu
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.tab + '-tab';
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.add('hidden'));
            btn.classList.add('active');
            const content = document.getElementById(target);
            if (content) content.classList.remove('hidden');
        });
    });
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            dashboardSection.classList.add('hidden');
            loginSection.classList.remove('hidden');
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
        });
    }

    // Kategorileri ve kaynakçaları yükle
    loadCategoriesAndBibliographies();

    // Kategori ekleme modalı
    const addCategoryBtn = document.getElementById('add-category-btn');
    const categoryModal = document.getElementById('category-modal');
    const categoryForm = document.getElementById('category-form');
    const categoryTitleInput = document.getElementById('category-title');
    const categoryIdInput = document.getElementById('category-id');
    const closeCategoryModalBtn = categoryModal ? categoryModal.querySelector('.close-btn') : null;

    if (addCategoryBtn && categoryModal) {
        addCategoryBtn.addEventListener('click', () => {
            categoryTitleInput.value = '';
            categoryIdInput.value = '';
            categoryModal.style.display = 'block';
        });
    }
    if (closeCategoryModalBtn && categoryModal) {
        closeCategoryModalBtn.addEventListener('click', () => {
            categoryModal.style.display = 'none';
        });
    }
    if (categoryForm) {
        categoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = categoryTitleInput.value.trim();
            if (!title) { alert('Kategori başlığı gerekli!'); return; }
            const catRef = db.ref('categories');
            let catSnapshot = await catRef.orderByChild('title').equalTo(title).once('value');
            if (!catSnapshot.exists()) {
                const newCatRef = catRef.push();
                await newCatRef.set({ title });
            }
            categoryModal.style.display = 'none';
            await loadCategoriesAndBibliographies();
        });
    }

    // Resource modal açma/kapatma ve form gönderme
    const addResourceBtn = document.getElementById('add-resource-btn');
    const resourceModal = document.getElementById('resource-modal');
    const resourceForm = document.getElementById('resource-form');
    const closeResourceModalBtn = resourceModal ? resourceModal.querySelector('.close-btn') : null;
    if (addResourceBtn && resourceModal) {
        addResourceBtn.addEventListener('click', () => {
            resourceForm.reset();
            resourceModal.style.display = 'block';
        });
    }
    if (closeResourceModalBtn) {
        closeResourceModalBtn.addEventListener('click', () => {
            resourceModal.style.display = 'none';
        });
    }
    if (resourceForm) {
        resourceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const catId = document.getElementById('resource-category').value;
            if (!catId) { alert('Kategori seçin!'); return; }
            const urls = Array.from(resourceModal.querySelectorAll('.resource-url')).map(el => el.value.trim()).filter(u => u);
            if (urls.length === 0) { alert('En az bir URL girin!'); return; }
            const authors = document.getElementById('resource-authors').value.trim();
            const year = document.getElementById('resource-year').value.trim();
            const title = document.getElementById('resource-title').value.trim();
            const journal = document.getElementById('resource-journal').value.trim();
            const notes = document.getElementById('resource-notes').value.trim();
            const resRef = db.ref('resources').push();
            await resRef.set({ categoryId: catId, authors, year: parseInt(year) || null, title, journal, notes, urls });
            resourceModal.style.display = 'none';
            await loadCategoriesAndBibliographies();
        });
    }

    // Toplu kaynak ekleme (bulk-resources)
    const parseBulkBtn = document.getElementById('parse-bulk-btn');
    const saveBulkBtn = document.getElementById('save-bulk-resources-btn');
    const bulkResourcesCategory = document.getElementById('bulk-resources-category');
    const bulkResourcesText = document.getElementById('bulk-resources-text');
    const bulkPreview = document.getElementById('bulk-resources-preview');
    let parsedBulkResources = [];

    if (parseBulkBtn && bulkResourcesCategory && bulkResourcesText && bulkPreview && saveBulkBtn) {
        parseBulkBtn.addEventListener('click', () => {
            const catId = bulkResourcesCategory.value;
            const lines = bulkResourcesText.value.trim().split('\n').filter(l => l.trim() !== '');
            parsedBulkResources = [];
            bulkPreview.innerHTML = '';
            if (!catId) {
                alert('Lütfen bir kategori seçin!');
                return;
            }
            lines.forEach(line => {
                let title = line;
                let url = '';
                const separatorIndex = line.lastIndexOf(' - ');
                if (separatorIndex > 0) {
                    title = line.substring(0, separatorIndex).trim();
                    url = line.substring(separatorIndex + 3).trim();
                } else if (line.startsWith('http://') || line.startsWith('https://')) {
                    url = line;
                    try {
                        const urlObject = new URL(url);
                        title = urlObject.hostname;
                    } catch (error) {
                        title = 'Başlıksız Kaynak';
                    }
                } else {
                    return;
                }
                if (url.startsWith('http://') || url.startsWith('https://')) {
                    parsedBulkResources.push({ title, url });
                }
            });
            if (parsedBulkResources.length > 0) {
                bulkPreview.innerHTML = `<ul>${parsedBulkResources.map(r => `<li>${r.title} - <a href='${r.url}' target='_blank'>${r.url}</a></li>`).join('')}</ul>`;
                saveBulkBtn.style.display = 'inline-block';
            } else {
                bulkPreview.innerHTML = '<em>Hiçbir geçerli kaynak bulunamadı.</em>';
                saveBulkBtn.style.display = 'none';
            }
        });
        saveBulkBtn.addEventListener('click', async () => {
            const catId = bulkResourcesCategory.value;
            if (!catId) {
                alert('Lütfen bir kategori seçin!');
                return;
            }
            if (parsedBulkResources.length === 0) {
                alert('Eklenebilecek kaynak yok. Lütfen önce analiz et butonunu kullanın.');
                return;
            }
            for (const r of parsedBulkResources) {
                const resRef = db.ref('resources').push();
                await resRef.set({
                    categoryId: catId,
                    title: r.title,
                    urls: [r.url]
                });
            }
            parsedBulkResources = [];
            bulkResourcesText.value = '';
            bulkPreview.innerHTML = '';
            saveBulkBtn.style.display = 'none';
            await loadCategoriesAndBibliographies();
            alert('Kaynaklar başarıyla eklendi.');
        });
    }

    // Kategori dropdownlarını güncelle
    function updateCategoryDropdowns() {
        const catRef = db.ref('categories');
        catRef.once('value').then(snapshot => {
            const categories = snapshot.val() || {};
            const dropdownIds = ['resource-category','bulk-resources-category','category-filter'];
            dropdownIds.forEach(id => {
                const select = document.getElementById(id);
                if (select) {
                    const currentVal = select.value;
                    select.innerHTML = '';
                    if (id === 'category-filter') {
                        const opt = document.createElement('option'); opt.value = ''; opt.textContent = 'Tüm Kategoriler'; select.appendChild(opt);
                    } else {
                        const opt = document.createElement('option'); opt.value = ''; opt.textContent = 'Kategori Seçiniz'; select.appendChild(opt);
                    }
                    Object.entries(categories).forEach(([catId, catData]) => {
                        const opt = document.createElement('option'); opt.value = catId; opt.textContent = catData.title; select.appendChild(opt);
                    });
                    if (currentVal) select.value = currentVal;
                }
            });
        });
    }

    // Accordion başlıkları
    const bibliographyAccordion = document.getElementById('bibliography-accordion');
    if (bibliographyAccordion) {
        bibliographyAccordion.addEventListener('click', (e) => {
            if (e.target.classList.contains('category-header')) {
                const header = e.target;
                const content = header.nextElementSibling;
                header.classList.toggle('active');
                content.classList.toggle('active');
            }
        });
    }

    // --- Firebase Fonksiyonları ---
    async function addBibliographyFirebase(category, title, url) {
        // Kategori yoksa oluştur
        const catRef = db.ref('categories');
        let catSnapshot = await catRef.orderByChild('title').equalTo(category).once('value');
        let catId;
        if (!catSnapshot.exists()) {
            // Yeni kategori ekle
            const newCatRef = catRef.push();
            await newCatRef.set({ title: category });
            catId = newCatRef.key;
        } else {
            catId = Object.keys(catSnapshot.val())[0];
        }
        // Kaynak ekle
        const resRef = db.ref('resources').push();
        await resRef.set({
            categoryId: catId,
            title: title,
            urls: [url],
            // Gerekirse yazar, yıl, dergi gibi ek alanlar eklenebilir
        });
    }

    async function loadCategoriesAndBibliographies() {
        const catRef = db.ref('categories');
        const resRef = db.ref('resources');
        const catSnap = await catRef.once('value');
        const resSnap = await resRef.once('value');
        const categories = catSnap.val() || {};
        const resources = resSnap.val() || {};
        renderBibliographyAccordion(categories, resources);
        updateCategoryDropdowns();
    }

    function renderBibliographyAccordion(categories, resources) {
        const bibliographyAccordion = document.getElementById('bibliography-accordion');
        if (!bibliographyAccordion) return;
        bibliographyAccordion.innerHTML = '';
        const catEntries = Object.entries(categories);
        if (catEntries.length === 0) {
            bibliographyAccordion.innerHTML = '<p>Henüz kategori veya kaynakça eklenmemiş.</p>';
            return;
        }
        catEntries.forEach(([catId, catData]) => {
            const categoryDiv = document.createElement('div');
            categoryDiv.classList.add('category-item');
            // Kategori başlığı
            const header = document.createElement('div');
            header.classList.add('category-header');
            header.textContent = catData.title;
            categoryDiv.appendChild(header);
            // Kaynakça listesi
            const ul = document.createElement('ul');
            ul.classList.add('bibliography-items');
            // Bu kategoriye ait kaynaklar
            const catResources = Object.entries(resources).filter(([rid, res]) => res.categoryId === catId);
            if (catResources.length === 0) {
                const li = document.createElement('li');
                li.textContent = 'Bu kategoride henüz kaynakça yok.';
                ul.appendChild(li);
            } else {
                catResources.forEach(([rid, res]) => {
                    const li = document.createElement('li');
                    // Her URL için ayrı link
                    (res.urls || []).forEach(url => {
                        const a = document.createElement('a');
                        a.href = url;
                        a.textContent = res.title;
                        a.target = '_blank';
                        a.rel = 'noopener noreferrer';
                        li.appendChild(a);
                    });
                    ul.appendChild(li);
                });
            }
            categoryDiv.appendChild(ul);
            bibliographyAccordion.appendChild(categoryDiv);
        });
    }
});
