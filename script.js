let portfolios = JSON.parse(localStorage.getItem("portfolios")) || [];
let customers = JSON.parse(localStorage.getItem("customers")) || [];
let matches = JSON.parse(localStorage.getItem("matches")) || [];

function showSection(id){

  document.querySelectorAll("section").forEach(section=>{
    section.classList.remove("active");
  });

  document.getElementById(id).classList.add("active");
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

  if(portfolioCount){
    portfolioCount.innerText = portfolios.length;
  }

  if(customerCount){
    customerCount.innerText = customers.length;
  }

  if(matchCount){
    matchCount.innerText = matches.length;
  }
}

/* PORTFOLIO */

async function addPortfolio(){

  const title = document.getElementById("title").value.trim();
  const price = document.getElementById("price").value.trim();
  const description = document.getElementById("description").value.trim();
  const files = document.getElementById("images").files;

  if(title === "" || price === ""){
    alert("Başlık ve fiyat zorunlu.");
    return;
  }

  if(files.length > 3){
    alert("En fazla 3 fotoğraf eklenebilir.");
    return;
  }

  let images = [];

  for(let i = 0; i < files.length; i++){

    const base64 = await convertToBase64(files[i]);
    images.push(base64);
  }

  portfolios.push({
    id:Date.now(),
    title,
    price,
    description,
    images
  });

  saveData();
  renderPortfolios();
  updateMatchOptions();

  document.getElementById("title").value = "";
  document.getElementById("price").value = "";
  document.getElementById("description").value = "";
  document.getElementById("images").value = "";

  alert("İlan başarıyla eklendi.");
}

function convertToBase64(file){

  return new Promise((resolve,reject)=>{

    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = ()=>{
      resolve(reader.result);
    };

    reader.onerror = error=>{
      reject(error);
    };
  });
}

function renderPortfolios(){

  const list = document.getElementById("portfolioList");

  if(!list) return;

  list.innerHTML = "";

  portfolios.forEach(item=>{

    let imagesHTML = "";

    item.images.forEach(img=>{

      imagesHTML += `
        <img src="${img}" alt="">
      `;
    });

    list.innerHTML += `
      <div class="portfolio-item">

        <h3>${item.title}</h3>

        <p><strong>Fiyat:</strong> ${item.price}</p>

        <p>${item.description}</p>

        <div class="images">
          ${imagesHTML}
        </div>

      </div>
    `;
  });
}

/* CUSTOMER */

function addCustomer(){

  const name = document.getElementById("customerName").value.trim();
  const phone = document.getElementById("customerPhone").value.trim();
  const note = document.getElementById("customerNote").value.trim();

  if(name === "" || phone === ""){
    alert("Ad ve telefon zorunludur.");
    return;
  }

  customers.push({
    id:Date.now(),
    name,
    phone,
    note
  });

  saveData();
  renderCustomers();
  updateMatchOptions();

  document.getElementById("customerName").value = "";
  document.getElementById("customerPhone").value = "";
  document.getElementById("customerNote").value = "";

  alert("Müşteri eklendi.");
}

function renderCustomers(){

  const list = document.getElementById("customerList");

  if(!list) return;

  list.innerHTML = "";

  customers.forEach(customer=>{

    const cleanPhone = customer.phone.replace(/\D/g,'');

    list.innerHTML += `
      <div class="customer-item">

        <h3>${customer.name}</h3>

        <a class="phone-link" href="tel:${cleanPhone}">
          📞 ${customer.phone}
        </a>

        <p>${customer.note}</p>

        <a
          class="whatsapp-btn"
          href="https://wa.me/90${cleanPhone}"
          target="_blank"
        >
          WhatsApp Gönder
        </a>

        <button onclick="editCustomer(${customer.id})">
          Düzenle
        </button>

        <button onclick="deleteCustomer(${customer.id})">
          Sil
        </button>

      </div>
    `;
  });
}

function editCustomer(id){

  const customer = customers.find(c=>c.id === id);

  const newName = prompt("Ad Soyad", customer.name);
  if(newName === null) return;

  const newPhone = prompt("Telefon", customer.phone);
  if(newPhone === null) return;

  const newNote = prompt("Not", customer.note);
  if(newNote === null) return;

  customer.name = newName;
  customer.phone = newPhone;
  customer.note = newNote;

  saveData();
  renderCustomers();
  updateMatchOptions();

  alert("Müşteri güncellendi.");
}

function deleteCustomer(id){

  const confirmDelete = confirm("Müşteri silinsin mi?");

  if(!confirmDelete) return;

  customers = customers.filter(c=>c.id !== id);

  saveData();
  renderCustomers();
  updateMatchOptions();

  alert("Müşteri silindi.");
}

/* MATCH */

function updateMatchOptions(){

  const customerSelect = document.getElementById("matchCustomer");
  const portfolioSelect = document.getElementById("matchPortfolio");

  if(!customerSelect || !portfolioSelect) return;

  customerSelect.innerHTML = "";
  portfolioSelect.innerHTML = "";

  customers.forEach(customer=>{

    customerSelect.innerHTML += `
      <option value="${customer.id}">
        ${customer.name}
      </option>
    `;
  });

  portfolios.forEach(portfolio=>{

    portfolioSelect.innerHTML += `
      <option value="${portfolio.id}">
        ${portfolio.title}
      </option>
    `;
  });
}

function addMatch(){

  const customerId = document.getElementById("matchCustomer").value;
  const portfolioId = document.getElementById("matchPortfolio").value;

  const customer = customers.find(c=>c.id == customerId);
  const portfolio = portfolios.find(p=>p.id == portfolioId);

  if(!customer || !portfolio){
    alert("Eşleştirme yapılamadı.");
    return;
  }

  matches.push({
    customerName:customer.name,
    portfolioTitle:portfolio.title
  });

  saveData();
  renderMatches();

  alert("Eşleştirme yapıldı.");
}

function renderMatches(){

  const list = document.getElementById("matchList");

  if(!list) return;

  list.innerHTML = "";

  matches.forEach(match=>{

    list.innerHTML += `
      <div class="match-item">

        <h3>${match.customerName}</h3>

        <p>
          Eşleşen İlan:
          ${match.portfolioTitle}
        </p>

      </div>
    `;
  });
}

document.addEventListener("DOMContentLoaded", ()=>{

  renderPortfolios();
  renderCustomers();
  renderMatches();
  updateMatchOptions();
  updateDashboard();

});