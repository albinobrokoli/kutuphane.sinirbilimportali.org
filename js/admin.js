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

    // Kategorileri ve kaynakçaları yükle
    loadCategoriesAndBibliographies();

    // Tekli kaynakça ekleme
    const singleBibliographyForm = document.getElementById('bibliography-form');
    if (singleBibliographyForm) {
        singleBibliographyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const titleInput = document.getElementById('bibliography-title');
            const urlInput = document.getElementById('bibliography-url');
            const categoryInput = document.getElementById('bibliography-category');
            const title = titleInput.value.trim();
            const url = urlInput.value.trim();
            const category = categoryInput.value.trim() || 'Diğer';
            if (title && url) {
                await addBibliographyFirebase(category, title, url);
                titleInput.value = '';
                urlInput.value = '';
                categoryInput.value = '';
                await loadCategoriesAndBibliographies();
            } else {
                alert('Lütfen başlık ve URL girin.');
            }
        });
    }

    // Toplu kaynakça ekleme
    const bulkBibliographyForm = document.getElementById('bulk-bibliography-form');
    if (bulkBibliographyForm) {
        bulkBibliographyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const bulkTextArea = document.getElementById('bulk-bibliography');
            const lines = bulkTextArea.value.trim().split('\n');
            const categoryInput = document.getElementById('bulk-bibliography-category');
            const category = categoryInput ? (categoryInput.value.trim() || 'Diğer') : 'Diğer';
            let addedCount = 0;
            for (let line of lines) {
                line = line.trim();
                if (!line) continue;
                let title = line;
                let url = '';
                // "Başlık - URL" veya sadece URL
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
                    continue;
                }
                if (url.startsWith('http://') || url.startsWith('https://')) {
                    await addBibliographyFirebase(category, title, url);
                    addedCount++;
                }
            }
            if (addedCount > 0) {
                bulkTextArea.value = '';
                await loadCategoriesAndBibliographies();
                alert(`${addedCount} kaynakça başarıyla eklendi.`);
            } else {
                alert('Geçerli formatta kaynakça bulunamadı veya eklenemedi.');
            }
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
