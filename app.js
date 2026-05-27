let editingId = null;
/* =========================
   IOS FIX
========================= */

document.addEventListener(
  "touchstart",
  function(){},
  { passive:true }
);

/* =========================
   STATE
========================= */

const state = {
  portfolio:[]
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

function toast(text){

  const wrap = document.getElementById("toastWrap");

  const el = document.createElement("div");

  el.className = "toast";

  el.innerText = text;

  wrap.appendChild(el);

  setTimeout(() => {

    el.remove();

  }, 2200);

}

/* =========================
   STORAGE
========================= */

function saveDB(){

  localStorage.setItem(
    "emlakcrm",
    JSON.stringify(state)
  );

}

function loadDB(){

  const raw = localStorage.getItem("emlakcrm");

  if(raw){

    const parsed = JSON.parse(raw);

    state.portfolio = parsed.portfolio || [];

  }

}

/* =========================
   MODAL
========================= */

function openModal(){

  modal.classList.add("open");

  document.body.style.overflow = "hidden";

}

function closeModal(){

  modal.classList.remove("open");

  document.body.style.overflow = "auto";

}

/* =========================
   RENDER
========================= */

function render(){

  portfolioList.innerHTML = "";

  const q = searchInput.value.toLowerCase();

  const filtered = state.portfolio.filter(item => {

    return (
      item.title.toLowerCase().includes(q)
      ||
      item.city.toLowerCase().includes(q)
    );

  });

  document.getElementById(
    "portfolioCount"
  ).innerText = state.portfolio.length;

  if(filtered.length === 0){

    portfolioList.innerHTML = `
    
      <div class="card">
      
        <div class="info">
        
          <div class="title">
            Henüz ilan yok
          </div>
          
          <div class="meta">
            + butonuna basarak ekleyin
          </div>
        
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

        <img
          src="${item.photo || "https://placehold.co/600x400"}"
        >

      </div>

      <div class="info">

        <div class="title">
          ${item.title}
        </div>

        <div class="meta">
          ${item.city || "-"}
        </div>

        <div class="price">
          ${Number(item.price).toLocaleString("tr-TR")} ₺
        </div>
        <div class="row">

  <button
    class="btn btn-primary edit-btn"
    data-id="${item.id}"
  >
    Düzenle
  </button>

  <button
    class="btn btn-secondary delete-btn"
    data-id="${item.id}"
  >
    Sil
  </button>

</div>


    portfolioList.appendChild(card);

  });

  bindDeleteButtons();

}

/* =========================
   DELETE
========================= */

function bindDeleteButtons(){

  const buttons = document.querySelectorAll(".delete-btn");

  buttons.forEach(btn => {

    btn.addEventListener(
      "click",
      function(e){

        e.preventDefault();

        const id = Number(
          btn.dataset.id
        );

        const ok = confirm(
          "İlan silinsin mi?"
        );

        if(!ok) return;

        state.portfolio =
          state.portfolio.filter(
            x => x.id !== id
          );

        saveDB();

        render();

        toast("İlan silindi");

      }
    );

  });

}

/* =========================
   PHOTO
========================= */

photoInput.addEventListener(
  "change",
  function(e){

    const file = e.target.files[0];

    if(!file) return;

    const reader = new FileReader();

    reader.onload = function(ev){

      currentPhoto = ev.target.result;

      document.getElementById(
        "preview"
      ).innerHTML = `
      
        <img src="${currentPhoto}">
      
      `;

    };

    reader.readAsDataURL(file);

  }
);

/* =========================
   SAVE
========================= */

saveBtn.addEventListener(
  "click",
  function(){

    const title =
      document.getElementById(
        "titleInput"
      ).value.trim();

    const price =
      document.getElementById(
        "priceInput"
      ).value.trim();

    const city =
      document.getElementById(
        "cityInput"
      ).value.trim();

    if(!title || !price){

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

if(editingId){

  const index =
    state.portfolio.findIndex(
      x => x.id === editingId
    );

  state.portfolio[index] = itemData;

  toast("Portföy güncellendi");

}else{

  state.portfolio.unshift(itemData);

  toast("Portföy kaydedildi");

}

    saveDB();

    render();

    closeModal();

    document.getElementById(
      "titleInput"
    ).value = "";

    document.getElementById(
      "priceInput"
    ).value = "";

    document.getElementById(
      "cityInput"
    ).value = "";

    document.getElementById(
      "preview"
    ).innerHTML = "";

    currentPhoto = "";

    toast("İlan kaydedildi");

  }
);

/* =========================
   SEARCH
========================= */

searchInput.addEventListener(
  "input",
  render
);

/* =========================
   FAB
========================= */

fabBtn.addEventListener(
  "click",
  function(e){

    e.preventDefault();

    openModal();

  }
);

fabBtn.addEventListener(
  "touchend",
  function(e){

    e.preventDefault();

    openModal();

  }
);

/* =========================
   CLOSE
========================= */

closeModalBtn.addEventListener(
  "click",
  function(){

    closeModal();

  }
);

/* =========================
   MODAL BACKGROUND
========================= */

modal.addEventListener(
  "click",
  function(e){

    if(e.target === modal){

      closeModal();

    }

  }
);

/* =========================
   NAV BUTTONS IOS FIX
========================= */

const navButtons =
  document.querySelectorAll(".nav-btn");

navButtons.forEach(btn => {

  btn.addEventListener(
    "click",
    function(){

      navButtons.forEach(x => {

        x.classList.remove("active");

      });

      btn.classList.add("active");

      toast(
        btn.innerText.trim()
      );

    }
  );

});

/* =========================
   START
========================= */

window.addEventListener(
  "load",
  function(){

    loadDB();

    render();

    toast("Emlak CRM hazır");

  }
);
