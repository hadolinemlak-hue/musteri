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

  document.getElementById("portfolioCount").innerText = portfolios.length;
  document.getElementById("customerCount").innerText = customers.length;
  document.getElementById("matchCount").innerText = matches.length;
}

function addPortfolio(){

  const title = document.getElementById("title").value;
  const price = document.getElementById("price").value;
  const description = document.getElementById("description").value;
  const files = document.getElementById("images").files;

  if(files.length > 3){
    alert("En fazla 3 fotoğraf yükleyebilirsiniz.");
    return;
  }

  let imageArray = [];
  let loaded = 0;

  if(files.length === 0){
    finishAdd([]);
  }

  for(let file of files){

    const reader = new FileReader();

    reader.onload = function(e){

      imageArray.push(e.target.result);
      loaded++;

      if(loaded === files.length){
        finishAdd(imageArray);
      }
    }

    reader.readAsDataURL(file);
  }

  function finishAdd(images){

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
  }
}

function renderPortfolios(){

  const list = document.getElementById("portfolioList");
  list.innerHTML = "";

  portfolios.forEach(item=>{

    let imagesHTML = "";

    item.images.forEach(img=>{
      imagesHTML += `<img src="${img}">`;
    });

    list.innerHTML += `
      <div class="portfolio-item">
        <h3>${item.title}</h3>
        <p>Fiyat: ${item.price}</p>
        <p>${item.description}</p>

        <div class="images">
          ${imagesHTML}
        </div>
      </div>
    `;
  });
}

function addCustomer(){

  const name = document.getElementById("customerName").value;
  const phone = document.getElementById("customerPhone").value;
  const note = document.getElementById("customerNote").value;

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
}

function renderCustomers(){

  const list = document.getElementById("customerList");
  list.innerHTML = "";

  customers.forEach(customer=>{

    const cleanPhone = customer.phone.replace(/\s+/g, '');

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
          WhatsApp Mesaj Gönder
        </a>

      </div>
    `;
  });
}

function updateMatchOptions(){

  const customerSelect = document.getElementById("matchCustomer");
  const portfolioSelect = document.getElementById("matchPortfolio");

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

  matches.push({
    customerName:customer.name,
    portfolioTitle:portfolio.title
  });

  saveData();
  renderMatches();
}

function renderMatches(){

  const list = document.getElementById("matchList");
  list.innerHTML = "";

  matches.forEach(match=>{

    list.innerHTML += `
      <div class="match-item">
        <h3>${match.customerName}</h3>
        <p>Eşleşen İlan: ${match.portfolioTitle}</p>
      </div>
    `;
  });
}

renderPortfolios();
renderCustomers();
renderMatches();
updateMatchOptions();
updateDashboard();