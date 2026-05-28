let editingId = null;
let editingCustomerId = null;
let currentPhoto = "";
let currentPage = "portfolio";

const state = {
  portfolio: [],
  customers: [],
  matches: []
};

const modal = document.getElementById("modal");
const customerModal = document.getElementById("customerModal");
const portfolioList = document.getElementById("portfolioList");
const customerList = document.getElementById("customerList");
const matchList = document.getElementById("matchList");

function toast(text) {
  const wrap = document.getElementById("toastWrap");
  const el = document.createElement("div");
  el.className = "toast";
  el.innerText = text;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

function saveDB() {
  localStorage.setItem("emlakcrm", JSON.stringify(state));
}

function loadDB() {
  const raw = localStorage.getItem("emlakcrm");
  if (raw) {
    const parsed = JSON.parse(raw);
    state.portfolio = parsed.portfolio || [];
    state.customers = parsed.customers || [];
    state.matches = parsed.matches || [];
  }
}

function updateStats() {
  document.getElementById("portfolioCount").innerText = state.portfolio.length;
  document.getElementById("customerCount").innerText = state.customers.length;
}

// PORTFOLIO FUNCTIONS
function openModal() {
  modal.classList.add("open");
}

function closeModal() {
  modal.classList.remove("open");
  editingId = null;
  currentPhoto = "";
  document.getElementById("titleInput").value = "";
  document.getElementById("priceInput").value = "";
  document.getElementById("cityInput").value = "";
  document.getElementById("descInput").value = "";
  document.getElementById("preview").innerHTML = "";
}

function renderPortfolio() {
  portfolioList.innerHTML = "";
  updateStats();

  const q = document.getElementById("searchInput").value.toLowerCase();
  const filtered = state.portfolio.filter(item => 
    item.title.toLowerCase().includes(q) || item.city.toLowerCase().includes(q)
  );

  if (filtered.length === 0) {
    portfolioList.innerHTML = '<div class="empty">Henüz portföy yok</div>';
    return;
  }

  filtered.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="thumb">
        <img src="${item.photo || "https://via.placeholder.co/600x400?text=Emlak"}">
      </div>
      <div class="info">
        <div class="title">${item.title}</div>
        <div class="meta">${item.city}</div>
        <div class="price">${Number(item.price).toLocaleString("tr-TR")} ₺</div>
        ${item.desc ? `<div class="meta" style="margin-bottom: 12px;">${item.desc}</div>` : ''}
        <div class="row">
          <button class="btn btn-primary edit-btn" data-id="${item.id}">Düzenle</button>
          <button class="btn btn-secondary delete-btn" data-id="${item.id}">Sil</button>
        </div>
      </div>
    `;
    portfolioList.appendChild(card);
  });

  bindPortfolioButtons();
}

function bindPortfolioButtons() {
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.onclick = function() {
      const id = Number(this.dataset.id);
      if (!confirm("Silinsin mi?")) return;
      state.portfolio = state.portfolio.filter(x => x.id !== id);
      saveDB();
      renderPortfolio();
      renderMatches();
      toast("İlan silindi");
    };
  });

  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.onclick = function() {
      const id = Number(this.dataset.id);
      const item = state.portfolio.find(x => x.id === id);
      if (!item) return;

      editingId = id;
      document.getElementById("modalTitle").innerText = "İlanı Düzenle";
      document.getElementById("titleInput").value = item.title;
      document.getElementById("priceInput").value = item.price;
      document.getElementById("cityInput").value = item.city;
      document.getElementById("descInput").value = item.desc || "";
      currentPhoto = item.photo || "";

      if (currentPhoto) {
        document.getElementById("preview").innerHTML = `<img src="${currentPhoto}">`;
      }

      openModal();
    };
  });
}

// CUSTOMER FUNCTIONS
function openCustomerModal() {
  customerModal.classList.add("open");
  editingCustomerId = null;
  document.getElementById("customerModalTitle").innerText = "Yeni Müşteri";
  document.getElementById("customerName").value = "";
  document.getElementById("customerPhone").value = "";
  document.getElementById("customerEmail").value = "";
  document.getElementById("customerBudget").value = "";
  document.getElementById("customerPreferences").value = "";
}

function closeCustomerModal() {
  customerModal.classList.remove("open");
  editingCustomerId = null;
}

function renderCustomers() {
  customerList.innerHTML = "";
  updateStats();

  if (state.customers.length === 0) {
    customerList.innerHTML = '<div class="empty">Henüz müşteri eklenmedi</div>';
    return;
  }

  state.customers.forEach(customer => {
    const card = document.createElement("div");
    card.className = "customer-card";
    card.innerHTML = `
      <div class="customer-name">${customer.name}</div>
      ${customer.phone ? `<div class="customer-phone"><i class="fa-solid fa-phone"></i>${customer.phone}</div>` : ''}
      ${customer.email ? `<div class="customer-phone"><i class="fa-solid fa-envelope"></i>${customer.email}</div>` : ''}
      ${customer.budget ? `<div class="customer-phone"><i class="fa-solid fa-wallet"></i>Bütçe: ${Number(customer.budget).toLocaleString("tr-TR")} ₺</div>` : ''}
      ${customer.preferences ? `<div class="meta" style="margin-top: 8px; padding: 8px; background: #111827; border-radius: 8px; font-size: 13px;">${customer.preferences}</div>` : ''}
      <div class="customer-actions" style="margin-top: 12px;">
        <button class="btn btn-primary edit-customer-btn" data-id="${customer.id}" style="font-size: 13px; padding: 8px;">Düzenle</button>
        <button class="btn btn-secondary delete-customer-btn" data-id="${customer.id}" style="font-size: 13px; padding: 8px;">Sil</button>
      </div>
    `;
    customerList.appendChild(card);
  });

  bindCustomerButtons();
}

function bindCustomerButtons() {
  document.querySelectorAll(".delete-customer-btn").forEach(btn => {
    btn.onclick = function() {
      const id = Number(this.dataset.id);
      if (!confirm("Müşteri silinsin mi?")) return;
      state.customers = state.customers.filter(x => x.id !== id);
      saveDB();
      renderCustomers();
      renderMatches();
      toast("Müşteri silindi");
    };
  });

  document.querySelectorAll(".edit-customer-btn").forEach(btn => {
    btn.onclick = function() {
      const id = Number(this.dataset.id);
      const customer = state.customers.find(x => x.id === id);
      if (!customer) return;

      editingCustomerId = id;
      document.getElementById("customerModalTitle").innerText = "Müşteriyi Düzenle";
      document.getElementById("customerName").value = customer.name;
      document.getElementById("customerPhone").value = customer.phone || "";
      document.getElementById("customerEmail").value = customer.email || "";
      document.getElementById("customerBudget").value = customer.budget || "";
      document.getElementById("customerPreferences").value = customer.preferences || "";

      openCustomerModal();
    };
  });
}

function renderMatches() {
  // Dropdown'ları doldur
  const customerSelect = document.getElementById("matchCustomerSelect");
  const propertySelect = document.getElementById("matchPropertySelect");

  if (customerSelect) {
    customerSelect.innerHTML = '<option value="">-- Müşteri Seçin --</option>';
    state.customers.forEach(c => {
      customerSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    });
  }

  if (propertySelect) {
    propertySelect.innerHTML = '<option value="">-- İlan Seçin --</option>';
    state.portfolio.forEach(p => {
      propertySelect.innerHTML += `<option value="${p.id}">${p.title} - ${p.city}</option>`;
    });
  }

  // Mevcut eşleşmeleri göster
  matchList.innerHTML = "";
  
  if (state.matches.length === 0) {
    matchList.innerHTML = '<div class="empty">Henüz eşleşme yok</div>';
    return;
  }

  state.matches.forEach(match => {
    const customer = state.customers.find(c => c.id === match.customerId);
    const property = state.portfolio.find(p => p.id === match.propertyId);

    if (!customer || !property) return;

    const matchDiv = document.createElement("div");
    matchDiv.className = "match-item";
    matchDiv.innerHTML = `
      <div class="match-customer"><i class="fa-solid fa-check-circle" style="color: #10b981;"></i>${customer.name}</div>
      <div class="match-property">
        <div class="match-title">📍 ${property.title}</div>
        <div style="opacity: 0.7; font-size: 12px; margin-top: 4px;">${property.city}</div>
        <div class="match-price">${Number(property.price).toLocaleString("tr-TR")} ₺</div>
        ${customer.budget ? `<div style="opacity: 0.6; font-size: 12px; margin-top: 6px;">Bütçe: ${Number(customer.budget).toLocaleString("tr-TR")} ₺</div>` : ''}
      </div>
      <button class="btn btn-secondary" style="width: 100%; margin-top: 12px; font-size: 13px; padding: 8px;" onclick="deleteMatch(${match.id})">Eşleştirmeyi Sil</button>
    `;
    matchList.appendChild(matchDiv);
  });
}

function deleteMatch(matchId) {
  if (!confirm("Eşleştirme silinsin mi?")) return;
  state.matches = state.matches.filter(m => m.id !== matchId);
  saveDB();
  renderMatches();
  toast("Eşleştirme silindi");
}

// EVENT LISTENERS - Portfolio
document.getElementById("photoInput").addEventListener("change", function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    currentPhoto = ev.target.result;
    document.getElementById("preview").innerHTML = `<img src="${currentPhoto}">`;
  };
  reader.readAsDataURL(file);
});

document.getElementById("saveBtn").addEventListener("click", function() {
  const title = document.getElementById("titleInput").value.trim();
  const price = document.getElementById("priceInput").value.trim();
  const city = document.getElementById("cityInput").value.trim();
  const desc = document.getElementById("descInput").value.trim();

  if (!title || !price || !city) {
    toast("Başlık, fiyat ve şehir gerekli");
    return;
  }

  const item = {
    id: editingId || Date.now(),
    title,
    price,
    city,
    desc,
    photo: currentPhoto
  };

  if (editingId) {
    const index = state.portfolio.findIndex(x => x.id === editingId);
    state.portfolio[index] = item;
    toast("İlan güncellendi");
  } else {
    state.portfolio.unshift(item);
    toast("İlan kaydedildi");
  }

  saveDB();
  renderPortfolio();
  renderMatches();
  closeModal();
});

document.getElementById("fabBtn").addEventListener("click", function() {
  if (currentPage === "customer") {
    openCustomerModal();
  } else {
    editingId = null;
    currentPhoto = "";
    document.getElementById("modalTitle").innerText = "Yeni İlan";
    document.getElementById("titleInput").value = "";
    document.getElementById("priceInput").value = "";
    document.getElementById("cityInput").value = "";
    document.getElementById("descInput").value = "";
    document.getElementById("preview").innerHTML = "";
    openModal();
  }
});

document.getElementById("closeModal").addEventListener("click", closeModal);
document.getElementById("searchInput").addEventListener("input", renderPortfolio);

modal.addEventListener("click", function(e) {
  if (e.target === modal) closeModal();
});

// EVENT LISTENERS - Customer
document.getElementById("saveCustomerBtn").addEventListener("click", function() {
  const name = document.getElementById("customerName").value.trim();
  const phone = document.getElementById("customerPhone").value.trim();
  const email = document.getElementById("customerEmail").value.trim();
  const budget = document.getElementById("customerBudget").value.trim();
  const preferences = document.getElementById("customerPreferences").value.trim();

  if (!name) {
    toast("Müşteri adı gerekli");
    return;
  }

  const customer = {
    id: editingCustomerId || Date.now(),
    name,
    phone,
    email,
    budget,
    preferences
  };

  if (editingCustomerId) {
    const index = state.customers.findIndex(x => x.id === editingCustomerId);
    state.customers[index] = customer;
    toast("Müşteri güncellendi");
  } else {
    state.customers.unshift(customer);
    toast("Müşteri kaydedildi");
  }

  saveDB();
  renderCustomers();
  renderMatches();
  closeCustomerModal();
});

document.getElementById("closeCustomerModal").addEventListener("click", closeCustomerModal);

customerModal.addEventListener("click", function(e) {
  if (e.target === customerModal) closeCustomerModal();
});

// MATCH BUTTON
document.addEventListener("click", function(e) {
  if (e.target && e.target.id === "createMatchBtn") {
    const customerId = Number(document.getElementById("matchCustomerSelect").value);
    const propertyId = Number(document.getElementById("matchPropertySelect").value);

    if (!customerId || !propertyId) {
      toast("Müşteri ve İlan seçin");
      return;
    }

    // Zaten eşleşmiş mi kontrol et
    const exists = state.matches.find(m => m.customerId === customerId && m.propertyId === propertyId);
    if (exists) {
      toast("Bu eşleştirme zaten var");
      return;
    }

    state.matches.push({
      id: Date.now(),
      customerId,
      propertyId
    });

    saveDB();
    renderMatches();
    toast("Eşleştirme oluşturuldu ✓");
    document.getElementById("matchCustomerSelect").value = "";
    document.getElementById("matchPropertySelect").value = "";
  }
});

// NAVIGATION
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", function() {
    document.querySelectorAll(".nav-btn").forEach(x => x.classList.remove("active"));
    this.classList.add("active");

    const page = this.dataset.page;
    currentPage = page;
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

    if (page === "portfolio") {
      document.getElementById("portfolioPage").classList.add("active");
    } else if (page === "customer") {
      document.getElementById("customerPage").classList.add("active");
      renderCustomers();
    } else if (page === "match") {
      document.getElementById("matchPage").classList.add("active");
      renderMatches();
    }
  });
});

// INIT
window.addEventListener("load", function() {
  loadDB();
  renderPortfolio();
  toast("Emlak CRM hazır");
});
