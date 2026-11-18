/* ==========================================================
   main.js  -  page logic for the browsing pages
   (home, products, product details, contact)
   ========================================================== */

/* ---------- helpers ---------- */
function formatPrice(value) {
  return value + " EGP";
}

/* Builds the HTML of one product card */
function createProductCard(p) {
  return `
    <article class="card">
      <a class="card-media tone-${p.id}" href="product-details.html?id=${p.id}">
        <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.remove()">
        <span class="card-initial" aria-hidden="true">${p.name.charAt(0)}</span>
      </a>
      <div class="card-body">
        <p class="card-category">${p.category}</p>
        <h3 class="card-title"><a href="product-details.html?id=${p.id}">${p.name}</a></h3>
        <div class="card-foot">
          <span class="price">${formatPrice(p.price)}</span>
          <button class="btn btn-small" type="button" data-add="${p.id}">Add to cart</button>
        </div>
      </div>
    </article>`;
}

/* ---------- Add to cart ----------
   addToCart(id) is written by Jana in cart.js.
   We only call it here. */
function handleAddToCart(id) {
  if (typeof addToCart === "function") {
    addToCart(id);
  } else {
    alert("Cart is not connected yet (cart.js is missing).");
  }
}

document.addEventListener("click", function (e) {
  const btn = e.target.closest("[data-add]");
  if (btn) {
    handleAddToCart(Number(btn.dataset.add));
  }
});

/* ---------- Home page: first 4 products ---------- */
function renderFeatured() {
  const grid = document.getElementById("featured-grid");
  if (!grid) return;
  grid.innerHTML = products.slice(0, 4).map(createProductCard).join("");
}

/* ---------- Products page: filter + search ---------- */
function renderProductsPage() {
  const grid = document.getElementById("products-grid");
  if (!grid) return;

  const buttons = document.querySelectorAll(".filter-btn");
  const searchBox = document.getElementById("search-box");
  const emptyMsg = document.getElementById("empty-msg");
  let activeCategory = "All";

  function draw() {
    const term = searchBox.value.trim().toLowerCase();
    const list = products.filter(function (p) {
      const matchCategory = activeCategory === "All" || p.category === activeCategory;
      const matchSearch = p.name.toLowerCase().includes(term);
      return matchCategory && matchSearch;
    });
    grid.innerHTML = list.map(createProductCard).join("");
    emptyMsg.hidden = list.length > 0;
  }

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      buttons.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      activeCategory = btn.dataset.category;
      draw();
    });
  });
  searchBox.addEventListener("input", draw);

  /* allow links like products.html?category=Skincare */
  const wanted = new URLSearchParams(window.location.search).get("category");
  const match = Array.from(buttons).find(function (b) { return b.dataset.category === wanted; });
  if (match) {
    match.click();
  } else {
    draw();
  }
}

/* ---------- Product details page ---------- */
function renderProductDetails() {
  const box = document.getElementById("product-detail");
  if (!box) return;

  const id = Number(new URLSearchParams(window.location.search).get("id"));
  const p = products.find(function (item) { return item.id === id; });

  if (!p) {
    box.innerHTML = `<p class="notice">Product not found. <a href="products.html">Back to all products</a></p>`;
    return;
  }

  document.title = p.name + " | Beauty Cosmetics Shop";
  box.innerHTML = `
    <div class="detail-media tone-${p.id}">
      <img src="${p.image}" alt="${p.name}" onerror="this.remove()">
      <span class="card-initial" aria-hidden="true">${p.name.charAt(0)}</span>
    </div>
    <div class="detail-info">
      <p class="card-category">${p.category}</p>
      <h1>${p.name}</h1>
      <p class="detail-price">${formatPrice(p.price)}</p>
      <p>${p.description}</p>
      <button class="btn" type="button" data-add="${p.id}">Add to cart</button>
      <p><a href="products.html">&larr; Back to products</a></p>
    </div>`;

  /* related products: same category, not the current one */
  const related = products.filter(function (item) {
    return item.category === p.category && item.id !== p.id;
  });
  const relatedGrid = document.getElementById("related-grid");
  if (relatedGrid) {
    relatedGrid.innerHTML = related.map(createProductCard).join("");
  }
}

/* ---------- Contact form validation ---------- */
function setupContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = form.elements["name"].value.trim();
    const email = form.elements["email"].value.trim();
    const message = form.elements["message"].value.trim();
    const feedback = document.getElementById("form-feedback");
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    feedback.className = "feedback";
    if (name === "" || message === "") {
      feedback.textContent = "Please fill in your name and message.";
      feedback.classList.add("error");
    } else if (!emailOk) {
      feedback.textContent = "Please enter a valid email address.";
      feedback.classList.add("error");
    } else {
      feedback.textContent = "Thank you, " + name + ". We received your message and will reply soon.";
      feedback.classList.add("success");
      form.reset();
    }
  });
}

renderFeatured();
renderProductsPage();
renderProductDetails();
setupContactForm();
