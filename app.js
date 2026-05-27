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
const preview = document.getElementById("preview");

/* =========================
   TOAST
========================= */
function toast(text) {
  const wrap = document.getElementById("toastWrap");

  const el = document.createElement("div");
  el.className = "toast";
  el.innerText = text;

  wrap.appendChild(el);

  setTimeout(() => el.remove(), 2200);
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

  editingId = null;
  currentPhoto = "";
  preview.innerHTML = "";

  document.getElementById("titleInput").value = "";
  document.getElementById("priceInput").value = "";
  document.getElementById("cityInput").value = "";
}

/* =========================
   RENDER
========================= */
function render() {
  portfolioList.innerHTML = "";

  const q = searchInput.value.toLowerCase();

  const filtered = state.portfolio.filter(item => {
    return (
      item.title.toLowerCase().includes(q) ||
      item.city.toLowerCase().includes(q)
    );
  });

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

  filtered.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="thumb">
        <img src="${item.photo || "https://placehold.co/600x400"}">
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

  bindDeleteButtons();
  bindEditButtons();
}

/* =========================
   DELETE
========================= */
function bindDeleteButtons() {
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.onclick = () => {
      const id = Number(btn.dataset.id);

      if (!confirm("İlan silinsin mi?")) return;

      state.portfolio = state.portfolio.filter(x => x.id !== id);

      saveDB();
      render();
      toast("İlan silindi");
    };
  });
}

/* =========================
   EDIT
========================= */
function bindEditButtons() {
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.onclick = () => {
      const id = Number(btn.dataset.id);

      const item = state.portfolio.find(x => x.id === id);
      if (!item) return;

      editingId = id;

      document.getElementById("titleInput").value = item.title;
      document.getElementById("priceInput").value = item.price;
      document.getElementById("cityInput").value = item.city;

      currentPhoto = item.photo || "";

      if (currentPhoto) {
        preview.innerHTML = `<img src="${currentPhoto}">`;
      }

      openModal();
    };
  });
}

/* =========================
   PHOTO
========================= */
photoInput.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = ev => {
    currentPhoto = ev.target.result;

    preview.innerHTML = `<img src="${currentPhoto}">`;
  };

  reader.readAsDataURL(file);
});

/* =========================
   SAVE (FIXED - TEK VERSION)
========================= */
saveBtn.addEventListener("click", () => {
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
    const index = state.portfolio.findIndex(x => x.id === editingId);
    if (index !== -1) state.portfolio[index] = itemData;
    toast("Güncellendi");
  } else {
    state.portfolio.unshift(itemData);
    toast("Kaydedildi");
  }

  saveDB();
  render();
  closeModal();
});

/* =========================
   FAB
========================= */
fabBtn.addEventListener("click", openModal);

/* =========================
   CLOSE
========================= */
closeModalBtn.addEventListener("click", closeModal);

modal.addEventListener("click", e => {
  if (e.target === modal) closeModal();
});

/* =========================
   SEARCH
========================= */
searchInput.addEventListener("input", render);

/* =========================
   START
========================= */
window.addEventListener("load", () => {
  loadDB();
  render();
  toast("Emlak CRM hazır");
});
