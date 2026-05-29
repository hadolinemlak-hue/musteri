let portfolios = JSON.parse(localStorage.getItem("portfolios")) || [];
let customers = JSON.parse(localStorage.getItem("customers")) || [];
let matches = JSON.parse(localStorage.getItem("matches")) || [];

function showSection(id){
  document.querySelectorAll("section").forEach(section=>{
    section.classList.remove("active");
  });
  const target = document.getElementById(id);
  if(target) target.classList.add("active");
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
      const base64 = await convertToBase64(files[i]);
      images.push(base64);
    } catch(e) {
      console.error("Dosya yüklenirken hata:", e);
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

function convertToBase64(file){
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
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
    let imagesHTML = item.images.map(img => `<img src="${img}" alt="">`).join('');

    htmlContent += `
      <div class="portfolio-item">
        <h3>${item.title}</h3>
        <p><strong>Fiyat:</strong> ${item.price.toLocaleString('tr-TR')} TL</p>
        <p>${item.description}</p>
        <div class="images">${imagesHTML}</div>
        <button onclick="editPortfolio(${item.id})">Düzenle</button>
        <button onclick="deletePortfolio(${item.id})">Sil</button>
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
   CUSTOMER (MÜŞTERİ) İŞLEMLERİ (TALEP ALANI DAHİL EDİLDİ)
   ========================================================================== */

function addCustomer(){
  const nameInput = document.getElementById("customerName");
  const phoneInput = document.getElementById("customerPhone");
  const demandInput = document.getElementById("customerDemand"); // Yeni alan
  const noteInput = document.getElementById("customerNote");

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const demand = demandInput.value.trim(); // Yeni alan
  const note = noteInput.value.trim();

  if(name === "" || phone === "" || demand === ""){
    alert("Ad, telefon ve talep alanları zorunludur.");
    return;
  }

  customers.push({
    id: Date.now(),
    name,
    phone,
    demand, // Yeni alan kaydediliyor
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

// MÜŞTERİ LİSTELEME VE FİLTRELEME
function renderCustomers(){
  const list = document.getElementById("customerList");
  if(!list) return;

  // Arama kutusuna yazılan kelime
  const searchKey = document.getElementById("customerSearch")?.value.toLowerCase() || "";

  let htmlContent = "";

  // Filtreleme: İsim, Talep veya Not alanlarından herhangi birinde geçiyorsa getir
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
        <p><strong>Talep:</strong> <span style="color: #2c3e50; font-weight: bold;">${customer.demand}</span></p> <a class="phone-link" href="tel:${callPhone}">📞 ${customer.phone}</a>
        <p><strong>Not:</strong> ${customer.note || '-'}</p>
        <a class="whatsapp-btn" href="https://wa.me/${whatsappPhone}" target="_blank">WhatsApp Gönder</a>
        <button onclick="editCustomer(${customer.id})">Düzenle</button>
        <button onclick="deleteCustomer(${customer.id})">Sil</button>
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

  const newDemand = prompt("Müşteri Talebi:", customer.demand); // Yeni alan düzenleme
  if(newDemand === null || newDemand.trim() === "") return;

  const newNote = prompt("Not:", customer.note);

  customer.name = newName.trim();
  customer.phone = newPhone.trim();
  customer.demand = newDemand.trim(); // Yeni alan güncelleniyor
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
   MATCH (EŞLEŞTİRME) İŞLEMLERİ (TALEBE GÖRE SEÇİM VE ARAMA)
   ========================================================================== */

function updateMatchOptions(){
  const customerSelect = document.getElementById("matchCustomer");
  const portfolioSelect = document.getElementById("matchPortfolio");

  if(!customerSelect || !portfolioSelect) return;

  // Select kutusunda müşterinin sadece adını değil, TALEBİNİ de gösteriyoruz ki eşleştirmek kolay olsun.
  customerSelect.innerHTML = customers.map(c => `
    <option value="${c.id}">${c.name} (Talep: ${c.demand})</option>
  `).join('');
  
  portfolioSelect.innerHTML = portfolios.map(p => `
    <option value="${p.id}">${p.title}</option>
  `).join('');
}

function addMatch(){
  const customerId = parseInt(document.getElementById("matchCustomer").value);
  const portfolioId = parseInt(document.getElementById("matchPortfolio").value);

  if(!customerId || !portfolioId){
    alert("Eşleştirme yapabilmek için müşteri ve ilan seçilmelidir.");
    return;
  }

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

// EŞLEŞTİRME LİSTELEME VE FİLTRELEME
function renderMatches(){
  const list = document.getElementById("matchList");
  if(!list) return;

  const searchKey = document.getElementById("matchSearch")?.value.toLowerCase() || "";
  let htmlContent = "";

  matches.forEach(match=>{
    const customer = customers.find(c => c.id === match.customerId);
    const portfolio = portfolios.find(p => p.id === match.portfolioId);

    if(customer && portfolio) {
      // Eşleştirme listesinde arama yaparken müşteri adına, talebine veya ilan başlığına bakıyoruz
      const matchText = (customer.name + " " + customer.demand + " " + portfolio.title).toLowerCase();
      
      if(matchText.includes(searchKey)) {
        htmlContent += `
          <div class="match-item">
            <h3>Müşteri: ${customer.name}</h3>
            <p><strong>Müşteri Talebi:</strong> <span style="color: #d35400;">${customer.demand}</span></p> <p>Eşleşen İlan: <strong>${portfolio.title}</strong></p>
            <p>İlan Fiyatı: ${portfolio.price.toLocaleString('tr-TR')} TL</p>
            <button onclick="editMatch(${match.id})">Eşleşmeyi Düzenle</button>
            <button onclick="deleteMatch(${match.id})">Eşleşmeyi Kaldır</button>
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
    // Seçim ekranında talepleri de gösteriyoruz
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
   UYGULAMA BAŞLANGICI VE DİNAMİK FİLTRELEME DİNLEYİCİLERİ
   ========================================================================== */

document.addEventListener("DOMContentLoaded", ()=>{
  renderPortfolios();
  renderCustomers();
  renderMatches();
  updateMatchOptions();
  updateDashboard();

  // Canlı (Real-time) Filtreleme Dinleyicileri
  document.getElementById("portfolioSearch")?.addEventListener("input", renderPortfolios);
  document.getElementById("portfolioMinPrice")?.addEventListener("input", renderPortfolios);
  document.getElementById("portfolioMaxPrice")?.addEventListener("input", renderPortfolios);

  // Müşteri arama kutusuna yazıldığında (Hem isme hem talebe göre arar)
  document.getElementById("customerSearch")?.addEventListener("input", renderCustomers);

  // Eşleştirme arama kutusuna yazıldığında
  document.getElementById("matchSearch")?.addEventListener("input", renderMatches);
});
