/* UI-only ticket marketplace demo (no backend) */

const EVENTS = [
  {
    id: "neon-nights",
    title: "Neon Nights Festival",
    category: "music",
    dateLabel: "Sat • 8:00 PM",
    dateISO: "2026-02-07T20:00:00",
    venue: "Downtown Arena",
    city: "San Francisco, CA",
    trendingScore: 98,
    baseFrom: 49,
    tags: ["Featured", "Instant delivery"],
    tiers: [
      { key: "ga", name: "General Admission", desc: "Main floor access • Great energy.", price: 49, inventory: "Limited" },
      { key: "balcony", name: "Balcony", desc: "Elevated view • Best value rows E–H.", price: 69, inventory: "Good" },
      { key: "floor", name: "Floor+", desc: "Closer to stage • Early entry lane.", price: 99, inventory: "Low" },
      { key: "vip", name: "VIP", desc: "Lounge access • Fast entry + merch.", price: 149, inventory: "Very low" }
    ]
  },
  {
    id: "city-derby",
    title: "City Derby: United vs. Rangers",
    category: "sports",
    dateLabel: "Sun • 3:30 PM",
    dateISO: "2026-02-15T15:30:00",
    venue: "Harbor Stadium",
    city: "Seattle, WA",
    trendingScore: 92,
    baseFrom: 39,
    tags: ["Mobile ticket"],
    tiers: [
      { key: "upper", name: "Upper Bowl", desc: "Budget-friendly • Clear view.", price: 39, inventory: "Good" },
      { key: "lower", name: "Lower Bowl", desc: "Closer action • Great atmosphere.", price: 79, inventory: "Limited" },
      { key: "club", name: "Club Seats", desc: "Premium sections • Club access.", price: 129, inventory: "Low" },
      { key: "sideline", name: "Sideline+", desc: "Near midfield • Best vantage.", price: 179, inventory: "Very low" }
    ]
  },
  {
    id: "late-night-laughs",
    title: "Late Night Laughs (Stand-up)",
    category: "comedy",
    dateLabel: "Fri • 9:00 PM",
    dateISO: "2026-02-06T21:00:00",
    venue: "The Brickhouse",
    city: "Austin, TX",
    trendingScore: 85,
    baseFrom: 24,
    tags: ["Instant delivery"],
    tiers: [
      { key: "ga", name: "General Seating", desc: "First come • Fun, cozy room.", price: 24, inventory: "Good" },
      { key: "front", name: "Front Rows", desc: "Closer to the action • Expect crowd work.", price: 42, inventory: "Limited" },
      { key: "table", name: "Table", desc: "Reserved table seating • Best comfort.", price: 58, inventory: "Low" },
      { key: "premium", name: "Premium", desc: "Premium table • Dedicated server lane.", price: 74, inventory: "Very low" }
    ]
  },
  {
    id: "phantom-street",
    title: "Phantom Street — Broadway Tour",
    category: "theatre",
    dateLabel: "Wed • 7:30 PM",
    dateISO: "2026-03-04T19:30:00",
    venue: "Grand Theatre",
    city: "Chicago, IL",
    trendingScore: 90,
    baseFrom: 59,
    tags: ["Best seller"],
    tiers: [
      { key: "mezz", name: "Mezzanine", desc: "Balanced view • Great acoustics.", price: 59, inventory: "Good" },
      { key: "orch", name: "Orchestra", desc: "Closer performance • Premium view.", price: 99, inventory: "Limited" },
      { key: "box", name: "Box Seats", desc: "Side boxes • Unique angle.", price: 119, inventory: "Low" },
      { key: "prem", name: "Premier", desc: "Center orchestra • Top tier.", price: 159, inventory: "Very low" }
    ]
  },
  {
    id: "midnight-synth",
    title: "Midnight Synth Live",
    category: "music",
    dateLabel: "Thu • 8:30 PM",
    dateISO: "2026-02-19T20:30:00",
    venue: "Pulse Hall",
    city: "Los Angeles, CA",
    trendingScore: 83,
    baseFrom: 34,
    tags: ["Mobile ticket"],
    tiers: [
      { key: "ga", name: "General Admission", desc: "Standing room • Big sound.", price: 34, inventory: "Good" },
      { key: "balcony", name: "Balcony", desc: "Seated view • Chill vibe.", price: 48, inventory: "Good" },
      { key: "pit", name: "Pit", desc: "Front pit • High energy.", price: 79, inventory: "Limited" },
      { key: "vip", name: "VIP", desc: "Meet & greet • Signed poster.", price: 139, inventory: "Low" }
    ]
  },
  {
    id: "hoops-night",
    title: "Hoops Night: Kings vs. Waves",
    category: "sports",
    dateLabel: "Mon • 7:00 PM",
    dateISO: "2026-02-23T19:00:00",
    venue: "Metro Center",
    city: "New York, NY",
    trendingScore: 79,
    baseFrom: 29,
    tags: ["Family friendly"],
    tiers: [
      { key: "upper", name: "Upper Bowl", desc: "Great value • Quick entry lanes.", price: 29, inventory: "Good" },
      { key: "lower", name: "Lower Bowl", desc: "Closer play • Great energy.", price: 69, inventory: "Limited" },
      { key: "club", name: "Club", desc: "Premium seating • Lounge access.", price: 119, inventory: "Low" },
      { key: "courtside", name: "Courtside", desc: "Closest seats • VIP entrance.", price: 249, inventory: "Very low" }
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

  if (state.category !== "all") {
    list = list.filter((e) => e.category === state.category);
  }
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
  const map = { music: "Music", sports: "Sports", theatre: "Theatre", comedy: "Comedy" };
  return map[cat] || "Event";
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
    $("#promoHint").textContent = "UI-only: discounts are simulated for demo purposes.";
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
    $("#promoHint").textContent = "UI-only: discounts are simulated for demo purposes.";
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

  // UI-only: a couple demo codes
  const promos = {
    NEON10: 10,
    VIP15: 15,
    SAVE5: 5
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
      state.category = "all";
      state.sort = "trending";
      $("#searchInput").value = "";
      $("#categorySelect").value = "all";
      $("#sortSelect").value = "trending";
      renderEvents();
      showToast("Filters reset", "🧹");
      return;
    }
    if (action === "buy-featured") {
      openTicketModal("neon-nights", "balcony");
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
      showToast("Order placed (UI only)", "🎉");
      clearCheckout();
      return;
    }
    if (action === "open-promo") {
      $("#promoInput").value = "NEON10";
      renderCheckout();
      $("#checkoutModal").showModal();
      showToast("Try promo: NEON10", "🏷️");
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
  $("#categorySelect").addEventListener("change", (e) => {
    state.category = e.target.value || "all";
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


