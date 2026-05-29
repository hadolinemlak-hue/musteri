let portfolios = JSON.parse(localStorage.getItem("portfolios")) || [];
let customers = JSON.parse(localStorage.getItem("customers")) || [];
let matches = JSON.parse(localStorage.getItem("matches")) || [];

// Aktif Galeri Hafızası (Sahibinden Kaydırma Özelliği İçin)
let currentGalleryImages = [];
let currentGalleryIndex = 0;

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
   FOTOĞRAF OPTİMİZASYON (KÜÇÜLTÜCÜ) İŞLEMİ
   ========================================================================== */
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

  if(title
