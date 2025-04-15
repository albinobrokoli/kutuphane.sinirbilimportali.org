document.addEventListener('DOMContentLoaded', () => {
    const singleBibliographyForm = document.getElementById('bibliography-form'); // Tekli ekleme formu
    const bulkBibliographyForm = document.getElementById('bulk-bibliography-form'); // Toplu ekleme formu
    const bibliographyAccordion = document.getElementById('bibliography-accordion'); // Akordiyon konteyneri

    // Başlangıçta localStorage'dan verileri yükle veya boş bir nesne oluştur
    let bibliographies = JSON.parse(localStorage.getItem('bibliographies')) || {};

    // Mevcut kaynakçaları akordiyon içinde görüntüle
    displayBibliographies();

    // --- Olay Dinleyicileri ---

    // Tekli Kaynakça Ekleme Formu
    if (singleBibliographyForm) {
        singleBibliographyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const titleInput = document.getElementById('bibliography-title');
            const urlInput = document.getElementById('bibliography-url');
            const categoryInput = document.getElementById('bibliography-category'); // Kategori inputunu al

            const title = titleInput.value.trim();
            const url = urlInput.value.trim();
            const category = categoryInput.value.trim() || 'Diğer'; // Kategori boşsa 'Diğer' kullan

            if (title && url) {
                addBibliography(category, title, url);
                titleInput.value = '';
                urlInput.value = '';
                categoryInput.value = ''; // Formu temizle
                displayBibliographies(); // Listeyi güncelle
                saveBibliographies(); // localStorage'a kaydet
            } else {
                alert('Lütfen başlık ve URL girin.');
            }
        });
    }

    // Toplu Kaynakça Ekleme Formu
    if (bulkBibliographyForm) {
        bulkBibliographyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const bulkTextArea = document.getElementById('bulk-bibliography');
            const lines = bulkTextArea.value.trim().split('\n');
            let addedCount = 0;

            lines.forEach(line => {
                line = line.trim();
                if (line) {
                    // Basit ayırma mantığı: "Başlık - URL" veya sadece URL
                    let title = line;
                    let url = '';
                    let category = 'Diğer'; // Varsayılan kategori

                    // Ayırıcıyı kontrol et (örn: " - ")
                    const separatorIndex = line.lastIndexOf(' - ');
                    if (separatorIndex > 0) {
                        title = line.substring(0, separatorIndex).trim();
                        url = line.substring(separatorIndex + 3).trim();
                    } else {
                         // URL mi diye kontrol etmeye çalışalım (basit kontrol)
                        if (line.startsWith('http://') || line.startsWith('https://')) {
                             url = line;
                             // URL'den basit bir başlık türetmeye çalışalım
                             try {
                                 const urlObject = new URL(url);
                                 title = urlObject.hostname; // Örneğin: www.example.com
                             } catch (error) {
                                 title = 'Başlıksız Kaynak'; // Hata olursa
                             }
                         } else {
                             // Geçerli format değilse atla
                             console.warn(`Geçersiz satır formatı: "${line}"`);
                             return; // Bu satırı atla
                         }
                    }


                    // Geçerli URL kontrolü (daha sağlam yapılabilir)
                    if (url.startsWith('http://') || url.startsWith('https://')) {
                        // Kategori belirleme (şimdilik varsayılan)
                        // İleride daha karmaşık mantık eklenebilir (örneğin anahtar kelimelere göre)
                         addBibliography(category, title, url);
                         addedCount++;
                    } else {
                        console.warn(`Geçersiz URL: "${url}" in line "${line}"`);
                    }
                }
            });

            if (addedCount > 0) {
                bulkTextArea.value = ''; // Text area'yı temizle
                displayBibliographies(); // Listeyi güncelle
                saveBibliographies(); // localStorage'a kaydet
                alert(`${addedCount} kaynakça başarıyla eklendi.`);
            } else {
                alert('Geçerli formatta kaynakça bulunamadı veya eklenemedi.');
            }
        });
    }

    // Akordiyon Tıklama Olayı (Event Delegation)
    if (bibliographyAccordion) {
        bibliographyAccordion.addEventListener('click', (e) => {
            if (e.target.classList.contains('category-header')) {
                const header = e.target;
                const content = header.nextElementSibling; // Kategori başlığının hemen altındaki içerik (ul)
                header.classList.toggle('active');
                content.classList.toggle('active');
            }
        });
    }

    // --- Yardımcı Fonksiyonlar ---

    // Yeni kaynakça ekleme fonksiyonu
    function addBibliography(category, title, url) {
        if (!bibliographies[category]) {
            bibliographies[category] = []; // Kategori yoksa oluştur
        }
        // Aynı URL'in tekrar eklenmesini engelle (isteğe bağlı)
        const exists = bibliographies[category].some(item => item.url === url);
        if (!exists) {
             bibliographies[category].push({ title, url });
        } else {
            console.warn(`"${title}" (${url}) zaten "${category}" kategorisinde mevcut.`);
        }
    }

    // Kaynakçaları akordiyon içinde görüntüleme fonksiyonu
    function displayBibliographies() {
        if (!bibliographyAccordion) return; // Akordiyon yoksa çık

        bibliographyAccordion.innerHTML = ''; // Önceki içeriği temizle

        const categories = Object.keys(bibliographies).sort(); // Kategorileri alfabetik sırala

        if (categories.length === 0) {
            bibliographyAccordion.innerHTML = '<p>Henüz kaynakça eklenmemiş.</p>';
            return;
        }

        categories.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.classList.add('category-item'); // CSS için sınıf

            // Kategori Başlığı
            const header = document.createElement('div');
            header.classList.add('category-header');
            header.textContent = category;
            categoryDiv.appendChild(header);

            // Kaynakça Listesi
            const ul = document.createElement('ul');
            ul.classList.add('bibliography-items'); // Başlangıçta kapalı olması için CSS sınıfı
            bibliographies[category].forEach(item => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = item.url;
                a.textContent = item.title;
                a.target = '_blank'; // Yeni sekmede aç
                li.appendChild(a);
                ul.appendChild(li);
            });
            categoryDiv.appendChild(ul);

            bibliographyAccordion.appendChild(categoryDiv);
        });
    }

    // Kaynakçaları localStorage'a kaydetme fonksiyonu
    function saveBibliographies() {
        localStorage.setItem('bibliographies', JSON.stringify(bibliographies));
    }

}); // DOMContentLoaded Sonu
