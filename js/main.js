var phoneNumber = "551639480777";
var budgetMessage = "Olá, vim pelo site da Race Química e gostaria de solicitar um orçamento.";
function wa(message) {
  return "https://wa.me/" + phoneNumber + "?text=" + encodeURIComponent(message);
}
function setupMenu() {
  var header = document.querySelector("#header");
  var toggle = document.querySelector(".menu-toggle");
  var panel = document.querySelector("#nav-panel");
  if (!header || !toggle || !panel) return;
  window.addEventListener("scroll", function () { return header.classList.toggle("scrolled", window.scrollY > 12); }, { passive: true });
  toggle.addEventListener("click", function () {
    var open = panel.classList.toggle("is-open");
    toggle.classList.toggle("is-active", open);
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });
  panel.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      panel.classList.remove("is-open");
      toggle.classList.remove("is-active");
      document.body.classList.remove("menu-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}
function setupReveal() {
  var items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach(function (item) { return item.classList.add("is-visible"); });
    return;
  }
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .14 });
  items.forEach(function (item) { return observer.observe(item); });
}
function setupCounters() {
  document.querySelectorAll("[data-counter]").forEach(function (node) {
    var target = Number(node.getAttribute("data-counter") || 0);
    var value = 0;
    var step = Math.max(1, Math.ceil(target / 58));
    var timer = window.setInterval(function () {
      value += step;
      node.textContent = String(Math.min(value, target));
      if (value >= target) window.clearInterval(timer);
    }, 20);
  });
}
function productImage(product) {
  return product.image || "assets/img/polimeros.jpg";
}
async function loadSiteContent() {
  var grid = document.querySelector("#product-grid");
  var gallery = document.querySelector("#gallery-grid");
  var videoBox = document.querySelector("#video-box");
  try {
    var response = await fetch("/api/site");
    var data = await response.json();
    if (grid) {
      grid.innerHTML = data.products.map(function (product) {
        return "<article class=\"product-card reveal is-visible\">\n          <img src=\"" + productImage(product) + "\" alt=\"" + product.name + "\">\n          <div class=\"content\">\n            <h3>" + product.name + "</h3>\n            <p>" + product.description + "</p>\n            <a class=\"btn btn-primary\" href=\"" + wa("Olá, vim pelo site da Race Química e gostaria de mais informações sobre " + product.name + ".") + "\" target=\"_blank\" rel=\"noopener\">Consultar produto</a>\n          </div>\n        </article>";
      }).join("");
    }
    if (gallery) {
      gallery.innerHTML = data.gallery.map(function (item) {
        return "<article class=\"gallery-card reveal is-visible\"><img src=\"" + item.image + "\" alt=\"" + item.title + "\"><strong>" + item.title + "</strong></article>";
      }).join("");
    }
    if (videoBox && data.settings.presentation_video) {
      videoBox.innerHTML = "<iframe src=\"" + data.settings.presentation_video + "\" title=\"Vídeo de apresentação Race Química\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture\" allowfullscreen></iframe>";
    }
  } catch (_error) {
    if (grid) grid.innerHTML = "<p>Inicie o servidor Node para carregar o catálogo dinâmico.</p>";
  }
}
function setupForms() {
  document.querySelectorAll("[data-whatsapp='orcamento']").forEach(function (link) {
    link.setAttribute("href", wa(budgetMessage));
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener");
  });
  var form = document.querySelector("#contact-form");
  if (!form) return;
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var data = new FormData(form);
    var message = [
      "Olá, vim pelo site da Race Química.",
      "Nome: " + (data.get("name") || ""),
      "Empresa: " + (data.get("company") || ""),
      "Telefone: " + (data.get("phone") || ""),
      "E-mail: " + (data.get("email") || ""),
      "Mensagem: " + (data.get("message") || "")
    ].join("\n");
    window.open(wa(message), "_blank", "noopener");
  });
}
function setupCanvas() {
  var canvas = document.querySelector("#molecule-canvas");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  var particles = [];
  function resize() {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
  }
  function init() {
    particles.length = 0;
    for (var i = 0; i < 46; i++) {
      particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: 2 + Math.random() * 3 });
    }
  }
  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(function (p, i) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      ctx.beginPath();
      ctx.fillStyle = "rgba(29,143,79,.42)";
      ctx.arc(p.x, p.y, p.r * window.devicePixelRatio, 0, Math.PI * 2);
      ctx.fill();
      for (var j = i + 1; j < particles.length; j++) {
        var q = particles[j];
        var dx = p.x - q.x, dy = p.y - q.y, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150 * window.devicePixelRatio) {
          ctx.strokeStyle = "rgba(48,212,232," + (1 - dist / (150 * window.devicePixelRatio)) * .22 + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      }
    });
    requestAnimationFrame(draw);
  }
  resize(); init(); draw();
  window.addEventListener("resize", function () { resize(); init(); });
}
document.addEventListener("DOMContentLoaded", function () {
  setupMenu();
  setupReveal();
  setupCounters();
  setupForms();
  setupCanvas();
  loadSiteContent();
});
