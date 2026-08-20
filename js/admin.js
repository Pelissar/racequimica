var tokenKey = "race_admin_token";
var state = { products: [], gallery: [], video: "" };
var loginView = document.querySelector("#login-view");
var dashboard = document.querySelector("#dashboard");
var loginForm = document.querySelector("#login-form");
var videoForm = document.querySelector("#video-form");
var productForm = document.querySelector("#product-form");
var galleryForm = document.querySelector("#gallery-form");
var productsList = document.querySelector("#products-list");
var galleryList = document.querySelector("#gallery-list");
var toast = document.querySelector("#toast");
var productPreview = document.querySelector("#product-preview");
var galleryPreview = document.querySelector("#gallery-preview");
var healthGrid = document.querySelector("#health-grid");

function getToken() {
  return localStorage.getItem(tokenKey) || "";
}

function setToken(token) {
  if (token) localStorage.setItem(tokenKey, token);
}

function clearToken() {
  localStorage.removeItem(tokenKey);
}

function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(function () { return toast.classList.remove("show"); }, 2800);
}

async function api(url, options) {
  var headers = Object.assign({}, options && options.headers ? options.headers : {});
  var token = getToken();
  if (token) headers.Authorization = "Bearer " + token;
  var response = await fetch(url, Object.assign({}, options || {}, { headers: headers }));
  var raw = await response.text();
  var data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch (_error) {
    data = { error: raw ? String(raw).slice(0, 220) : "" };
  }
  if (!response.ok) {
    var message = data.error || ("Erro na requisição. HTTP " + response.status);
    var error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }
  if (data.token) setToken(data.token);
  return data;
}

function showDashboard() {
  loginView.classList.add("hidden");
  dashboard.classList.remove("hidden");
}

function showLogin() {
  dashboard.classList.add("hidden");
  loginView.classList.remove("hidden");
}

function activateTab(name) {
  document.querySelectorAll(".nav-tab").forEach(function (button) {
    button.classList.toggle("is-active", button.dataset.tab === name);
  });
  document.querySelectorAll(".tab-panel").forEach(function (panel) {
    panel.classList.toggle("is-active", panel.dataset.panel === name);
  });
}

function updateStats() {
  document.querySelector("#stat-products").textContent = String(state.products.length);
  document.querySelector("#stat-active").textContent = String(state.products.filter(function (item) { return item.active; }).length);
  document.querySelector("#stat-gallery").textContent = String(state.gallery.length);
  document.querySelector("#stat-video").textContent = state.video ? "Sim" : "Não";
}

function imageOrFallback(path) {
  return path || "assets/img/polimeros.jpg";
}

function renderProducts() {
  productsList.innerHTML = state.products.map(function (product) {
    return "<article class=\"admin-card\">\n      <img src=\"" + imageOrFallback(product.image) + "\" alt=\"" + product.name + "\">\n      <div>\n        <h3>" + product.name + "</h3>\n        <p>" + product.description + "</p>\n        <span class=\"badge " + (product.active ? "" : "off") + "\">" + (product.active ? "Ativo no site" : "Oculto") + " · ordem " + product.sort_order + "</span>\n      </div>\n      <div class=\"actions\">\n        <button class=\"muted-button\" data-edit=\"" + product.id + "\">Editar</button>\n        <button class=\"danger\" data-delete=\"" + product.id + "\">Excluir</button>\n      </div>\n    </article>";
  }).join("");

  productsList.querySelectorAll("[data-edit]").forEach(function (button) {
    button.addEventListener("click", function () {
      var product = state.products.find(function (item) { return String(item.id) === button.dataset.edit; });
      if (!product) return;
      productForm.id.value = product.id;
      productForm.name.value = product.name;
      productForm.description.value = product.description;
      productForm.sort_order.value = product.sort_order;
      productForm.active.checked = product.active;
      if (product.image) productPreview.src = product.image;
      activateTab("products");
      window.scrollTo({ top: productForm.getBoundingClientRect().top + window.scrollY - 120, behavior: "smooth" });
    });
  });

  productsList.querySelectorAll("[data-delete]").forEach(function (button) {
    button.addEventListener("click", async function () {
      if (!confirm("Excluir este produto?")) return;
      await api("/api/admin/products/" + button.dataset.delete, { method: "DELETE" });
      notify("Produto excluído.");
      loadAdmin();
    });
  });
}

function renderGallery() {
  galleryList.innerHTML = state.gallery.map(function (photo) {
    return "<article class=\"photo-item\">\n      <img src=\"" + photo.image + "\" alt=\"" + photo.title + "\">\n      <strong>" + photo.title + "</strong>\n      <button class=\"danger\" data-delete-photo=\"" + photo.id + "\">Excluir foto</button>\n    </article>";
  }).join("");

  galleryList.querySelectorAll("[data-delete-photo]").forEach(function (button) {
    button.addEventListener("click", async function () {
      if (!confirm("Excluir esta foto?")) return;
      await api("/api/admin/gallery/" + button.dataset.deletePhoto, { method: "DELETE" });
      notify("Foto removida.");
      loadAdmin();
    });
  });
}

function renderHealth(data) {
  if (!healthGrid) return;
  healthGrid.innerHTML = (data.checks || []).map(function (check) {
    return "<article class=\"health-card " + (check.ok ? "health-ok" : "health-error") + "\">\n      <strong>" + check.label + "</strong>\n      <p>" + check.detail + "</p>\n    </article>";
  }).join("");
}

async function loadHealth() {
  var data = await api("/api/admin/health");
  renderHealth(data);
}

async function loadAdmin() {
  try {
    var data = await api("/api/admin/content");
    state.products = data.products || [];
    state.gallery = data.gallery || [];
    state.video = data.video || "";
    showDashboard();
    videoForm.videoUrl.value = state.video;
    document.querySelector("#api-status").textContent = "Conectado";
    document.querySelector("#storage-mode").textContent = data.storage || "Local / Supabase";
    updateStats();
    renderProducts();
    renderGallery();
    await loadHealth();
  } catch (error) {
    document.querySelector("#api-status").textContent = "Erro";
    if (error.status === 401) {
      showLogin();
      return;
    }
    notify(error.message || "Falha ao carregar painel.");
  }
}

function fileToPayload(file) {
  return new Promise(function (resolve, reject) {
    if (!file) {
      resolve(null);
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      resolve({ name: file.name, type: file.type, dataUrl: String(reader.result || "") });
    };
    reader.onerror = function () { return reject(reader.error); };
    reader.readAsDataURL(file);
  });
}

function previewFile(input, preview) {
  var file = input.files && input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function () { preview.src = String(reader.result || ""); };
  reader.readAsDataURL(file);
}

document.querySelectorAll(".nav-tab").forEach(function (button) {
  button.addEventListener("click", function () { return activateTab(button.dataset.tab); });
});

document.querySelectorAll("[data-jump]").forEach(function (button) {
  button.addEventListener("click", function () { return activateTab(button.dataset.jump); });
});

document.querySelector("#clear-product").addEventListener("click", function () {
  productForm.reset();
  productForm.id.value = "";
  productForm.active.checked = true;
  productPreview.removeAttribute("src");
  notify("Formulário pronto para novo produto.");
});

document.querySelector("#refresh-health").addEventListener("click", async function () {
  try {
    await loadHealth();
    notify("Diagnóstico atualizado.");
  } catch (error) {
    notify(error.message || "Falha ao atualizar diagnóstico.");
  }
});

loginForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  try {
    await api("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(loginForm)))
    });
    notify("Login realizado.");
    await loadAdmin();
  } catch (error) {
    notify(error.message || "Falha no login.");
  }
});

document.querySelector("#logout").addEventListener("click", async function () {
  try { await api("/api/logout", { method: "POST" }); } catch (_error) {}
  clearToken();
  showLogin();
});

videoForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  try {
    await api("/api/admin/video", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoUrl: videoForm.videoUrl.value })
    });
    notify("Vídeo salvo.");
    loadAdmin();
  } catch (error) {
    notify(error.message || "Falha ao salvar vídeo.");
  }
});

productForm.image.addEventListener("change", function () {
  previewFile(productForm.image, productPreview);
});

galleryForm.image.addEventListener("change", function () {
  previewFile(galleryForm.image, galleryPreview);
});

productForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  var data = new FormData(productForm);
  var id = data.get("id");
  var image = await fileToPayload(productForm.image.files[0]);
  var payload = {
    name: data.get("name"),
    description: data.get("description"),
    sort_order: Number(data.get("sort_order") || 0),
    active: productForm.active.checked,
    image: image
  };
  try {
    await api(id ? "/api/admin/products/" + id : "/api/admin/products", {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    productForm.reset();
    productForm.id.value = "";
    productForm.active.checked = true;
    productPreview.removeAttribute("src");
    notify("Produto salvo.");
    loadAdmin();
  } catch (error) {
    notify(error.message || "Falha ao salvar produto.");
  }
});

galleryForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  var data = new FormData(galleryForm);
  var image = await fileToPayload(galleryForm.image.files[0]);
  try {
    await api("/api/admin/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: data.get("title") || "Foto Race Química", image: image })
    });
    galleryForm.reset();
    galleryPreview.removeAttribute("src");
    notify("Foto adicionada.");
    loadAdmin();
  } catch (error) {
    notify(error.message || "Falha ao enviar foto.");
  }
});

loadAdmin();
