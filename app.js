let editingId = null;
let currentPhoto = "";

const state = {
portfolio:[]
};

const modal = document.getElementById("modal");
const portfolioList = document.getElementById("portfolioList");

function toast(text){

const wrap = document.getElementById("toastWrap");

const el = document.createElement("div");

el.className = "toast";

el.innerText = text;

wrap.appendChild(el);

setTimeout(() => {
el.remove();
},2000);

}

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

function openModal(){

modal.classList.add("open");

}

function closeModal(){

modal.classList.remove("open");

editingId = null;

currentPhoto = "";

document.getElementById("titleInput").value = "";
document.getElementById("priceInput").value = "";
document.getElementById("cityInput").value = "";
document.getElementById("preview").innerHTML = "";

}

function render(){

portfolioList.innerHTML = "";

document.getElementById(
"portfolioCount"
).innerText = state.portfolio.length;

const q =
document.getElementById("searchInput")
.value
.toLowerCase();

const filtered =
state.portfolio.filter(item => {

return (
item.title.toLowerCase().includes(q)
||
item.city.toLowerCase().includes(q)
);

});

if(filtered.length === 0){

portfolioList.innerHTML = `
<div class="empty">
Henüz portföy yok
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

<div class="title">
${item.title}
</div>

<div class="meta">
${item.city}
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

</div>

`;

portfolioList.appendChild(card);

});

bindButtons();

}

function bindButtons(){

document.querySelectorAll(".delete-btn")
.forEach(btn => {

btn.onclick = function(){

const id =
Number(this.dataset.id);

if(!confirm("Silinsin mi?"))
return;

state.portfolio =
state.portfolio.filter(
x => x.id !== id
);

saveDB();

render();

toast("Silindi");

};

});

document.querySelectorAll(".edit-btn")
.forEach(btn => {

btn.onclick = function(){

const id =
Number(this.dataset.id);

const item =
state.portfolio.find(
x => x.id === id
);

if(!item) return;

editingId = id;

document.getElementById(
"titleInput"
).value = item.title;

document.getElementById(
"priceInput"
).value = item.price;

document.getElementById(
"cityInput"
).value = item.city;

currentPhoto = item.photo || "";

if(currentPhoto){

document.getElementById(
"preview"
).innerHTML =
`<img src="${currentPhoto}">`;

}

openModal();

};

});

}

document.getElementById("photoInput")
.addEventListener(
"change",
function(e){

const file = e.target.files[0];

if(!file) return;

const reader = new FileReader();

reader.onload = function(ev){

currentPhoto = ev.target.result;

document.getElementById(
"preview"
).innerHTML =
`<img src="${currentPhoto}">`;

};

reader.readAsDataURL(file);

}
);

document.getElementById("saveBtn")
.addEventListener(
"click",
function(){

const title =
document.getElementById("titleInput")
.value.trim();

const price =
document.getElementById("priceInput")
.value.trim();

const city =
document.getElementById("cityInput")
.value.trim();

if(!title || !price){

toast("Başlık ve fiyat gerekli");

return;

}

const item = {

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

state.portfolio[index] = item;

toast("Güncellendi");

}else{

state.portfolio.unshift(item);

toast("Kaydedildi");

}

saveDB();

render();

closeModal();

}
);

document.getElementById("fabBtn")
.addEventListener(
"click",
openModal
);

document.getElementById("closeModal")
.addEventListener(
"click",
closeModal
);

document.getElementById("searchInput")
.addEventListener(
"input",
render
);

modal.addEventListener(
"click",
function(e){

if(e.target === modal){

closeModal();

}

}
);

document.querySelectorAll(".nav-btn")
.forEach(btn => {

btn.addEventListener(
"click",
function(){

document.querySelectorAll(".nav-btn")
.forEach(x =>
x.classList.remove("active")
);

this.classList.add("active");

const page =
this.dataset.page;

document.querySelectorAll(".page")
.forEach(p =>
p.classList.remove("active")
);

if(page === "portfolio"){

document.getElementById(
"portfolioPage"
).classList.add("active");

}

if(page === "customer"){

document.getElementById(
"customerPage"
).classList.add("active");

}

if(page === "match"){

document.getElementById(
"matchPage"
).classList.add("active");

}

}
);

});

window.addEventListener(
"load",
function(){

loadDB();

render();

toast("Emlak CRM hazır");

}
);
