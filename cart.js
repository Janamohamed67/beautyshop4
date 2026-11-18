/* ==========================================================
   cart.js  -  shopping cart logic (shared by ALL pages)
   - Stores the cart in localStorage so it survives page changes
   - addToCart(id) is called from main.js (product cards)
   - Calculates subtotal, discount, shipping and total
   - Draws the cart page (cart.html)
   Depends on: products.js (the "products" array)
   ========================================================== */

const CART_KEY = "beautyShopCart";
const PROMO_KEY = "beautyShopPromo";
const SHIPPING_FEE = 50;            // EGP
const FREE_SHIPPING_FROM = 1000;    // EGP, subtotal needed for free shipping
const PROMO_CODES = { BEAUTY10: 0.10 };   // code -> discount rate (10%)
const MAX_QTY = 10;                 // max units of one product

/* ---------- storage helpers (safe if storage is blocked) ---------- */
function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (err) {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) { /* storage full or blocked: ignore */ }
}

function removeStorage(key) {
  try { localStorage.removeItem(key); } catch (err) { /* ignore */ }
}

/* ---------- cart data ---------- */
function getCart() {
  const cart = readStorage(CART_KEY, []);
  if (!Array.isArray(cart)) return [];
  /* keep only valid lines for products that really exist */
  return cart.filter(function (line) {
    return line && getProductById(line.id) && line.qty > 0;
  });
}

function saveCart(cart) {
  writeStorage(CART_KEY, cart);
  updateCartBadge();
}

function getProductById(id) {
  return products.find(function (p) { return p.id === Number(id); });
}

function addToCart(id) {
  const product = getProductById(id);
  if (!product) return;

  const cart = getCart();
  const line = cart.find(function (l) { return l.id === product.id; });

  if (line) {
    if (line.qty >= MAX_QTY) {
      showToast("You can order up to " + MAX_QTY + " of the same product.");
      return;
    }
    line.qty += 1;
  } else {
    cart.push({ id: product.id, qty: 1 });
  }
  saveCart(cart);
  showToast(product.name + " added to your cart.");
}

function changeQty(id, delta) {
  const cart = getCart();
  const line = cart.find(function (l) { return l.id === Number(id); });
  if (!line) return;
  line.qty = Math.min(MAX_QTY, Math.max(1, line.qty + delta));
  saveCart(cart);
}

function removeFromCart(id) {
  saveCart(getCart().filter(function (l) { return l.id !== Number(id); }));
}

function clearCart() {
  removeStorage(CART_KEY);
  removeStorage(PROMO_KEY);
  updateCartBadge();
}

/* ---------- calculations ---------- */
function getPromoCode() {
  const code = readStorage(PROMO_KEY, "");
  return PROMO_CODES[code] ? code : "";
}

function calculateTotals() {
  const cart = getCart();
  const itemCount = cart.reduce(function (sum, l) { return sum + l.qty; }, 0);
  const subtotal = cart.reduce(function (sum, l) {
    return sum + getProductById(l.id).price * l.qty;
  }, 0);
  const code = getPromoCode();
  const discount = code ? Math.round(subtotal * PROMO_CODES[code]) : 0;
  const afterDiscount = subtotal - discount;
  const shipping = (itemCount === 0 || afterDiscount >= FREE_SHIPPING_FROM) ? 0 : SHIPPING_FEE;
  return {
    itemCount: itemCount,
    subtotal: subtotal,
    discount: discount,
    shipping: shipping,
    total: afterDiscount + shipping,
    code: code
  };
}

function money(value) {
  return value.toLocaleString("en-US") + " EGP";
}

/* ---------- header badge + toast message (all pages) ---------- */
function updateCartBadge() {
  const count = calculateTotals().itemCount;
  document.querySelectorAll('.main-nav a[href="cart.html"]').forEach(function (link) {
    let badge = link.querySelector(".cart-count");
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "cart-count";
      link.appendChild(badge);
    }
    badge.textContent = count;
    badge.hidden = count === 0;
    link.setAttribute("aria-label", "Cart, " + count + (count === 1 ? " item" : " items"));
  });
}

let toastTimer;
function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 2500);
}

/* ---------- order summary box (used by cart + checkout pages) ---------- */
function summaryRows(t) {
  let html = `<dt>Subtotal (${t.itemCount} ${t.itemCount === 1 ? "item" : "items"})</dt><dd>${money(t.subtotal)}</dd>`;
  if (t.discount > 0) {
    html += `<dt>Promo ${t.code}</dt><dd class="discount">-${money(t.discount)}</dd>`;
  }
  html += `<dt>Shipping</dt><dd>${t.shipping === 0 ? "Free" : money(t.shipping)}</dd>`;
  html += `<dt class="total-label">Total</dt><dd class="total-value">${money(t.total)}</dd>`;
  return html;
}

/* ---------- Cart page ---------- */
function renderCartPage() {
  const list = document.getElementById("cart-items");
  if (!list) return;

  const cart = getCart();
  const content = document.getElementById("cart-content");
  const empty = document.getElementById("cart-empty");

  if (cart.length === 0) {
    content.hidden = true;
    empty.hidden = false;
    return;
  }
  content.hidden = false;
  empty.hidden = true;

  list.innerHTML = cart.map(function (line) {
    const p = getProductById(line.id);
    return `
      <li class="cart-line">
        <a class="cart-thumb tone-${p.id}" href="product-details.html?id=${p.id}">
          <img src="${p.image}" alt="" onerror="this.remove()">
        </a>
        <div class="cart-info">
          <h3><a href="product-details.html?id=${p.id}">${p.name}</a></h3>
          <p class="card-category">${p.category} &middot; ${money(p.price)} each</p>
          <button class="link-btn" type="button" data-remove="${p.id}">Remove</button>
        </div>
        <div class="qty" role="group" aria-label="Quantity of ${p.name}">
          <button type="button" data-minus="${p.id}" aria-label="Decrease quantity" ${line.qty <= 1 ? "disabled" : ""}>&minus;</button>
          <span aria-live="polite">${line.qty}</span>
          <button type="button" data-plus="${p.id}" aria-label="Increase quantity" ${line.qty >= MAX_QTY ? "disabled" : ""}>+</button>
        </div>
        <p class="line-total">${money(p.price * line.qty)}</p>
      </li>`;
  }).join("");

  const t = calculateTotals();
  document.getElementById("cart-summary").innerHTML = summaryRows(t);

  const hint = document.getElementById("shipping-hint");
  const afterDiscount = t.subtotal - t.discount;
  hint.textContent = afterDiscount >= FREE_SHIPPING_FROM
    ? "Your order ships free."
    : "Add " + money(FREE_SHIPPING_FROM - afterDiscount) + " more for free shipping.";
}

function setupCartPage() {
  const list = document.getElementById("cart-items");
  if (!list) return;

  list.addEventListener("click", function (e) {
    const plus = e.target.closest("[data-plus]");
    const minus = e.target.closest("[data-minus]");
    const remove = e.target.closest("[data-remove]");
    if (plus) changeQty(plus.dataset.plus, 1);
    else if (minus) changeQty(minus.dataset.minus, -1);
    else if (remove) removeFromCart(remove.dataset.remove);
    else return;
    renderCartPage();
  });

  document.getElementById("clear-cart").addEventListener("click", function () {
    if (confirm("Remove all items from your cart?")) {
      clearCart();
      renderCartPage();
    }
  });

  /* promo code */
  const promoForm = document.getElementById("promo-form");
  const promoMsg = document.getElementById("promo-msg");
  promoForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const code = document.getElementById("promo-input").value.trim().toUpperCase();
    promoMsg.className = "feedback";
    if (PROMO_CODES[code]) {
      writeStorage(PROMO_KEY, code);
      promoMsg.textContent = "Code " + code + " applied: " + (PROMO_CODES[code] * 100) + "% off.";
      promoMsg.classList.add("success");
    } else {
      promoMsg.textContent = "This code is not valid.";
      promoMsg.classList.add("error");
    }
    renderCartPage();
  });

  renderCartPage();
}

/* ---------- start ---------- */
updateCartBadge();
setupCartPage();

/* if the user comes back with the browser Back button, refresh the numbers */
window.addEventListener("pageshow", function () {
  updateCartBadge();
  renderCartPage();
});
