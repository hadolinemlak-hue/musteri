let portfolios = JSON.parse(localStorage.getItem("portfolios")) || [];
let customers = JSON.parse(localStorage.getItem("customers")) || [];
let matches = JSON.parse(localStorage.getItem("matches")) || [];

function showSection(id){
  document.querySelectorAll("main section").forEach(section => {
    section.classList.remove("active");
  });

  const target = document.getElementById(id);
  if (target) {
    target.classList.add("active");
  } else {
    console.error("Hata: '" + id + "' ID'sine sahip alan bulunamadı.");
  }
}

function saveData(){
  localStorage.setItem("portfolios", JSON.stringify(portfolios));
  localStorage.setItem("customers", JSON.stringify(customers));
  localStorage.setItem("matches", JSON.stringify(matches));
  updateDashboard();
}

function updateDashboard(){
  const portfolioCount = document.getElementById("portfolioCount");
  const customerCount = document.getElementById("customerCount");
  const matchCount = document.getElementById("matchCount");

  if(portfolioCount) portfolioCount.innerText = portfolios.length;
  if(customerCount) customerCount.innerText = customers.length;
  if(matchCount) matchCount.innerText = matches.length;
}

/* ==========================================================================
   PORTFOLIO (PORTFÖY / İLAN) İŞLEMLERİ
   ========================================================================== */

// Fotoğraf Optimize Edici (Boyut Küçültüp JPEG/PNG Yükleme Hatasını Çözer)
function resizeAndCompressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      };
      img.onerror = error => reject(error);
    };
    reader.onerror = error => reject(error);
  });
}

async function addPortfolio(){
  const titleInput = document.getElementById("title");
  const priceInput = document.getElementById("price");
  const descInput = document.getElementById("description");
  const filesInput = document.getElementById("images");

  const title = titleInput.value.trim();
  const price = parseFloat(priceInput.value) || 0;
  const description = descInput.value.trim();
  const files = filesInput.files;

  if(title === "" || price <= 0){
    alert("Geçerli bir başlık ve fiyat zorunludur.");
    return;
  }

  if(files.length > 3){
    alert("En fazla 3 fotoğraf eklenebilir.");
    return;
  }

  let images = [];
  for(let i = 0; i < files.length; i++){
    try {
      const compressedBase64 = await resizeAndCompressImage(files[i]);
      images.push(compressedBase64);
    } catch(e) {
      console.error("Dosya işlenirken hata oluştu:", e);
    }
  }

  portfolios.push({
    id: Date.now(),
    title,
    price,
    description,
    images
  });

  saveData();
  renderPortfolios();
  updateMatchOptions();

  titleInput.value = "";
  priceInput.value = "";
  descInput.value = "";
  filesInput.value = "";

  alert("İlan başarıyla eklendi.");
}

function renderPortfolios(){
  const list = document.getElementById("portfolioList");
  if(!list) return;

  const searchKey = document.getElementById("portfolioSearch")?.value.toLowerCase() || "";
  const minPrice = parseFloat(document.getElementById("portfolioMinPrice")?.value) || 0;
  const maxPrice = parseFloat(document.getElementById("portfolioMaxPrice")?.value) || Infinity;

  let htmlContent = "";

  const filtered = portfolios.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchKey) || item.description.toLowerCase().includes(searchKey);
    const matchesPrice = item.price >= minPrice && item.price <= maxPrice;
    return matchesSearch && matchesPrice;
  });

  filtered.forEach(item=>{
    let imagesHTML = item.images.map(img => `<img src="${img}" alt="" onclick="openImageModal(this.src)">`).join('');

    htmlContent += `
      <div class="portfolio-item">
        <h3>${item.title}</h3>
        <p style="margin-top:5px;"><strong>Fiyat:</strong> ${item.price.toLocaleString('tr-TR')} TL</p>
        <p style="margin-top:5px; color:#bdc3c7;">${item.description || 'Açıklama yok.'}</p>
        <div class="images">${imagesHTML}</div>
        <div class="action-btns">
          <button class="edit-btn" onclick="editPortfolio(${item.id})">Düzenle</button>
          <button class="delete-btn" onclick="deletePortfolio(${item.id})">Sil</button>
        </div>
      </div>
    `;
  });

  list.innerHTML = htmlContent || "<p>Kriterlere uygun ilan bulunamadı.</p>";
}

function editPortfolio(id) {
  const portfolio = portfolios.find(p => p.id === id);
  if(!portfolio) return;

  const newTitle = prompt("Yeni İlan Başlığı:", portfolio.title);
  if(newTitle === null || newTitle.trim() === "") return;

  const newPrice = prompt("Yeni Fiyat (Sadece rakam):", portfolio.price);
  if(newPrice === null || isNaN(parseFloat(newPrice))) return;

  const newDesc = prompt("Yeni Açıklama:", portfolio.description);

  portfolio.title = newTitle.trim();
  portfolio.price = parseFloat(newPrice);
  if(newDesc !== null) portfolio.description = newDesc.trim();

  saveData();
  renderPortfolios();
  renderMatches(); 
  updateMatchOptions();
  alert("İlan güncellendi.");
}

function deletePortfolio(id){
  if(!confirm("Bu ilanı silmek istediğinize emin misiniz?")) return;

  portfolios = portfolios.filter(p => p.id !== id);
  matches = matches.filter(m => m.portfolioId !== id);

  saveData();
  renderPortfolios();
  renderMatches();
  updateMatchOptions();
  alert("İlan ve ilgili eşleştirmeleri silindi.");
}

/* ==========================================================================
   CUSTOMER (MÜŞTERİ) İŞLEMLERİ
   ========================================================================== */

function addCustomer(){
  const nameInput = document.getElementById("customerName");
  const phoneInput = document.getElementById("customerPhone");
  const demandInput = document.getElementById("customerDemand");
  const noteInput = document.getElementById("customerNote");

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const demand = demandInput.value.trim();
  const note = noteInput.value.trim();

  if(name === "" || phone === "" || demand === ""){
    alert("Ad, telefon ve talep alanları zorunludur.");
    return;
  }

  customers.push({
    id: Date.now(),
    name,
    phone,
    demand,
    note
  });

  saveData();
  renderCustomers();
  updateMatchOptions();

  nameInput.value = "";
  phoneInput.value = "";
  demandInput.value = "";
  noteInput.value = "";

  alert("Müşteri ve talebi eklendi.");
}

function getCleanTrPhone(phoneStr) {
  let clean = phoneStr.replace(/\D/g, '');
  if (clean.startsWith('90') && clean.length === 12) return clean;
  if (clean.startsWith('0') && clean.length === 11) return '90' + clean.substring(1);
  if (clean.length === 10) return '90' + clean;
  return clean;
}

function renderCustomers(){
  const list = document.getElementById("customerList");
  if(!list) return;

  const searchKey = document.getElementById("customerSearch")?.value.toLowerCase() || "";
  let htmlContent = "";

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchKey) || 
    c.demand.toLowerCase().includes(searchKey) || 
    c.note.toLowerCase().includes(searchKey)
  );

  filtered.forEach(customer=>{
    const whatsappPhone = getCleanTrPhone(customer.phone);
    const callPhone = customer.phone.replace(/\D/g,'');

    htmlContent += `
      <div class="customer-item">
        <h3>${customer.name}</h3>
        <p style="margin-top:6px;"><strong>Talep:</strong> <span class="demand-badge">${customer.demand}</span></p>
        <a class="phone-link" href="tel:${callPhone}">📞 ${customer.phone}</a>
        <p style="margin-top:6px; color:#bdc3c7;"><strong>Not:</strong> ${customer.note || '-'}</p>
        <a class="whatsapp-btn" href="https://wa.me/${whatsappPhone}" target="_blank">WhatsApp Gönder</a>
        <div class="action-btns">
          <button class="edit-btn" onclick="editCustomer(${customer.id})">Düzenle</button>
          <button class="delete-btn" onclick="deleteCustomer(${customer.id})">Sil</button>
        </div>
      </div>
    `;
  });

  list.innerHTML = htmlContent || "<p>Aranan kriterde müşteri bulunamadı.</p>";
}

function editCustomer(id){
  const customer = customers.find(c=>c.id === id);
  if(!customer) return;

  const newName = prompt("Ad Soyad:", customer.name);
  if(newName === null || newName.trim() === "") return;

  const newPhone = prompt("Telefon:", customer.phone);
  if(newPhone === null || newPhone.trim() === "") return;

  const newDemand = prompt("Müşteri Talebi:", customer.demand);
  if(newDemand === null || newDemand.trim() === "") return;

  const newNote = prompt("Not:", customer.note);

  customer.name = newName.trim();
  customer.phone = newPhone.trim();
  customer.demand = newDemand.trim();
  if(newNote !== null) customer.note = newNote.trim();

  saveData();
  renderCustomers();
  renderMatches();
  updateMatchOptions();

  alert("Müşteri bilgileri ve talebi güncellendi.");
}

function deleteCustomer(id){
  if(!confirm("Müşteri silinsin mi?")) return;

  customers = customers.filter(c=>c.id !== id);
  matches = matches.filter(m => m.customerId !== id);

  saveData();
  renderCustomers();
  renderMatches();
  updateMatchOptions();

  alert("Müşteri ve ilgili eşleştirmeleri silindi.");
}

/* ==========================================================================
   MATCH (EŞLEŞTİRME) İŞLEMLERİ
   ========================================================================== */

function updateMatchOptions(){
  const customerSelect = document.getElementById("matchCustomer");
  const portfolioSelect = document.getElementById("matchPortfolio");

  if(!customerSelect || !portfolioSelect) return;

  customerSelect.innerHTML = customers.map(c => `
    <option value="${c.id}">${c.name} (Talep: ${c.demand})</option>
  `).join('');
  
  portfolioSelect.innerHTML = portfolios.map(p => `
    <option value="${p.id}">${p.title} - ${p.price.toLocaleString('tr-TR')} TL</option>
  `).join('');
}

function addMatch(){
  const customerSelect = document.getElementById("matchCustomer");
  const portfolioSelect = document.getElementById("matchPortfolio");

  if(!customerSelect || !portfolioSelect || customerSelect.value === "" || portfolioSelect.value === "") {
    alert("Önce müşteri ve portföy eklemelisiniz.");
    return;
  }

  const customerId = parseInt(customerSelect.value);
  const portfolioId = parseInt(portfolioSelect.value);

  const isExist = matches.some(m => m.customerId === customerId && m.portfolioId === portfolioId);
  if(isExist) {
    alert("Bu eşleştirme zaten mevcut!");
    return;
  }

  matches.push({
    id: Date.now(),
    customerId,
    portfolioId
  });

  saveData();
  renderMatches();

  alert("Talebe göre eşleştirme yapıldı.");
}

function renderMatches(){
  const list = document.getElementById("matchList");
  if(!list) return;

  const searchKey = document.getElementById("matchSearch")?.value.toLowerCase() || "";
  let htmlContent = "";

  matches.forEach(match=>{
    const customer = customers.find(c => c.id === match.customerId);
    const portfolio = portfolios.find(p => p.id === match.portfolioId);

    if(customer && portfolio) {
      const matchText = (customer.name + " " + customer.demand + " " + portfolio.title).toLowerCase();
      
      if(matchText.includes(searchKey)) {
        htmlContent += `
          <div class="match-item">
            <h3>Müşteri: ${customer.name}</h3>
            <p style="margin-top:5px;"><strong>Müşteri Talebi:</strong> <span class="demand-badge">${customer.demand}</span></p>
            <p style="margin-top:5px;">Eşleşen İlan: <strong>${portfolio.title}</strong></p>
            <p style="margin-top:5px;">İlan Fiyatı: ${portfolio.price.toLocaleString('tr-TR')} TL</p>
            <div class="action-btns">
              <button class="edit-btn" onclick="editMatch(${match.id})">Değiştir</button>
              <button class="delete-btn" onclick="deleteMatch(${match.id})">Kaldır</button>
            </div>
          </div>
        `;
      }
    }
  });

  list.innerHTML = htmlContent || "<p>Eşleşme bulunamadı veya arama kriterine uyan sonuç yok.</p>";
}

function editMatch(matchId) {
  const match = matches.find(m => m.id === matchId);
  if(!match) return;

  const choice = prompt("Neyi değiştirmek istersiniz? \n1 - Müşteriyi Değiştir \n2 - İlanı Değiştir", "1");
  
  if(choice === "1") {
    let listStr = customers.map((c, index) => `${index + 1} - ${c.name} (${c.demand})`).join("\n");
    const selectedIndex = prompt("Yeni Müşteri Numarasını Seçin:\n" + listStr);
    if(selectedIndex && customers[selectedIndex - 1]) {
      match.customerId = customers[selectedIndex - 1].id;
      alert("Eşleşen müşteri güncellendi.");
    }
  } else if(choice === "2") {
    let listStr = portfolios.map((p, index) => `${index + 1} - ${p.title}`).join("\n");
    const selectedIndex = prompt("Yeni İlan Numarasını Seçin:\n" + listStr);
    if(selectedIndex && portfolios[selectedIndex - 1]) {
      match.portfolioId = portfolios[selectedIndex - 1].id;
      alert("Eşleşen ilan güncellendi.");
    }
  }

  saveData();
  renderMatches();
}

function deleteMatch(matchId) {
  if(!confirm("Bu eşleştirmeyi kaldırmak istediğinize emin misiniz?")) return;
  matches = matches.filter(m => m.id !== matchId);
  saveData();
  renderMatches();
  alert("Eşleşme kaldırıldı.");
}

/* ==========================================================================
   FOTOĞRAFI BÜYÜTME (LIGHTBOX MODAL) FONKSİYONLARI
   ========================================================================== */
function openImageModal(imgSrc) {
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalTargetImg");
  if(modal && modalImg) {
    modal.style.display = "block";
    modalImg.src = imgSrc;
  }
}

function closeImageModal() {
  const modal = document.getElementById("imageModal");
  if(modal) {
    modal.style.display = "none";
  }
}

/* ==========================================================================
   UYGULAMA BAŞLANGICI VE DİNAMİK FİLTRELEME DİNLEYİCİLERİ
   ========================================================================== */
document.addEventListener("DOMContentLoaded", ()=>{
  renderPortfolios();
  renderCustomers();
  renderMatches();
  updateMatchOptions();
  updateDashboard();

  document.getElementById("portfolioSearch")?.addEventListener("input", renderPortfolios);
  document.getElementById("portfolioMinPrice")?.addEventListener("input", renderPortfolios);
  document.getElementById("portfolioMaxPrice")?.addEventListener("input", renderPortfolios);
  document.getElementById("customerSearch")?.addEventListener("input", renderCustomers);
  document.getElementById("matchSearch")?.addEventListener("input", renderMatches);
});
