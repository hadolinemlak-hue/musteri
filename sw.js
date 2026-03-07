<script>
(() => {
  const LS_KEY_C = "hadolin_customers_v2";
  const LS_KEY_P = "hadolin_portfolios_v1";

  const $ = (id) => document.getElementById(id);

  // ---------- Offline ----------
  const netEl = $("net");
  function paintNet() {
    if (netEl) netEl.textContent = navigator.onLine ? "hazır" : "offline";
  }
  window.addEventListener("online", paintNet);
  window.addEventListener("offline", paintNet);
  paintNet();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }

  // ---------- Tabs ----------
  const tabButtons = Array.from(document.querySelectorAll("[data-tab-btn]"));
  const tabPanels = {
    customers: $("tab-customers"),
    portfolios: $("tab-portfolios"),
    match: $("tab-match"),
    today: $("tab-today"),
  };

  function showTab(name) {
    Object.entries(tabPanels).forEach(([key, el]) => {
      if (el) el.classList.toggle("active", key === name);
    });

    tabButtons.forEach((btn) => {
      const tab = btn.getAttribute("data-tab-btn");
      const active = tab === name;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => showTab(btn.getAttribute("data-tab-btn")));
  });

  // ---------- Toast ----------
  const toastEl = $("toast");
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => toastEl.classList.remove("show"), 1800);
  }

  // ---------- Utils ----------
  function nowISO() {
    return new Date().toISOString();
  }

  function uuid() {
    return "c_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  function normalizeMoney(s) {
    return String(s || "").replace(/[^\d]/g, "");
  }

  function formatMoney(d) {
    return d ? String(d).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "";
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d)) return "—";
    return d.toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function load(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function save(key, items) {
    localStorage.setItem(key, JSON.stringify(items));
  }

  function csvCell(v) {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
    return s;
  }

  function downloadText(text, filename, mime) {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // ---------- Backup / Restore ----------
  const btnBackup = $("btnBackup");
  const btnRestore = $("btnRestore");

  btnBackup?.addEventListener("click", async () => {
    const customers = load(LS_KEY_C);
    const portfolios = load(LS_KEY_P);
    const payload = {
      version: 1,
      exportedAt: nowISO(),
      customers,
      portfolios,
    };
    const text = JSON.stringify(payload, null, 2);

    const file = new File([text], "hadolin-crm-yedek.json", {
      type: "application/json",
    });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "HADOLIN CRM Yedek" });
        toast("Yedek paylaşıldı.");
        return;
      } catch (e) {}
    }

    downloadText(text, "hadolin-crm-yedek.json", "application/json");
    toast("Yedek indirildi.");
  });

  btnRestore?.addEventListener("click", () => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "application/json";

    inp.onchange = () => {
      const file = inp.files?.[0];
      if (!file) return;

      const r = new FileReader();
      r.onload = () => {
        try {
          const data = JSON.parse(String(r.result || ""));
          if (!data) throw new Error("invalid");

          const customers = Array.isArray(data.customers) ? data.customers : [];
          const portfolios = Array.isArray(data.portfolios) ? data.portfolios : [];

          const ok = confirm("Bu yedek mevcut kayıtların ÜZERİNE yazacak. Emin misin?");
          if (!ok) return;

          const cItems = customers
            .map((x) => ({
              id: x.id || uuid(),
              name: (x.name || "").trim(),
              phone: (x.phone || "").trim(),
              deal: (x.deal || "").trim(),
              ptype: (x.ptype || "").trim(),
              demand: (x.demand || "").trim(),
              budget: normalizeMoney(x.budget || x.budgetFmt || ""),
              budgetFmt: "",
              location: (x.location || "").trim(),
              createdAt: x.createdAt || nowISO(),
              updatedAt: nowISO(),
            }))
            .filter((x) => x.name);

          cItems.forEach((x) => {
            x.budgetFmt = x.budget ? formatMoney(x.budget) : "";
          });

          const pItems = portfolios
            .map((x) => ({
              id: x.id || uuid(),
              deal: (x.deal || "").trim(),
              type: (x.type || "").trim(),
              rooms: (x.rooms || "").trim(),
              title: (x.title || "").trim(),
              price: normalizeMoney(x.price || x.priceFmt || ""),
              priceFmt: "",
              location: (x.location || "").trim(),
              desc: (x.desc || "").trim(),
              notes: (x.notes || "").trim(),
              createdAt: x.createdAt || nowISO(),
              updatedAt: nowISO(),
            }))
            .filter((x) => x.title);

          pItems.forEach((x) => {
            x.priceFmt = x.price ? formatMoney(x.price) : "";
          });

          save(LS_KEY_C, cItems);
          save(LS_KEY_P, pItems);

          renderCustomers();
          resetCustomerForm();
          renderPortfolios();
          resetPortfolioForm();
          renderToday();
          closeMatch();

          toast("Geri yüklendi.");
        } catch (e) {
          toast("Yedek okunamadı.");
        }
      };

      r.readAsText(file);
    };

    inp.click();
  });

  // ---------- Customers ----------
  const customerFormEl = $("form");
  const idEl = $("id");
  const nameEl = $("name");
  const phoneEl = $("phone");
  const demandEl = $("demand");
  const budgetEl = $("budget");
  const locationEl = $("location");
  const dealEl = $("deal");
  const ptypeEl = $("ptype");

  const listEl = $("list");
  const emptyEl = $("empty");
  const countEl = $("count");
  const searchEl = $("search");
  const fDealEl = $("fDeal");
  const fTypeEl = $("fType");

  function resetCustomerForm() {
    if (idEl) idEl.value = "";
    if (nameEl) nameEl.value = "";
    if (phoneEl) phoneEl.value = "";
    if (demandEl) demandEl.value = "";
    if (budgetEl) budgetEl.value = "";
    if (locationEl) locationEl.value = "";
    if (dealEl) dealEl.value = "";
    if (ptypeEl) ptypeEl.value = "";
    const saveBtn = $("btnSave");
    if (saveBtn) saveBtn.textContent = "Kaydet";
    nameEl?.focus();
  }

  function upsertCustomer(item) {
    const items = load(LS_KEY_C);
    const idx = items.findIndex((x) => x.id === item.id);
    if (idx >= 0) items[idx] = item;
    else items.unshift(item);
    save(LS_KEY_C, items);
    renderCustomers();
    renderToday();
  }

  function removeCustomer(id) {
    save(
      LS_KEY_C,
      load(LS_KEY_C).filter((x) => x.id !== id)
    );
    renderCustomers();
    renderToday();
  }

  function renderCustomers() {
    if (!listEl || !countEl) return;

    const q = (searchEl?.value || "").trim().toLowerCase();
    const items = load(LS_KEY_C);
    let filtered = [...items];

    if (fDealEl?.value) filtered = filtered.filter((x) => (x.deal || "") === fDealEl.value);
    if (fTypeEl?.value) filtered = filtered.filter((x) => (x.ptype || "") === fTypeEl.value);

    if (q) {
      filtered = filtered.filter((x) =>
        (x.name || "").toLowerCase().includes(q) ||
        (x.phone || "").toLowerCase().includes(q) ||
        (x.location || "").toLowerCase().includes(q) ||
        (x.demand || "").toLowerCase().includes(q) ||
        (x.budgetFmt || "").toLowerCase().includes(q) ||
        (x.deal || "").toLowerCase().includes(q) ||
        (x.ptype || "").toLowerCase().includes(q)
      );
    }

    countEl.textContent = String(items.length);
    listEl.innerHTML = "";
    if (emptyEl) emptyEl.style.display = filtered.length === 0 ? "block" : "none";

    filtered.forEach((x) => {
      const div = document.createElement("div");
      div.className = "item";

      const budgetLine = x.budget
        ? `Bütçe: <b>${x.budgetFmt} ₺</b>`
        : `Bütçe: <span style="color:var(--muted)">—</span>`;

      const phoneLine = x.phone
        ? `Tel: <b><a href="tel:${escapeHtml(x.phone)}" style="color:inherit;text-decoration:none">${escapeHtml(x.phone)}</a></b>`
        : `Tel: <span style="color:var(--muted)">—</span>`;

      const locLine = x.location
        ? `Mevkii: <b>${escapeHtml(x.location)}</b>`
        : `Mevkii: <span style="color:var(--muted)">—</span>`;

      div.innerHTML = `
        <div class="itemTop">
          <div>
            <div class="name">${escapeHtml(x.name || "—")}</div>
            <div class="meta">${phoneLine} · ${budgetLine}<br/>${locLine}</div>
            <div class="meta" style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
              ${x.deal ? `<span class="tag">${escapeHtml(x.deal)}</span>` : ``}
              ${x.ptype ? `<span class="tag">${escapeHtml(x.ptype)}</span>` : ``}
            </div>
          </div>
          <div class="pill" title="Son güncelleme">${formatDate(x.updatedAt || x.createdAt)}</div>
        </div>

        <div class="meta" style="margin-top:8px">
          <b>Talep:</b> ${x.demand ? escapeHtml(x.demand).replace(/\n/g, "<br/>") : '<span style="color:var(--muted)">—</span>'}
        </div>

        <div class="actions">
          <button class="btn warn" data-edit="${x.id}">Düzenle</button>
          <button class="btn bad" data-del="${x.id}">Sil</button>
          <button class="btn" data-copy="${x.id}">Kopyala</button>
          <button class="btn primary" data-match="${x.id}">Eşleştir</button>
        </div>
      `;
      listEl.appendChild(div);
    });
  }

  customerFormEl?.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = (nameEl?.value || "").trim();
    if (!name) {
      toast("Ad soyad boş olamaz.");
      nameEl?.focus();
      return;
    }

    const budgetDigits = normalizeMoney(budgetEl?.value || "");
    const prev = idEl?.value ? load(LS_KEY_C).find((x) => x.id === idEl.value) : null;
    const wasEditing = !!idEl?.value;

    const item = {
      id: idEl?.value || uuid(),
      name,
      phone: (phoneEl?.value || "").trim(),
      demand: (demandEl?.value || "").trim(),
      deal: (dealEl?.value || "").trim(),
      ptype: (ptypeEl?.value || "").trim(),
      budget: budgetDigits,
      budgetFmt: budgetDigits ? formatMoney(budgetDigits) : "",
      location: (locationEl?.value || "").trim(),
      createdAt: prev?.createdAt || nowISO(),
      updatedAt: nowISO(),
    };

    upsertCustomer(item);
    toast(wasEditing ? "Güncellendi." : "Kaydedildi.");
    resetCustomerForm();
    openMatch(item.id);
  });

  $("btnClear")?.addEventListener("click", () => {
    resetCustomerForm();
    toast("Form temizlendi.");
  });

  searchEl?.addEventListener("input", renderCustomers);
  fDealEl?.addEventListener("change", renderCustomers);
  fTypeEl?.addEventListener("change", renderCustomers);

  $("btnResetFilters")?.addEventListener("click", () => {
    if (fDealEl) fDealEl.value = "";
    if (fTypeEl) fTypeEl.value = "";
    renderCustomers();
    toast("Filtre sıfırlandı.");
  });

  listEl?.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const editId = btn.getAttribute("data-edit");
    const delId = btn.getAttribute("data-del");
    const copyId = btn.getAttribute("data-copy");
    const matchId = btn.getAttribute("data-match");

    if (editId) {
      const item = load(LS_KEY_C).find((x) => x.id === editId);
      if (!item) return;

      if (idEl) idEl.value = item.id;
      if (nameEl) nameEl.value = item.name || "";
      if (phoneEl) phoneEl.value = item.phone || "";
      if (demandEl) demandEl.value = item.demand || "";
      if (dealEl) dealEl.value = item.deal || "";
      if (ptypeEl) ptypeEl.value = item.ptype || "";
      if (budgetEl) budgetEl.value = item.budgetFmt || (item.budget ? formatMoney(item.budget) : "");
      if (locationEl) locationEl.value = item.location || "";

      const saveBtn = $("btnSave");
      if (saveBtn) saveBtn.textContent = "Güncelle";

      toast("Düzenleme modunda.");
      showTab("customers");
      return;
    }

    if (delId) {
      const item = load(LS_KEY_C).find((x) => x.id === delId);
      if (!item) return;

      const ok = confirm(`Silinsin mi?\n\n${item.name}\n${item.phone || ""}`);
      if (!ok) return;

      removeCustomer(delId);
      if (idEl?.value === delId) resetCustomerForm();
      if (selectedCustomerId === delId) closeMatch();

      toast("Silindi.");
      return;
    }

    if (copyId) {
      const item = load(LS_KEY_C).find((x) => x.id === copyId);
      if (!item) return;

      const text =
`Ad Soyad: ${item.name || "-"}
Telefon: ${item.phone || "-"}
İşlem: ${item.deal || "-"}
Tip: ${item.ptype || "-"}
Bütçe: ${item.budgetFmt ? item.budgetFmt + " ₺" : "-"}
Mevkii: ${item.location || "-"}
Talep: ${item.demand || "-"}`;

      navigator.clipboard?.writeText(text)
        .then(() => toast("Kopyalandı."))
        .catch(() => prompt("Kopyala:", text));
      return;
    }

    if (matchId) {
      openMatch(matchId);
    }
  });

  $("btnExport")?.addEventListener("click", () => {
    const items = load(LS_KEY_C);
    if (items.length === 0) {
      toast("Kayıt yok.");
      return;
    }

    const header = ["Ad Soyad", "Telefon", "İşlem", "Tip", "Talep", "Bütçe", "Mevkii", "Oluşturma", "Güncelleme"];
    const rows = items.map((x) => [
      x.name || "",
      x.phone || "",
      x.deal || "",
      x.ptype || "",
      (x.demand || "").replace(/\n/g, " "),
      x.budgetFmt ? x.budgetFmt + " ₺" : "",
      x.location || "",
      x.createdAt || "",
      x.updatedAt || "",
    ]);

    const csv = [header, ...rows].map((r) => r.map((v) => csvCell(v)).join(",")).join("\n");
    downloadText(csv, "hadolin-musteriler.csv", "text/csv;charset=utf-8");
    toast("Müşteri CSV indirildi.");
  });

  $("btnWipe")?.addEventListener("click", () => {
    const items = load(LS_KEY_C);
    if (items.length === 0) {
      toast("Zaten boş.");
      return;
    }

    const ok = confirm("TÜM müşteri kayıtları silinecek. Emin misin?");
    if (!ok) return;

    localStorage.removeItem(LS_KEY_C);
    renderCustomers();
    resetCustomerForm();
    closeMatch();
    renderToday();
    toast("Hepsi silindi.");
  });

  budgetEl?.addEventListener("input", () => {
    const digits = normalizeMoney(budgetEl.value);
    budgetEl.value = digits ? formatMoney(digits) : "";
  });

  // ---------- Portfolios ----------
  const pForm = $("pForm");
  const pIdEl = $("pId");
  const pDealEl = $("pDeal");
  const pTypeEl = $("pType");
  const pRoomsWrapEl = $("pRoomsWrap");
  const pRoomsEl = $("pRooms");
  const pTitleEl = $("pTitle");
  const pPriceEl = $("pPrice");
  const pLocationEl = $("pLocation");
  const pDescEl = $("pDesc");
  const pNotesEl = $("pNotes");

  const pCountEl = $("pCount");
  const pListEl = $("pList");
  const pEmptyEl = $("pEmpty");
  const pSearchEl = $("pSearch");

  const pfDealEl = $("pfDeal");
  const pfTypeEl = $("pfType");
  const pfRoomsEl = $("pfRooms");

  function syncRoomsVisibility() {
    const isDaire = pTypeEl?.value === "Daire";
    if (pRoomsWrapEl) pRoomsWrapEl.style.display = isDaire ? "block" : "none";
    if (!isDaire && pRoomsEl) pRoomsEl.value = "";
  }

  function resetPortfolioForm() {
    if (pIdEl) pIdEl.value = "";
    if (pDealEl) pDealEl.value = "";
    if (pTypeEl) pTypeEl.value = "";
    if (pRoomsEl) pRoomsEl.value = "";
    if (pTitleEl) pTitleEl.value = "";
    if (pPriceEl) pPriceEl.value = "";
    if (pLocationEl) pLocationEl.value = "";
    if (pDescEl) pDescEl.value = "";
    if (pNotesEl) pNotesEl.value = "";

    const saveBtn = $("pBtnSave");
    if (saveBtn) saveBtn.textContent = "Portföy Kaydet";

    syncRoomsVisibility();
  }

  function upsertPortfolio(item) {
    const items = load(LS_KEY_P);
    const idx = items.findIndex((x) => x.id === item.id);
    if (idx >= 0) items[idx] = item;
    else items.unshift(item);
    save(LS_KEY_P, items);
    renderPortfolios();
    if (selectedCustomerId) renderMatch();
  }

  function removePortfolio(id) {
    save(
      LS_KEY_P,
      load(LS_KEY_P).filter((x) => x.id !== id)
    );
    renderPortfolios();
    if (selectedCustomerId) renderMatch();
  }

  function renderPortfolios() {
    if (!pListEl || !pCountEl) return;

    const q = (pSearchEl?.value || "").trim().toLowerCase();
    const items = load(LS_KEY_P);
    let filtered = [...items];

    if (pfDealEl?.value) filtered = filtered.filter((x) => (x.deal || "") === pfDealEl.value);
    if (pfTypeEl?.value) filtered = filtered.filter((x) => (x.type || "") === pfTypeEl.value);
    if (pfRoomsEl?.value) filtered = filtered.filter((x) => (x.rooms || "") === pfRoomsEl.value);

    if (q) {
      filtered = filtered.filter((x) =>
        (x.title || "").toLowerCase().includes(q) ||
        (x.location || "").toLowerCase().includes(q) ||
        (x.desc || "").toLowerCase().includes(q) ||
        (x.notes || "").toLowerCase().includes(q) ||
        (x.priceFmt || "").toLowerCase().includes(q) ||
        (x.type || "").toLowerCase().includes(q) ||
        (x.deal || "").toLowerCase().includes(q) ||
        (x.rooms || "").toLowerCase().includes(q)
      );
    }

    pCountEl.textContent = String(items.length);
    pListEl.innerHTML = "";
    if (pEmptyEl) pEmptyEl.style.display = filtered.length === 0 ? "block" : "none";

    filtered.forEach((x) => {
      const div = document.createElement("div");
      div.className = "item";

      const priceLine = x.price
        ? `Fiyat: <b>${x.priceFmt} ₺</b>`
        : `Fiyat: <span style="color:var(--muted)">—</span>`;

      const locLine = x.location
        ? `Mevkii: <b>${escapeHtml(x.location)}</b>`
        : `Mevkii: <span style="color:var(--muted)">—</span>`;

      div.innerHTML = `
        <div class="itemTop">
          <div>
            <div class="name">${escapeHtml(x.title || "—")}</div>
            <div class="meta">${priceLine}<br/>${locLine}</div>
            <div class="meta" style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
              ${x.deal ? `<span class="tag">${escapeHtml(x.deal)}</span>` : ``}
              ${x.type ? `<span class="tag">${escapeHtml(x.type)}</span>` : ``}
              ${(x.type === "Daire" && x.rooms) ? `<span class="tag">${escapeHtml(x.rooms)}</span>` : ``}
            </div>
          </div>
          <div class="pill" title="Son güncelleme">${formatDate(x.updatedAt || x.createdAt)}</div>
        </div>

        <div class="meta" style="margin-top:8px">
          <b>Açıklama:</b> ${x.desc ? escapeHtml(x.desc).replace(/\n/g, "<br/>") : '<span style="color:var(--muted)">—</span>'}
        </div>

        <div class="meta" style="margin-top:8px">
          <b>Notlar:</b> ${x.notes ? escapeHtml(x.notes).replace(/\n/g, "<br/>") : '<span style="color:var(--muted)">—</span>'}
        </div>

        <div class="actions">
          <button class="btn warn" data-pedit="${x.id}">Düzenle</button>
          <button class="btn bad" data-pdel="${x.id}">Sil</button>
          <button class="btn" data-pcopy="${x.id}">Kopyala</button>
        </div>
      `;
      pListEl.appendChild(div);
    });
  }

  pForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    const deal = (pDealEl?.value || "").trim();
    const type = (pTypeEl?.value || "").trim();
    const title = (pTitleEl?.value || "").trim();

    if (!deal || !type || !title) {
      toast("İşlem, tür ve başlık zorunlu.");
      return;
    }

    const priceDigits = normalizeMoney(pPriceEl?.value || "");
    const prev = pIdEl?.value ? load(LS_KEY_P).find((x) => x.id === pIdEl.value) : null;
    const wasEditing = !!pIdEl?.value;

    const item = {
      id: pIdEl?.value || uuid(),
      deal,
      type,
      rooms: type === "Daire" ? (pRoomsEl?.value || "").trim() : "",
      title,
      price: priceDigits,
      priceFmt: priceDigits ? formatMoney(priceDigits) : "",
      location: (pLocationEl?.value || "").trim(),
      desc: (pDescEl?.value || "").trim(),
      notes: (pNotesEl?.value || "").trim(),
      createdAt: prev?.createdAt || nowISO(),
      updatedAt: nowISO(),
    };

    upsertPortfolio(item);
    toast(wasEditing ? "Portföy güncellendi." : "Portföy kaydedildi.");
    resetPortfolioForm();
  });

  pTypeEl?.addEventListener("change", syncRoomsVisibility);

  $("pBtnClear")?.addEventListener("click", () => {
    resetPortfolioForm();
    toast("Portföy formu temizlendi.");
  });

  pSearchEl?.addEventListener("input", renderPortfolios);
  pfDealEl?.addEventListener("change", renderPortfolios);
  pfTypeEl?.addEventListener("change", renderPortfolios);
  pfRoomsEl?.addEventListener("change", renderPortfolios);

  $("pBtnResetFilters")?.addEventListener("click", () => {
    if (pfDealEl) pfDealEl.value = "";
    if (pfTypeEl) pfTypeEl.value = "";
    if (pfRoomsEl) pfRoomsEl.value = "";
    renderPortfolios();
    toast("Portföy filtresi sıfırlandı.");
  });

  pListEl?.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const editId = btn.getAttribute("data-pedit");
    const delId = btn.getAttribute("data-pdel");
    const copyId = btn.getAttribute("data-pcopy");

    if (editId) {
      const item = load(LS_KEY_P).find((x) => x.id === editId);
      if (!item) return;

      if (pIdEl) pIdEl.value = item.id;
      if (pDealEl) pDealEl.value = item.deal || "";
      if (pTypeEl) pTypeEl.value = item.type || "";
      syncRoomsVisibility();
      if (pRoomsEl) pRoomsEl.value = item.rooms || "";
      if (pTitleEl) pTitleEl.value = item.title || "";
      if (pPriceEl) pPriceEl.value = item.priceFmt || (item.price ? formatMoney(item.price) : "");
      if (pLocationEl) pLocationEl.value = item.location || "";
      if (pDescEl) pDescEl.value = item.desc || "";
      if (pNotesEl) pNotesEl.value = item.notes || "";

      const saveBtn = $("pBtnSave");
      if (saveBtn) saveBtn.textContent = "Portföy Güncelle";

      toast("Portföy düzenleme modunda.");
      showTab("portfolios");
      return;
    }

    if (delId) {
      const item = load(LS_KEY_P).find((x) => x.id === delId);
      if (!item) return;

      const ok = confirm(`Portföy silinsin mi?\n\n${item.title}`);
      if (!ok) return;

      removePortfolio(delId);
      if (pIdEl?.value === delId) resetPortfolioForm();

      toast("Portföy silindi.");
      return;
    }

    if (copyId) {
      const item = load(LS_KEY_P).find((x) => x.id === copyId);
      if (!item) return;

      const text =
`Portföy: ${item.title || "-"}
İşlem: ${item.deal || "-"}
Tür: ${item.type || "-"}${item.type === "Daire" && item.rooms ? " (" + item.rooms + ")" : ""}
Fiyat: ${item.priceFmt ? item.priceFmt + " ₺" : "-"}
Mevkii: ${item.location || "-"}
Açıklama: ${item.desc || "-"}
Notlar: ${item.notes || "-"}`;

      navigator.clipboard?.writeText(text)
        .then(() => toast("Portföy kopyalandı."))
        .catch(() => prompt("Kopyala:", text));
    }
  });

  $("pBtnExport")?.addEventListener("click", () => {
    const items = load(LS_KEY_P);
    if (items.length === 0) {
      toast("Portföy yok.");
      return;
    }

    const header = ["Başlık", "İşlem", "Tür", "Daire Tipi", "Fiyat", "Mevkii", "Açıklama", "Notlar", "Oluşturma", "Güncelleme"];
    const rows = items.map((x) => [
      x.title || "",
      x.deal || "",
      x.type || "",
      x.rooms || "",
      x.priceFmt ? x.priceFmt + " ₺" : "",
      x.location || "",
      (x.desc || "").replace(/\n/g, " "),
      (x.notes || "").replace(/\n/g, " "),
      x.createdAt || "",
      x.updatedAt || "",
    ]);

    const csv = [header, ...rows].map((r) => r.map((v) => csvCell(v)).join(",")).join("\n");
    downloadText(csv, "hadolin-portfoy.csv", "text/csv;charset=utf-8");
    toast("Portföy CSV indirildi.");
  });

  $("pBtnWipe")?.addEventListener("click", () => {
    const items = load(LS_KEY_P);
    if (items.length === 0) {
      toast("Portföy zaten boş.");
      return;
    }

    const ok = confirm("TÜM portföy kayıtları silinecek. Emin misin?");
    if (!ok) return;

    localStorage.removeItem(LS_KEY_P);
    renderPortfolios();
    resetPortfolioForm();
    if (selectedCustomerId) renderMatch();

    toast("Portföy temizlendi.");
  });

  pPriceEl?.addEventListener("input", () => {
    const digits = normalizeMoney(pPriceEl.value);
    pPriceEl.value = digits ? formatMoney(digits) : "";
  });

  // ---------- Match ----------
  const matchListEl = $("matchList");
  const matchEmptyEl = $("matchEmpty");
  const matchMetaEl = $("matchMeta");
  const mBudgetEl = $("mBudget");
  const mLocEl = $("mLoc");
  const mSortEl = $("mSort");

  let selectedCustomerId = "";

  function closeMatch() {
    selectedCustomerId = "";
    if (matchListEl) matchListEl.innerHTML = "";
    if (matchMetaEl) matchMetaEl.textContent = "";
    if (matchEmptyEl) matchEmptyEl.style.display = "block";
  }

  function parseRoomsFromText(text) {
    const t = (text || "").toLowerCase();
    const m = t.match(/\b([1-4])\s*\+\s*1\b/);
    if (m) return `${m[1]}+1`;
    if (t.includes("dubleks")) return "Dubleks";
    return "";
  }

  function normalizeLocTokens(s) {
    return (s || "")
      .toLowerCase()
      .replace(/[^a-z0-9ğüşöçı\s\/-]/gi, " ")
      .split(/\s+|\/|-/g)
      .filter(Boolean)
      .filter((tok) => tok.length >= 3);
  }

  function locationSimilarity(a, b) {
    const A = new Set(normalizeLocTokens(a));
    const B = new Set(normalizeLocTokens(b));
    if (A.size === 0 || B.size === 0) return 0;
    let inter = 0;
    for (const x of A) if (B.has(x)) inter++;
    return inter / Math.max(A.size, B.size);
  }

  function scoreMatch(customer, portfolio) {
    let score = 0;

    if (customer.deal && portfolio.deal && customer.deal === portfolio.deal) score += 3;
    if (customer.ptype && portfolio.type && customer.ptype === portfolio.type) score += 3;

    const cRooms = customer.ptype === "Daire" ? parseRoomsFromText(customer.demand) : "";
    if (customer.ptype === "Daire" && cRooms && portfolio.rooms && cRooms === portfolio.rooms) score += 2;
    if (customer.ptype === "Daire" && cRooms && !portfolio.rooms) score -= 0.5;

    const cb = customer.budget ? parseInt(customer.budget, 10) : 0;
    const pp = portfolio.price ? parseInt(portfolio.price, 10) : 0;

    if (cb && pp) {
      if (pp <= cb) score += 2;
      else if (pp <= Math.round(cb * 1.1)) score += 1;
      else score -= 1;
    }

    const sim = locationSimilarity(customer.location, portfolio.location);
    if (sim >= 0.5) score += 1.5;
    else if (sim >= 0.25) score += 1;

    const updated = new Date(portfolio.updatedAt || portfolio.createdAt || 0).getTime();
    const ageDays = updated ? (Date.now() - updated) / (1000 * 60 * 60 * 24) : 999;
    if (ageDays <= 14) score += 0.5;

    return { score, sim, cb, pp, cRooms };
  }

  function openMatch(customerId) {
    selectedCustomerId = customerId;
    showTab("match");
    if (mBudgetEl) mBudgetEl.value = "";
    if (mLocEl) mLocEl.value = "";
    if (mSortEl) mSortEl.value = "score";
    renderMatch();
  }

  function renderMatch() {
    if (!selectedCustomerId) {
      if (matchEmptyEl) matchEmptyEl.style.display = "block";
      return;
    }

    const customer = load(LS_KEY_C).find((x) => x.id === selectedCustomerId);
    if (!customer) {
      closeMatch();
      return;
    }

    const portfolios = load(LS_KEY_P);
    const baseRooms = customer.ptype === "Daire" ? parseRoomsFromText(customer.demand) : "";
    const budgetText = customer.budgetFmt ? `${customer.budgetFmt} ₺` : "—";

    if (matchMetaEl) {
      matchMetaEl.innerHTML = `
        <div class="meta">
          <b>${escapeHtml(customer.name)}</b> · ${escapeHtml(customer.deal || "—")} · ${escapeHtml(customer.ptype || "—")}
          ${baseRooms ? ` · <span class="tag">${escapeHtml(baseRooms)}</span>` : ``}
          <br/>Bütçe: <b>${escapeHtml(budgetText)}</b> · Mevkii: <b>${escapeHtml(customer.location || "—")}</b>
        </div>
      `;
    }

    let scored = portfolios.map((p) => ({ p, ...scoreMatch(customer, p) }));

    if (customer.deal) scored = scored.filter((x) => x.p.deal === customer.deal);
    if (customer.ptype) scored = scored.filter((x) => x.p.type === customer.ptype);

    if (mBudgetEl?.value === "Icinde" && customer.budget) {
      const cb = parseInt(customer.budget, 10);
      scored = scored.filter((x) => (x.pp ? x.pp <= cb : true));
    }

    if (mLocEl?.value === "Benzer") {
      scored = scored.filter((x) => x.sim >= 0.25);
    }

    const sort = mSortEl?.value || "score";
    scored.sort((a, b) => {
      if (sort === "priceAsc") return (a.pp || Number.MAX_SAFE_INTEGER) - (b.pp || Number.MAX_SAFE_INTEGER);
      if (sort === "priceDesc") return (b.pp || -1) - (a.pp || -1);
      if (sort === "newest") {
        const au = new Date(a.p.updatedAt || a.p.createdAt || 0).getTime();
        const bu = new Date(b.p.updatedAt || b.p.createdAt || 0).getTime();
        return bu - au;
      }
      if (b.score !== a.score) return b.score - a.score;
      const au = new Date(a.p.updatedAt || a.p.createdAt || 0).getTime();
      const bu = new Date(b.p.updatedAt || b.p.createdAt || 0).getTime();
      return bu - au;
    });

    if (!matchListEl) return;

    matchListEl.innerHTML = "";
    if (matchEmptyEl) matchEmptyEl.style.display = scored.length === 0 ? "block" : "none";

    scored.slice(0, 12).forEach((x) => {
      const p = x.p;
      const priceLine = p.price
        ? `Fiyat: <b>${p.priceFmt} ₺</b>`
        : `Fiyat: <span style="color:var(--muted)">—</span>`;

      const locLine = p.location
        ? `Mevkii: <b>${escapeHtml(p.location)}</b>`
        : `Mevkii: <span style="color:var(--muted)">—</span>`;

      const inBudget = x.cb && x.pp ? x.pp <= x.cb : null;
      const budgetBadge = inBudget === null
        ? ""
        : inBudget
          ? `<span class="tag" style="border-color:rgba(46,229,157,.45)">Bütçe İçinde</span>`
          : `<span class="tag" style="border-color:rgba(245,158,11,.5)">Bütçe Üstü</span>`;

      const tags = `
        ${p.deal ? `<span class="tag">${escapeHtml(p.deal)}</span>` : ``}
        ${p.type ? `<span class="tag">${escapeHtml(p.type)}</span>` : ``}
        ${(p.type === "Daire" && p.rooms) ? `<span class="tag">${escapeHtml(p.rooms)}</span>` : ``}
        ${budgetBadge}
        ${(x.sim >= 0.25) ? `<span class="tag" style="border-color:rgba(255,255,255,.16)">Mevkii Benzer</span>` : ``}
      `.trim();

      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <div class="itemTop">
          <div>
            <div class="name">${escapeHtml(p.title || "—")}</div>
            <div class="meta">${priceLine}<br/>${locLine}</div>
            ${tags ? `<div class="meta" style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">${tags}</div>` : ``}
          </div>
          <div class="row" style="justify-content:flex-end">
            <span class="score">Skor ${x.score.toFixed(1)}</span>
            <span class="pill" title="Son güncelleme">${formatDate(p.updatedAt || p.createdAt)}</span>
          </div>
        </div>

        <div class="meta" style="margin-top:8px">
          <b>Açıklama:</b> ${p.desc ? escapeHtml(p.desc).replace(/\n/g, "<br/>") : '<span style="color:var(--muted)">—</span>'}
        </div>

        <div class="actions">
          <button class="btn" data-mcopy="${p.id}">Bu Portföyü Kopyala</button>
        </div>
      `;
      matchListEl.appendChild(div);
    });
  }

  matchListEl?.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const pid = btn.getAttribute("data-mcopy");
    if (!pid) return;

    const p = load(LS_KEY_P).find((x) => x.id === pid);
    if (!p) return;

    const text =
`Portföy: ${p.title || "-"}
İşlem: ${p.deal || "-"}
Tür: ${p.type || "-"}${p.type === "Daire" && p.rooms ? " (" + p.rooms + ")" : ""}
Fiyat: ${p.priceFmt ? p.priceFmt + " ₺" : "-"}
Mevkii: ${p.location || "-"}
Açıklama: ${p.desc || "-"}
Notlar: ${p.notes || "-"}`;

    navigator.clipboard?.writeText(text)
      .then(() => toast("Kopyalandı."))
      .catch(() => prompt("Kopyala:", text));
  });

  $("btnMatchClose")?.addEventListener("click", () => {
    closeMatch();
    toast("Eşleşme kapatıldı.");
  });

  $("btnMatchReset")?.addEventListener("click", () => {
    if (mBudgetEl) mBudgetEl.value = "";
    if (mLocEl) mLocEl.value = "";
    if (mSortEl) mSortEl.value = "score";
    renderMatch();
    toast("Eşleşme filtresi sıfırlandı.");
  });

  mBudgetEl?.addEventListener("change", renderMatch);
  mLocEl?.addEventListener("change", renderMatch);
  mSortEl?.addEventListener("change", renderMatch);

  $("btnMatchCopy")?.addEventListener("click", () => {
    if (!selectedCustomerId) return;

    const customer = load(LS_KEY_C).find((x) => x.id === selectedCustomerId);
    if (!customer) {
      toast("Müşteri bulunamadı.");
      return;
    }

    let scored = load(LS_KEY_P).map((p) => ({ p, ...scoreMatch(customer, p) }));
    if (customer.deal) scored = scored.filter((x) => x.p.deal === customer.deal);
    if (customer.ptype) scored = scored.filter((x) => x.p.type === customer.ptype);
    scored.sort((a, b) => b.score - a.score);

    const top = scored.slice(0, 5).map((x, i) => {
      const p = x.p;
      const price = p.priceFmt ? `${p.priceFmt} ₺` : "—";
      const rooms = p.type === "Daire" && p.rooms ? ` · ${p.rooms}` : "";
      const loc = p.location ? ` · ${p.location}` : "";
      return `${i + 1}) ${p.title || "Portföy"} — ${price}${rooms}${loc}`;
    }).join("\n");

    const msg =
`Merhaba ${customer.name || ""},
Kriterlerinize uygun bazı portföyleri listeledim:

${top || "Şu an birebir uyan portföy bulamadım. Kriteri netleştirirsek hemen çıkarırım."}

İsterseniz size uygun olanları seçip detaylarını paylaşayım.`;

    navigator.clipboard?.writeText(msg)
      .then(() => toast("Mesaj kopyalandı."))
      .catch(() => prompt("Kopyala:", msg));
  });

  // ---------- Today ----------
  const todayListEl = $("todayList");
  const todayEmptyEl = $("todayEmpty");
  const todayMetaEl = $("todayMeta");

  function ymdLocal(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function isoToLocalYmd(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return "";
    return ymdLocal(d);
  }

  function renderToday() {
    if (!todayListEl || !todayMetaEl) return;

    const items = load(LS_KEY_C);
    const todayStr = ymdLocal(new Date());

    const todays = items
      .filter((x) => isoToLocalYmd(x.updatedAt || x.createdAt) === todayStr)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

    todayMetaEl.innerHTML = `<div class="meta">Tarih: <b>${todayStr}</b> · Bugün: <b>${todays.length}</b> müşteri</div>`;
    todayListEl.innerHTML = "";
    if (todayEmptyEl) todayEmptyEl.style.display = todays.length ? "none" : "block";

    todays.forEach((x) => {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <div class="itemTop">
          <div>
            <div class="name">${escapeHtml(x.name || "—")}</div>
            <div class="meta">
              Tel: <b>${escapeHtml(x.phone || "—")}</b> · Bütçe: <b>${escapeHtml(x.budgetFmt || "—")}${x.budgetFmt ? " ₺" : ""}</b><br/>
              Mevkii: <b>${escapeHtml(x.location || "—")}</b>
            </div>
            <div class="meta" style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
              ${x.deal ? `<span class="tag">${escapeHtml(x.deal)}</span>` : ``}
              ${x.ptype ? `<span class="tag">${escapeHtml(x.ptype)}</span>` : ``}
            </div>
          </div>
          <div class="pill">${formatDate(x.updatedAt || x.createdAt)}</div>
        </div>
        <div class="actions">
          <button class="btn primary" data-tmatch="${x.id}">Eşleştir</button>
          <button class="btn" data-tcall="${x.id}">Ara</button>
          <button class="btn" data-twa="${x.id}">WhatsApp</button>
        </div>
      `;
      todayListEl.appendChild(div);
    });
  }

  $("btnTodayRefresh")?.addEventListener("click", () => {
    renderToday();
    toast("Bugün listesi yenilendi.");
  });

  $("btnTodayClose")?.addEventListener("click", () => {
    showTab("customers");
    toast("Bugün kapatıldı.");
  });

  todayListEl?.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const mid = btn.getAttribute("data-tmatch");
    const cid = btn.getAttribute("data-tcall");
    const wid = btn.getAttribute("data-twa");

    if (mid) {
      openMatch(mid);
      return;
    }

    if (cid) {
      const item = load(LS_KEY_C).find((x) => x.id === cid);
      if (!item || !item.phone) {
        toast("Telefon yok.");
        return;
      }
      window.location.href = `tel:${item.phone}`;
      return;
    }

    if (wid) {
      const item = load(LS_KEY_C).find((x) => x.id === wid);
      if (!item || !item.phone) {
        toast("Telefon yok.");
        return;
      }

      const digits = (item.phone || "").replace(/[^\d]/g, "");
      if (!digits) {
        toast("Telefon formatı bozuk.");
        return;
      }

      const clean = digits.replace(/^0/, "");
      const msg = encodeURIComponent(`Merhaba ${item.name || ""}, kriterlerinize uygun portföyleri hazırladım. Uygun olduğunuzda paylaşabilirim.`);
      window.open(`https://wa.me/90${clean}?text=${msg}`, "_blank");
    }
  });

  // ---------- Drawer ----------
  const menuBtn = $("menuBtn");
  const menuClose = $("menuClose");
  const drawer = $("drawer");
  const drawerOverlay = $("drawerOverlay");

  function openDrawer() {
    drawer?.classList.add("open");
    if (drawerOverlay) drawerOverlay.hidden = false;
    drawer?.setAttribute("aria-hidden", "false");
    menuBtn?.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  function closeDrawer() {
    drawer?.classList.remove("open");
    if (drawerOverlay) drawerOverlay.hidden = true;
    drawer?.setAttribute("aria-hidden", "true");
    menuBtn?.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  menuBtn?.addEventListener("click", () => {
    if (drawer?.classList.contains("open")) closeDrawer();
    else openDrawer();
  });

  menuClose?.addEventListener("click", closeDrawer);
  drawerOverlay?.addEventListener("click", closeDrawer);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer?.classList.contains("open")) closeDrawer();
  });

  drawer?.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const tab = btn.getAttribute("data-tab");
    if (tab) {
      closeDrawer();
      showTab(tab);
      if (tab === "today") renderToday();
    }
  });

  $("mTodayMatch")?.addEventListener("click", () => {
    closeDrawer();
    showTab("today");
    renderToday();
  });

  $("mOpenMatch")?.addEventListener("click", () => {
    closeDrawer();
    showTab("match");
    if (selectedCustomerId) renderMatch();
    else {
      if (matchEmptyEl) matchEmptyEl.style.display = "block";
    }
  });

  $("mBackup")?.addEventListener("click", () => {
    closeDrawer();
    btnBackup?.click();
  });

  $("mRestore")?.addEventListener("click", () => {
    closeDrawer();
    btnRestore?.click();
  });

  $("mExportCustomers")?.addEventListener("click", () => {
    closeDrawer();
    $("btnExport")?.click();
  });

  $("mExportPortfolios")?.addEventListener("click", () => {
    closeDrawer();
    $("pBtnExport")?.click();
  });

  $("mWipeCustomers")?.addEventListener("click", () => {
    closeDrawer();
    $("btnWipe")?.click();
  });

  $("mWipePortfolios")?.addEventListener("click", () => {
    closeDrawer();
    $("pBtnWipe")?.click();
  });

  // ---------- Init ----------
  renderCustomers();
  resetCustomerForm();
  renderPortfolios();
  resetPortfolioForm();
  syncRoomsVisibility();
  renderToday();
  closeMatch();
  showTab("customers");
})();
</script>
