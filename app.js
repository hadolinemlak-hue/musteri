let editingId = null;

/* =========================
   IOS FIX
========================= */
document.addEventListener("touchstart", function () {}, { passive: true });

/* =========================
   STATE
========================= */
const state = {
  portfolio: []
};

let currentPhoto = "";

/* =========================
   ELEMENTS
========================= */
const modal = document.getElementById("modal");
const portfolioList = document.getElementById("portfolioList");
const fabBtn = document.getElementById("fabBtn");
const closeModalBtn = document.getElementById("closeModal");
const saveBtn = document.getElementById("saveBtn");
const photoInput = document.getElementById("photoInput");
const searchInput = document.getElementById("searchInput");

/* =========================
   TOAST
========================= */
function toast(text) {
  const wrap = document.getElementById("toastWrap");

  const el = document.createElement("div");
  el.className = "toast";
  el.innerText = text;

  wrap.appendChild(el);

  setTimeout(() => el.remove(), 2000);
}

/* =========================
   STORAGE
========================= */
function saveDB() {
  localStorage.setItem("emlakcrm", JSON.stringify(state));
}

function loadDB() {
  const raw = localStorage.getItem("emlakcrm");
  if (raw) {
    const parsed = JSON.parse(raw);
    state.portfolio = parsed.portfolio || [];
  }
}

/* =========================
   MODAL
========================= */
function openModal() {
  modal.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.remove("open");
  document.body.style.overflow = "auto";
}

/* =========================
   RENDER
========================= */
function render() {
  portfolioList.innerHTML = "";

  const q = searchInput.value.toLowerCase();

  const filtered = state.portfolio.filter((item) =>
    item.title.toLowerCase().includes(q) ||
    item.city.toLowerCase().includes(q)
  );

  document.getElementById("portfolioCount").innerText =
    state.portfolio.length;

  if (filtered.length === 0) {
    portfolioList.innerHTML = `
      <div class="card">
        <div class="info">
          <div class="title">Henüz ilan yok</div>
          <div class="meta">+ butonuna basarak ekleyin</div>
        </div>
      </div>
    `;
    return;
  }

  filtered.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="thumb">
        <img src="${item.photo || "https://placehold.co/600x400"}" />
      </div>

      <div class="info">
        <div class="title">${item.title}</div>
        <div class="meta">${item.city || "-"}</div>
        <div class="price">${Number(item.price).toLocaleString("tr-TR")} ₺</div>

        <div class="row">
          <button class="btn btn-primary edit-btn" data-id="${item.id}">
            Düzenle
          </button>

          <button class="btn btn-secondary delete-btn" data-id="${item.id}">
            Sil
          </button>
        </div>
      </div>
    `;

    portfolioList.appendChild(card);
  });

  bindActions();
}

/* =========================
   EVENT DELEGATION (FIX)
========================= */
function bindActions() {
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.onclick = function () {
      const id = Number(this.dataset.id);

      if (!confirm("İlan silinsin mi?")) return;

      state.portfolio = state.portfolio.filter((x) => x.id !== id);
      saveDB();
      render();
      toast("İlan silindi");
    };
  });

  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.onclick = function () {
      const id = Number(this.dataset.id);

      const item = state.portfolio.find((x) => x.id === id);
      if (!item) return;

      editingId = id;

      document.getElementById("titleInput").value = item.title;
      document.getElementById("priceInput").value = item.price;
      document.getElementById("cityInput").value = item.city;

      currentPhoto = item.photo || "";

      document.getElementById("preview").innerHTML = currentPhoto
        ? `<img src="${currentPhoto}">`
        : "";

      openModal();
    };
  });
}

/* =========================
   PHOTO
========================= */
photoInput.addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (ev) {
    currentPhoto = ev.target.result;

    document.getElementById("preview").innerHTML = `
      <img src="${currentPhoto}">
    `;
  };

  reader.readAsDataURL(file);
});

/* =========================
   SAVE (FIXED - DUPLICATE REMOVED)
========================= */
saveBtn.addEventListener("click", function () {
  const title = document.getElementById("titleInput").value.trim();
  const price = document.getElementById("priceInput").value.trim();
  const city = document.getElementById("cityInput").value.trim();

  if (!title || !price) {
    toast("Başlık ve fiyat gerekli");
    return;
  }

  const itemData = {
    id: editingId || Date.now(),
    title,
    price,
    city,
    photo: currentPhoto
  };

  if (editingId) {
    const index = state.portfolio.findIndex((x) => x.id === editingId);
    state.portfolio[index] = itemData;
    toast("Portföy güncellendi");
  } else {
    state.portfolio.unshift(itemData);
    toast("Portföy eklendi");
  }

  saveDB();
  render();
  closeModal();

  editingId = null;
  currentPhoto = "";

  document.getElementById("titleInput").value = "";
  document.getElementById("priceInput").value = "";
  document.getElementById("cityInput").value = "";
  document.getElementById("preview").innerHTML = "";
});

/* =========================
   SEARCH
========================= */
searchInput.addEventListener("input", render);

/* =========================
   FAB (FIX iOS)
========================= */
fabBtn.addEventListener("click", openModal);
fabBtn.addEventListener("touchend", function (e) {
  e.preventDefault();
  openModal();
});

/* =========================
   CLOSE MODAL
========================= */
closeModalBtn.addEventListener("click", closeModal);

modal.addEventListener("click", function (e) {
  if (e.target === modal) closeModal();
});

/* =========================
   NAV
========================= */
document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", function () {
    document.querySelectorAll(".nav-btn").forEach((x) =>
      x.classList.remove("active")
    );

    this.classList.add("active");
    toast(this.innerText.trim());
  });
});

/* =========================
   START
========================= */
window.addEventListener("load", function () {
  loadDB();
  render();
  toast("Emlak CRM hazır");
});
