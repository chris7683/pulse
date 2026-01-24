/* Pulse Prom Booking System */

const EVENTS = [
  {
    id: "ebis-prom",
    title: "EBIS Prom",
    category: "prom",
    dateLabel: "Sat • 7:00 PM",
    dateISO: "2026-05-14T19:00:00",
    venue: "Grand Ballroom",
    city: "Downtown",
    trendingScore: 98,
    baseFrom: 75,
    tags: ["Featured", "Popular"],
    tiers: [
      { key: "standing", name: "Standing", desc: "General admission • Dance floor access.", price: 75, inventory: "Good" },
      { key: "vip", name: "VIP", desc: "VIP section • Premium experience.", price: 120, inventory: "Limited" },
      { key: "lounge", name: "Lounge", desc: "Lounge access • Best seats in house.", price: 150, inventory: "Low" }
    ]
  },
  {
    id: "ais",
    title: "AIS",
    category: "prom",
    dateLabel: "Fri • 8:00 PM",
    dateISO: "2026-05-20T20:00:00",
    venue: "Crystal Hall",
    city: "City Center",
    trendingScore: 92,
    baseFrom: 65,
    tags: ["Popular"],
    tiers: [
      { key: "standing", name: "Standing", desc: "General admission • Full venue access.", price: 65, inventory: "Good" },
      { key: "vip", name: "VIP", desc: "VIP area • Exclusive access.", price: 110, inventory: "Limited" },
      { key: "lounge", name: "Lounge", desc: "Lounge seating • Premium comfort.", price: 140, inventory: "Low" }
    ]
  },
  {
    id: "ces",
    title: "CES",
    category: "prom",
    dateLabel: "Sat • 7:30 PM",
    dateISO: "2026-05-28T19:30:00",
    venue: "Elegance Center",
    city: "Uptown",
    trendingScore: 88,
    baseFrom: 70,
    tags: ["Elegant"],
    tiers: [
      { key: "standing", name: "Standing", desc: "General admission • Main floor.", price: 70, inventory: "Good" },
      { key: "vip", name: "VIP", desc: "VIP section • Special treatment.", price: 115, inventory: "Limited" },
      { key: "lounge", name: "Lounge", desc: "Lounge area • Premium experience.", price: 145, inventory: "Low" }
    ]
  },
  {
    id: "nis",
    title: "NIS",
    category: "prom",
    dateLabel: "Fri • 8:30 PM",
    dateISO: "2026-06-04T20:30:00",
    venue: "Majestic Venue",
    city: "Riverside",
    trendingScore: 85,
    baseFrom: 80,
    tags: ["Exclusive"],
    tiers: [
      { key: "standing", name: "Standing", desc: "General admission • Full access.", price: 80, inventory: "Good" },
      { key: "vip", name: "VIP", desc: "VIP access • Exclusive perks.", price: 125, inventory: "Limited" },
      { key: "lounge", name: "Lounge", desc: "Lounge tickets • Best experience.", price: 160, inventory: "Low" }
    ]
  }
];

const state = {
  query: "",
  category: "all",
  sort: "trending",
  cart: [],
  promo: null, // { code, percent }
  modal: {
    eventId: null,
    tierKey: null,
    qty: 2
  }
};

const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const $ = (sel, root = document) => root.querySelector(sel);

function formatMoney(n) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function getEventById(id) {
  return EVENTS.find((e) => e.id === id);
}

function tierAvailabilityDot(inv) {
  // purely visual; style uses yellow by default
  return inv?.toLowerCase?.().includes("good") ? "good" : "low";
}

function computeFees(subtotal) {
  // UI-only fee model: 9% + $2.50
  const fee = subtotal * 0.09 + 2.5;
  return Math.round(fee * 100) / 100;
}

function computePromoDiscount(itemsSubtotal) {
  if (!state.promo) return 0;
  const raw = itemsSubtotal * (state.promo.percent / 100);
  return Math.round(raw * 100) / 100;
}

function cartTotals() {
  const items = state.cart.reduce((sum, it) => sum + it.unitPrice * it.qty, 0);
  const discount = computePromoDiscount(items);
  const discountedSubtotal = Math.max(0, items - discount);
  const fees = computeFees(discountedSubtotal);
  const total = Math.max(0, discountedSubtotal + fees);
  return { items, discount, fees, total };
}

function renderEvents() {
  const grid = $("#eventGrid");
  const empty = $("#emptyState");

  const q = state.query.trim().toLowerCase();
  let list = EVENTS.slice();

  // All events are proms, so category filter is not needed
  // Keeping the filter structure for potential future use
  if (q) {
    list = list.filter((e) => {
      const hay = `${e.title} ${e.venue} ${e.city} ${e.category}`.toLowerCase();
      return hay.includes(q);
    });
  }

  switch (state.sort) {
    case "price_asc":
      list.sort((a, b) => a.baseFrom - b.baseFrom);
      break;
    case "price_desc":
      list.sort((a, b) => b.baseFrom - a.baseFrom);
      break;
    case "date_asc":
      list.sort((a, b) => new Date(a.dateISO) - new Date(b.dateISO));
      break;
    default:
      list.sort((a, b) => b.trendingScore - a.trendingScore);
      break;
  }

  grid.innerHTML = "";

  if (!list.length) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  for (const e of list) {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="card-top">
        <div class="card-tag">${escapeHtml(labelCategory(e.category))}</div>
        <div class="card-heat"><span class="heat-dot" aria-hidden="true"></span> Trending</div>
      </div>
      <div class="card-body">
        <div class="card-title">${escapeHtml(e.title)}</div>
        <div class="card-meta">
          <span class="meta-pill">${escapeHtml(e.dateLabel)}</span>
          <span class="meta-pill">${escapeHtml(e.venue)}</span>
          <span class="meta-pill">${escapeHtml(e.city)}</span>
        </div>
      </div>
      <div class="card-foot">
        <div class="card-price">
          <span>from</span>
          <strong>${formatMoney(e.baseFrom)}</strong>
          <span>/ea</span>
        </div>
        <div class="card-actions">
          <button class="btn btn-ghost btn-mini" type="button" data-action="quick-view" data-event="${e.id}">View</button>
          <button class="btn btn-primary btn-mini" type="button" data-action="buy" data-event="${e.id}">Buy</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  }
}

function labelCategory(cat) {
  const map = { prom: "Prom" };
  return map[cat] || "Prom";
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function openTicketModal(eventId, preselectTierKey = null) {
  const ev = getEventById(eventId);
  if (!ev) return;

  state.modal.eventId = eventId;
  state.modal.tierKey = preselectTierKey || ev.tiers[0]?.key || null;
  state.modal.qty = clamp(state.modal.qty || 2, 1, 10);

  $("#modalEyebrow").textContent = labelCategory(ev.category);
  $("#modalEventTitle").textContent = ev.title;
  $("#modalEventMeta").textContent = `${ev.dateLabel} • ${ev.venue}`;

  $("#qtyInput").value = String(state.modal.qty);
  renderTierGrid(ev);
  recalcModalTotals();

  const dlg = $("#ticketModal");
  if (!dlg.open) dlg.showModal();
}

function renderTierGrid(ev) {
  const grid = $("#tierGrid");
  grid.innerHTML = "";

  for (const t of ev.tiers) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = `tier ${t.key === state.modal.tierKey ? "selected" : ""}`;
    el.dataset.tier = t.key;
    el.innerHTML = `
      <div class="tier-title">${escapeHtml(t.name)}</div>
      <div class="tier-sub">${escapeHtml(t.desc)}</div>
      <div class="tier-price"><strong>${formatMoney(t.price)}</strong><span>/ea</span></div>
      <div class="tier-availability">
        <span class="avail-dot" aria-hidden="true"></span>
        <span>${escapeHtml(t.inventory)} availability</span>
      </div>
    `;
    el.addEventListener("click", () => {
      state.modal.tierKey = t.key;
      renderTierGrid(ev);
      recalcModalTotals();
    });
    grid.appendChild(el);
  }
}

function recalcModalTotals() {
  const ev = getEventById(state.modal.eventId);
  if (!ev) return;
  const tier = ev.tiers.find((t) => t.key === state.modal.tierKey) || ev.tiers[0];
  if (!tier) return;

  const qty = clamp(parseInt($("#qtyInput").value || "1", 10) || 1, 1, 10);
  state.modal.qty = qty;

  const subtotal = tier.price * qty;
  const fee = computeFees(subtotal);
  const total = subtotal + fee;
  $("#modalSubtotal").textContent = formatMoney(subtotal);
  $("#modalFee").textContent = formatMoney(fee);
  $("#modalTotal").textContent = formatMoney(total);
}

function addModalSelectionToCheckout() {
  const ev = getEventById(state.modal.eventId);
  if (!ev) return;
  const tier = ev.tiers.find((t) => t.key === state.modal.tierKey);
  if (!tier) return;

  const delivery = ($('input[name="delivery"]:checked')?.value) || "mobile";
  const qty = clamp(state.modal.qty || 1, 1, 10);

  const key = `${ev.id}:${tier.key}:${delivery}`;
  const existing = state.cart.find((c) => c.key === key);
  if (existing) {
    existing.qty = clamp(existing.qty + qty, 1, 10);
  } else {
    state.cart.push({
      key,
      eventId: ev.id,
      eventTitle: ev.title,
      eventMeta: `${ev.dateLabel} • ${ev.venue}`,
      tierKey: tier.key,
      tierName: tier.name,
      delivery,
      qty,
      unitPrice: tier.price
    });
  }

  showToast("Added to checkout", "✅");
  updateCartPill();
  renderCheckout();
  $("#ticketModal").close();
  $("#checkoutModal").showModal();
}

function updateCartPill() {
  const count = state.cart.reduce((sum, it) => sum + it.qty, 0);
  $("#cartCountPill").textContent = String(count);
}

function renderCheckout() {
  const cartList = $("#cartList");
  const empty = $("#cartEmpty");
  const has = state.cart.length > 0;
  cartList.innerHTML = "";
  empty.hidden = has;

  if (!has) {
    $("#checkoutItems").textContent = formatMoney(0);
    $("#checkoutFees").textContent = formatMoney(0);
    $("#checkoutTotal").textContent = formatMoney(0);
      $("#promoHint").textContent = "Enter a promo code to apply a discount to your booking.";
    return;
  }

  for (const it of state.cart) {
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <div class="cart-top">
        <div>
          <div class="cart-title">${escapeHtml(it.eventTitle)}</div>
          <div class="cart-sub">${escapeHtml(it.eventMeta)}</div>
        </div>
        <div class="cart-right">
          <span class="cart-pill">${escapeHtml(it.tierName)}</span>
          <span class="cart-pill">${escapeHtml(it.delivery === "mobile" ? "Mobile" : "Will-call")}</span>
        </div>
      </div>
      <div class="total-row">
        <span class="muted">${it.qty} × ${formatMoney(it.unitPrice)}</span>
        <span>${formatMoney(it.unitPrice * it.qty)}</span>
      </div>
      <div class="cart-actions">
        <button class="btn btn-ghost btn-mini" type="button" data-action="item-dec" data-key="${escapeHtml(it.key)}">−</button>
        <button class="btn btn-ghost btn-mini" type="button" data-action="item-inc" data-key="${escapeHtml(it.key)}">+</button>
        <button class="btn btn-ghost btn-mini" type="button" data-action="item-remove" data-key="${escapeHtml(it.key)}">Remove</button>
      </div>
    `;
    cartList.appendChild(row);
  }

  const { items, discount, fees, total } = cartTotals();
  const itemsAfterDiscount = Math.max(0, items - discount);

  $("#checkoutItems").textContent = formatMoney(itemsAfterDiscount);
  $("#checkoutFees").textContent = formatMoney(fees);
  $("#checkoutTotal").textContent = formatMoney(total);

  if (state.promo && discount > 0) {
    $("#promoHint").textContent = `Promo applied: ${state.promo.code} (−${state.promo.percent}%). You saved ${formatMoney(discount)}.`;
  } else if (state.promo) {
    $("#promoHint").textContent = `Promo applied: ${state.promo.code}.`;
  } else {
      $("#promoHint").textContent = "Enter a promo code to apply a discount to your booking.";
  }
}

function mutateItemQty(key, delta) {
  const it = state.cart.find((c) => c.key === key);
  if (!it) return;
  it.qty = clamp(it.qty + delta, 1, 10);
  showToast("Updated checkout", "🧾");
  updateCartPill();
  renderCheckout();
}

function removeItem(key) {
  state.cart = state.cart.filter((c) => c.key !== key);
  showToast("Removed item", "🗑️");
  updateCartPill();
  renderCheckout();
}

function clearCheckout() {
  state.cart = [];
  state.promo = null;
  $("#promoInput").value = "";
  showToast("Checkout cleared", "🧼");
  updateCartPill();
  renderCheckout();
}

function applyPromo(codeRaw) {
  const code = (codeRaw || "").trim().toUpperCase();
  if (!code) {
    state.promo = null;
    showToast("Promo cleared", "🏷️");
    renderCheckout();
    return;
  }

  // Promo codes for Pulse
  const promos = {
    PULSE10: 10,
    VIP15: 15,
    PROM5: 5
  };
  const percent = promos[code];
  if (!percent) {
    showToast("Invalid promo (UI)", "⚠️");
    return;
  }
  state.promo = { code, percent };
  showToast(`Promo applied: ${code}`, "🏷️");
  renderCheckout();
}

let toastTimer = null;
function showToast(message, ico = "✅") {
  const toast = $("#toast");
  $("#toastMsg").textContent = message;
  $("#toastIco").textContent = ico;
  toast.hidden = false;
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 2200);
}

function scrollToEvents() {
  $("#events")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function initShortcuts() {
  // Cmd/Ctrl+K focuses search
  window.addEventListener("keydown", (e) => {
    const isK = (e.key || "").toLowerCase() === "k";
    const isMod = e.metaKey || e.ctrlKey;
    if (isK && isMod) {
      e.preventDefault();
      $("#searchInput")?.focus();
    }
  });
}

function bindGlobalActions() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === "scroll-events") {
      scrollToEvents();
      return;
    }
    if (action === "reset-filters") {
      state.query = "";
      state.sort = "trending";
      $("#searchInput").value = "";
      $("#sortSelect").value = "trending";
      renderEvents();
      showToast("Filters reset", "🧹");
      return;
    }
    if (action === "buy-featured") {
      openTicketModal("ebis-prom", "standing");
      return;
    }
    if (action === "buy" || action === "quick-view") {
      const eventId = btn.dataset.event;
      openTicketModal(eventId);
      return;
    }
    if (action === "qty-down") {
      const next = clamp((parseInt($("#qtyInput").value || "1", 10) || 1) - 1, 1, 10);
      $("#qtyInput").value = String(next);
      recalcModalTotals();
      return;
    }
    if (action === "qty-up") {
      const next = clamp((parseInt($("#qtyInput").value || "1", 10) || 1) + 1, 1, 10);
      $("#qtyInput").value = String(next);
      recalcModalTotals();
      return;
    }
    if (action === "add-to-checkout") {
      addModalSelectionToCheckout();
      return;
    }
    if (action === "open-cart") {
      renderCheckout();
      $("#checkoutModal").showModal();
      return;
    }
    if (action === "clear-checkout") {
      clearCheckout();
      return;
    }
    if (action === "apply-promo") {
      applyPromo($("#promoInput").value);
      return;
    }
    if (action === "place-order") {
      if (!state.cart.length) {
        showToast("Add a ticket first", "🧺");
        return;
      }
      showToast("Booking confirmed!", "🎉");
      clearCheckout();
      return;
    }
    if (action === "open-promo") {
      $("#promoInput").value = "PULSE10";
      renderCheckout();
      $("#checkoutModal").showModal();
      showToast("Try promo: PULSE10", "🏷️");
      return;
    }

    // cart item actions (inside checkout modal)
    if (action === "item-inc") mutateItemQty(btn.dataset.key, +1);
    if (action === "item-dec") mutateItemQty(btn.dataset.key, -1);
    if (action === "item-remove") removeItem(btn.dataset.key);
  });

  $("#qtyInput").addEventListener("input", () => recalcModalTotals());
  $("#qtyInput").addEventListener("blur", () => {
    $("#qtyInput").value = String(clamp(parseInt($("#qtyInput").value || "1", 10) || 1, 1, 10));
    recalcModalTotals();
  });

  $("#searchInput").addEventListener("input", (e) => {
    state.query = e.target.value || "";
    renderEvents();
  });
  $("#sortSelect").addEventListener("change", (e) => {
    state.sort = e.target.value || "trending";
    renderEvents();
  });
}

function init() {
  $("#year").textContent = String(new Date().getFullYear());
  renderEvents();
  updateCartPill();
  renderCheckout();
  bindGlobalActions();
  initShortcuts();
}

init();



