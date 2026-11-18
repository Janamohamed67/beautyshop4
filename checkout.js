/* ==========================================================
   checkout.js  -  checkout form validation + confirmation page
   Used by: checkout.html and confirmation.html
   Depends on: products.js and cart.js (loaded before this file)
   ========================================================== */

const ORDER_KEY = "beautyShopLastOrder";

/* make user text safe before putting it inside HTML */
function esc(text) {
  return String(text).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

/* ---------- validation rules (each returns "" when OK, or an error text) ---------- */
const rules = {
  fullName: function (v) {
    if (v.length < 3) return "Please enter your full name (at least 3 letters).";
    if (!/^[A-Za-z\u0600-\u06FF\s.'-]+$/.test(v)) return "Names can only contain letters and spaces.";
    return "";
  },
  email: function (v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : "Please enter a valid email, for example name@example.com.";
  },
  phone: function (v) {
    const digits = v.replace(/[\s-]/g, "");
    /* Egyptian mobile: 01X XXXX XXXX, optionally with +20 */
    return /^(\+20|0020|0)?1[0125]\d{8}$/.test(digits) ? "" : "Enter a valid Egyptian mobile number, for example 0100 000 0000.";
  },
  address: function (v) {
    return v.length >= 8 ? "" : "Please enter your street, building and apartment (at least 8 characters).";
  },
  city: function (v) {
    return v !== "" ? "" : "Please choose your city.";
  },
  cardNumber: function (v) {
    const digits = v.replace(/\s/g, "");
    if (!/^\d{16}$/.test(digits)) return "Card number must have 16 digits.";
    return passesLuhn(digits) ? "" : "This card number is not valid. Please check the digits.";
  },
  cardExpiry: function (v) {
    const m = /^(\d{2})\s*\/\s*(\d{2})$/.exec(v);
    if (!m) return "Use the format MM/YY, for example 08/28.";
    const month = Number(m[1]);
    const year = 2000 + Number(m[2]);
    if (month < 1 || month > 12) return "Month must be between 01 and 12.";
    const now = new Date();
    /* a card is valid until the end of its expiry month */
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);
    return endOfMonth >= now ? "" : "This card has expired.";
  },
  cardCvv: function (v) {
    return /^\d{3,4}$/.test(v) ? "" : "CVV has 3 or 4 digits.";
  }
};

/* Luhn algorithm: standard check that a card number is well formed */
function passesLuhn(digits) {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

/* ---------- show / clear an error under one field ---------- */
function setFieldError(input, message) {
  const row = input.closest(".form-row");
  const errorBox = row.querySelector(".field-error");
  errorBox.textContent = message;
  row.classList.toggle("has-error", message !== "");
  input.setAttribute("aria-invalid", message !== "" ? "true" : "false");
}

function validateField(input) {
  const rule = rules[input.name];
  if (!rule || input.closest("[hidden]")) return true;
  const message = rule(input.value.trim());
  setFieldError(input, message);
  return message === "";
}

/* ---------- Checkout page ---------- */
function renderCheckoutSummary() {
  const box = document.getElementById("checkout-items");
  const t = calculateTotals();
  box.innerHTML = getCart().map(function (line) {
    const p = getProductById(line.id);
    return `<li><span>${p.name} <small>x ${line.qty}</small></span><span>${money(p.price * line.qty)}</span></li>`;
  }).join("");
  document.getElementById("checkout-summary").innerHTML = summaryRows(t);
}

function buildOrder(form) {
  const t = calculateTotals();
  const get = function (name) { return form.elements[name].value.trim(); };
  return {
    id: "BC-" + Date.now().toString().slice(-8),
    date: new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }),
    customer: {
      name: get("fullName"),
      email: get("email"),
      phone: get("phone"),
      address: get("address") + ", " + get("city")
    },
    payment: form.elements["payment"].value,   /* card details are never stored */
    items: getCart().map(function (line) {
      const p = getProductById(line.id);
      return { name: p.name, qty: line.qty, price: p.price };
    }),
    totals: t
  };
}

function setupCheckoutPage() {
  const form = document.getElementById("checkout-form");
  if (!form) return;

  const emptyBox = document.getElementById("checkout-empty");
  if (getCart().length === 0) {
    form.closest("[data-checkout-content]").hidden = true;
    emptyBox.hidden = false;
    return;
  }
  renderCheckoutSummary();

  /* validate each field when the user leaves it, and re-check while fixing an error */
  form.querySelectorAll("input[name], select[name], textarea[name]").forEach(function (input) {
    input.addEventListener("blur", function () { validateField(input); });
    input.addEventListener("input", function () {
      if (input.getAttribute("aria-invalid") === "true") validateField(input);
    });
  });

  /* card number: add a space after every 4 digits */
  form.elements["cardNumber"].addEventListener("input", function (e) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
    e.target.value = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  });
  /* expiry: add the slash automatically */
  form.elements["cardExpiry"].addEventListener("input", function (e) {
    let digits = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) digits = digits.slice(0, 2) + "/" + digits.slice(2);
    e.target.value = digits;
  });

  /* show card fields only when "Credit / debit card" is chosen */
  const cardBox = document.getElementById("card-fields");
  form.querySelectorAll('input[name="payment"]').forEach(function (radio) {
    radio.addEventListener("change", function () {
      cardBox.hidden = form.elements["payment"].value !== "card";
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const fields = Array.from(form.querySelectorAll("input[name], select[name], textarea[name]"));
    let firstBad = null;
    fields.forEach(function (input) {
      if (!validateField(input) && !firstBad) firstBad = input;
    });

    const summary = document.getElementById("form-error-summary");
    if (firstBad) {
      summary.textContent = "Please fix the highlighted fields and try again.";
      firstBad.focus();
      return;
    }
    summary.textContent = "";

    const order = buildOrder(form);
    writeStorage(ORDER_KEY, order);
    clearCart();
    window.location.href = "confirmation.html";
  });
}

/* ---------- Confirmation page ---------- */
function renderConfirmation() {
  const box = document.getElementById("order-box");
  if (!box) return;

  const order = readStorage(ORDER_KEY, null);
  if (!order) {
    box.innerHTML = `
      <h1>No recent order</h1>
      <p>We could not find an order to show. Start shopping and your confirmation will appear here.</p>
      <a class="btn" href="products.html">Browse products</a>`;
    return;
  }

  const payText = order.payment === "card" ? "Credit / debit card" : "Cash on delivery";
  box.innerHTML = `
    <div class="success-mark" aria-hidden="true">&#10003;</div>
    <h1>Thank you, ${esc(order.customer.name.split(" ")[0])}!</h1>
    <p class="lead">Your order <strong>${order.id}</strong> was placed on ${order.date}. We sent the details to ${esc(order.customer.email)}.</p>

    <div class="confirm-grid">
      <section>
        <h2>Items</h2>
        <ul class="summary-items">
          ${order.items.map(function (i) {
            return `<li><span>${i.name} <small>x ${i.qty}</small></span><span>${money(i.price * i.qty)}</span></li>`;
          }).join("")}
        </ul>
        <dl class="summary-rows">${summaryRows(order.totals)}</dl>
      </section>
      <section>
        <h2>Delivery</h2>
        <p>${esc(order.customer.name)}<br>${esc(order.customer.address)}<br>${esc(order.customer.phone)}</p>
        <h2>Payment</h2>
        <p>${payText}</p>
        <p class="notice-small">Delivery usually takes 2 to 4 working days.</p>
      </section>
    </div>
    <div class="hero-actions">
      <a class="btn" href="products.html">Continue shopping</a>
      <button class="btn btn-outline" type="button" onclick="window.print()">Print order</button>
    </div>`;
}

setupCheckoutPage();
renderConfirmation();
