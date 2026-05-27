document.addEventListener(
'touchstart',
() => {},
{ passive:true }
);

const state = {
portfolio:[]
};

let currentPhoto = '';

const modal = document.getElementById('modal');
const portfolioList = document.getElementById('portfolioList');

function toast(text){

const wrap = document.getElementById('toastWrap');

const el = document.createElement('div');

el.className = 'toast';

el.innerText = text;

wrap.appendChild(el);

setTimeout(() => {
el.remove();
}, 2000);
}

function saveDB(){

localStorage.setItem(
'emlakcrm',
JSON.stringify(state)
);
}

function loadDB(){

const raw = localStorage.getItem('emlakcrm');

if(raw){

```
Object.assign(
  state,
  JSON.parse(raw)
);
```

}
}

function render(){

portfolioList.innerHTML = '';

const q = document
.getElementById('searchInput')
.value
.toLowerCase();

const filtered = state.portfolio.filter(item => {

```
return (
  item.title.toLowerCase().includes(q)
  ||
  item.city.toLowerCase().includes(q)
);
```

});

document.getElementById(
'portfolioCount'
).innerText = state.portfolio.length;

filtered.forEach(item => {

```
const card = document.createElement('div');

card.className = 'card';

card.innerHTML = `

  <div class="thumb">

    <img
      src="${item.photo || 'https://placehold.co/600x400'}"
    >

  </div>

  <div class="info">

    <div class="title">
      ${item.title}
    </div>

    <div class="meta">
      ${item.city || '-'}
    </div>

    <div class="price">
      ${Number(item.price).toLocaleString('tr-TR')} ₺
    </div>

    <div class="row">

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
```

});

bindDeleteButtons();
}

function bindDeleteButtons(){

document.querySelectorAll('.delete-btn')
.forEach(btn => {

```
  btn.addEventListener('click', () => {

    const id = Number(btn.dataset.id);

    if(confirm('İlan silinsin mi?')){

      state.portfolio =
        state.portfolio.filter(
          x => x.id !== id
        );

      saveDB();

      render();

      toast('İlan silindi');
    }

  });

});
```

}

document
.getElementById('fabBtn')
.addEventListener('click', () => {

```
modal.classList.add('open');
```

});

document
.getElementById('closeModal')
.addEventListener('click', () => {

```
modal.classList.remove('open');
```

});

modal.addEventListener('click', e => {

if(e.target === modal){

```
modal.classList.remove('open');
```

}

});

document
.getElementById('photoInput')
.addEventListener('change', e => {

```
const file = e.target.files[0];

if(!file) return;

const reader = new FileReader();

reader.onload = ev => {

  currentPhoto = ev.target.result;

  document.getElementById(
    'preview'
  ).innerHTML = `
    <img src="${currentPhoto}">
  `;

};

reader.readAsDataURL(file);
```

});

document
.getElementById('saveBtn')
.addEventListener('click', () => {

```
const title =
  document.getElementById(
    'titleInput'
  ).value;

const price =
  document.getElementById(
    'priceInput'
  ).value;

const city =
  document.getElementById(
    'cityInput'
  ).value;

if(!title || !price){

  toast('Eksik alan var');

  return;
}

state.portfolio.unshift({

  id:Date.now(),

  title,

  price,

  city,

  photo:currentPhoto

});

saveDB();

render();

modal.classList.remove('open');

document.getElementById(
  'titleInput'
).value = '';

document.getElementById(
  'priceInput'
).value = '';

document.getElementById(
  'cityInput'
).value = '';

currentPhoto = '';

document.getElementById(
  'preview'
).innerHTML = '';

toast('İlan kaydedildi');
```

});

document
.getElementById('searchInput')
.addEventListener('input', render);

window.addEventListener('load', () => {

loadDB();

render();

toast('Emlak CRM hazır');

});
