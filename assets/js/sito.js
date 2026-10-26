// Car Style Evolution: menu su telefono, foto a tutto schermo, modulo contatti, mappa su richiesta.
// Le quattro funzioni vengono avviate in fondo al file.

// Menu su telefono: il pulsante "Menu" apre e chiude l'elenco delle pagine.
function setupMobileMenu() {
  const header = document.querySelector(".testata");
  const button = document.querySelector(".menu-mobile");
  if (!header || !button) return;

  button.addEventListener("click", function () {
    const isOpen = header.classList.toggle("testata--aperta");
    button.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
}

// Visore delle foto: cliccando una miniatura la foto grande si apre a tutto schermo.
// Si scorre con le frecce (anche da tastiera o con lo swipe) e si chiude con la X o con Esc.
function setupPhotoViewer() {
  const links = document.querySelectorAll("a[data-galleria]");
  if (links.length === 0) return;

  const viewer = document.createElement("div");
  viewer.className = "visore";
  viewer.hidden = true;
  viewer.setAttribute("role", "dialog");
  viewer.setAttribute("aria-modal", "true");
  viewer.setAttribute("aria-label", "Foto a tutto schermo");
  viewer.innerHTML =
    '<img class="visore__foto" alt="">' +
    '<button class="visore__pulsante visore__chiudi" type="button" aria-label="Chiudi">×</button>' +
    '<button class="visore__pulsante visore__precedente" type="button" aria-label="Foto precedente">‹</button>' +
    '<button class="visore__pulsante visore__successiva" type="button" aria-label="Foto successiva">›</button>' +
    '<p class="visore__contatore"></p>';
  document.body.appendChild(viewer);

  const photo = viewer.querySelector(".visore__foto");
  const counter = viewer.querySelector(".visore__contatore");
  let currentGallery = [];
  let currentIndex = 0;
  let lastFocusedLink = null;
  let touchStartX = null;

  function show(index) {
    // Torna all'inizio dopo l'ultima foto, e alla fine prima della prima.
    currentIndex = (index + currentGallery.length) % currentGallery.length;
    const link = currentGallery[currentIndex];
    photo.src = link.href;
    photo.alt = link.querySelector("img").alt;
    counter.textContent = (currentIndex + 1) + " / " + currentGallery.length;
  }

  function open(link) {
    // Le frecce scorrono solo le foto dello stesso progetto.
    currentGallery = Array.from(link.closest(".galleria").querySelectorAll("a[data-galleria]"));
    lastFocusedLink = link;
    show(currentGallery.indexOf(link));
    viewer.hidden = false;
    document.body.style.overflow = "hidden";
    viewer.querySelector(".visore__chiudi").focus();
  }

  function close() {
    viewer.hidden = true;
    photo.removeAttribute("src");
    document.body.style.overflow = "";
    if (lastFocusedLink) lastFocusedLink.focus();
  }

  links.forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      open(link);
    });
  });

  viewer.querySelector(".visore__chiudi").addEventListener("click", close);
  viewer.querySelector(".visore__precedente").addEventListener("click", function () { show(currentIndex - 1); });
  viewer.querySelector(".visore__successiva").addEventListener("click", function () { show(currentIndex + 1); });

  // Un clic sullo sfondo scuro (non sulla foto o sui pulsanti) chiude il visore.
  viewer.addEventListener("click", function (event) {
    if (event.target === viewer) close();
  });

  document.addEventListener("keydown", function (event) {
    if (viewer.hidden) return;
    if (event.key === "Escape") close();
    if (event.key === "ArrowLeft") show(currentIndex - 1);
    if (event.key === "ArrowRight") show(currentIndex + 1);
  });

  viewer.addEventListener("touchstart", function (event) {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });
  viewer.addEventListener("touchend", function (event) {
    if (touchStartX === null) return;
    const distance = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(distance) > 50) show(distance < 0 ? currentIndex + 1 : currentIndex - 1);
    touchStartX = null;
  });
}

// Modulo contatti: prepara il testo e lo apre in WhatsApp o nell'app di posta del visitatore
// (il sito non ha un server che riceva messaggi).
function setupContactForms() {
  const forms = document.querySelectorAll("form[data-modulo-contatti]");

  forms.forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const name = form.elements["nome"].value.trim();
      const phone = form.elements["telefono"].value.trim();
      const message = form.elements["messaggio"].value.trim();

      let text = "Ciao, sono " + name + ".\n\n" + message;
      if (phone) text += "\n\nTelefono: " + phone;

      // Quale pulsante è stato premuto: "whatsapp" oppure "email".
      const channel = event.submitter ? event.submitter.value : "whatsapp";

      if (channel === "email") {
        const subject = "Richiesta preventivo dal sito";
        window.location.href = "mailto:" + form.dataset.email +
          "?subject=" + encodeURIComponent(subject) +
          "&body=" + encodeURIComponent(text);
      } else {
        window.open("https://wa.me/" + form.dataset.whatsapp + "?text=" + encodeURIComponent(text), "_blank", "noopener");
      }
    });
  });
}

// Mappa: la mappa di Google viene inserita solo quando il visitatore preme "Mostra la mappa".
function setupMap() {
  const box = document.querySelector("[data-mappa]");
  if (!box) return;
  const button = box.querySelector("[data-mostra-mappa]");

  button.addEventListener("click", function () {
    const frame = document.createElement("iframe");
    frame.src = "https://maps.google.com/maps?q=" + encodeURIComponent(box.dataset.indirizzo) + "&output=embed";
    frame.title = "Mappa: " + box.dataset.indirizzo;
    frame.loading = "lazy";
    frame.referrerPolicy = "no-referrer-when-downgrade";
    box.innerHTML = "";
    box.classList.add("mappa--caricata");
    box.appendChild(frame);
  });
}

setupMobileMenu();
setupPhotoViewer();
setupContactForms();
setupMap();
