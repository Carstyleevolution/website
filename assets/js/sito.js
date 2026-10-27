// Car Style Evolution: navigazione, gallerie e piccoli miglioramenti progressivi.
// Moduli e mappa continuano a funzionare senza servizi aggiuntivi.

function setupMobileMenu() {
  const header = document.querySelector(".testata");
  const button = document.querySelector(".menu-mobile");
  const menu = document.querySelector("#menu-principale");
  if (!header || !button || !menu) return;

  const mobile = window.matchMedia("(max-width: 820px)");
  function setOpen(open, restoreFocus) {
    header.classList.toggle("testata--aperta", open);
    button.setAttribute("aria-expanded", String(open));
    if (restoreFocus) button.focus();
  }

  button.addEventListener("click", function () {
    setOpen(button.getAttribute("aria-expanded") !== "true");
  });
  menu.addEventListener("click", function (event) {
    if (event.target.closest("a")) setOpen(false);
  });
  document.addEventListener("click", function (event) {
    if (mobile.matches && !header.contains(event.target)) setOpen(false);
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") {
      event.preventDefault();
      setOpen(false, true);
    }
  });
  header.addEventListener("focusout", function (event) {
    if (event.relatedTarget && !header.contains(event.relatedTarget)) setOpen(false);
  });
  mobile.addEventListener("change", function () { setOpen(false); });
  // Il CSS nasconde il menu mobile solo dopo questa inizializzazione.
  header.classList.add("testata--interattiva");
}

function setupPhotoViewer() {
  const links = document.querySelectorAll("a[data-galleria]");
  if (!links.length) return;

  const viewer = document.createElement("div");
  viewer.className = "visore";
  viewer.hidden = true;
  viewer.setAttribute("role", "dialog");
  viewer.setAttribute("aria-modal", "true");
  viewer.setAttribute("aria-label", "Foto a tutto schermo");
  viewer.setAttribute("aria-describedby", "visore-didascalia");
  viewer.innerHTML =
    '<img class="visore__foto" alt="" hidden>' +
    '<button class="visore__pulsante visore__chiudi" type="button" aria-label="Chiudi">×</button>' +
    '<button class="visore__pulsante visore__precedente" type="button" aria-label="Foto precedente">‹</button>' +
    '<button class="visore__pulsante visore__successiva" type="button" aria-label="Foto successiva">›</button>' +
    '<p class="visore__stato" role="status" aria-live="polite"></p>' +
    '<div class="visore__informazioni"><p class="visore__didascalia" id="visore-didascalia"></p>' +
    '<p class="visore__contatore" aria-live="polite" aria-atomic="true"></p></div>';
  document.body.appendChild(viewer);

  const photo = viewer.querySelector(".visore__foto");
  const caption = viewer.querySelector(".visore__didascalia");
  const counter = viewer.querySelector(".visore__contatore");
  const status = viewer.querySelector(".visore__stato");
  const closeButton = viewer.querySelector(".visore__chiudi");
  const previousButton = viewer.querySelector(".visore__precedente");
  const nextButton = viewer.querySelector(".visore__successiva");
  const controls = [closeButton, previousButton, nextButton];
  let gallery = [];
  let currentIndex = 0;
  let requestId = 0;
  let returnFocus = null;
  let touchStart = null;
  let bodyOverflow = "";
  let backgroundElements = [];

  function show(index) {
    currentIndex = (index + gallery.length) % gallery.length;
    const link = gallery[currentIndex];
    const thumbnail = link.querySelector("img");
    const description = thumbnail ? thumbnail.alt : "Foto del progetto";
    const thisRequest = ++requestId;
    photo.hidden = true;
    photo.removeAttribute("src");
    caption.textContent = description;
    counter.textContent = (currentIndex + 1) + " / " + gallery.length;
    status.textContent = "Caricamento foto…";
    viewer.classList.add("visore--caricamento");
    viewer.classList.remove("visore--errore");
    photo.setAttribute("aria-busy", "true");

    // Le risposte di richieste precedenti non possono sostituire la foto corrente.
    const incoming = new Image();
    incoming.decoding = "async";
    incoming.onload = function () {
      if (thisRequest !== requestId || viewer.hidden) return;
      photo.src = link.href;
      photo.alt = description;
      photo.hidden = false;
      photo.removeAttribute("aria-busy");
      status.textContent = "";
      viewer.classList.remove("visore--caricamento");
    };
    incoming.onerror = function () {
      if (thisRequest !== requestId || viewer.hidden) return;
      photo.removeAttribute("aria-busy");
      status.textContent = "Impossibile caricare la foto. Usa le frecce per continuare o chiudi il visore.";
      viewer.classList.remove("visore--caricamento");
      viewer.classList.add("visore--errore");
    };
    incoming.src = link.href;
  }

  function open(link) {
    const group = link.closest(".galleria");
    if (!group) return;
    gallery = Array.from(group.querySelectorAll("a[data-galleria]"));
    returnFocus = link;
    bodyOverflow = document.body.style.overflow;
    viewer.hidden = false;
    document.body.style.overflow = "hidden";
    previousButton.hidden = nextButton.hidden = gallery.length < 2;
    show(gallery.indexOf(link));
    closeButton.focus();
    // Inert mantiene tastiera e lettori di schermo all'interno del dialogo.
    backgroundElements = Array.from(document.body.children)
      .filter(function (element) { return element !== viewer; })
      .map(function (element) {
        const previous = element.inert;
        element.inert = true;
        return { element: element, previous: previous };
      });
  }

  function close() {
    if (viewer.hidden) return;
    ++requestId;
    viewer.hidden = true;
    photo.hidden = true;
    photo.removeAttribute("src");
    photo.removeAttribute("aria-busy");
    status.textContent = "";
    touchStart = null;
    backgroundElements.forEach(function (item) { item.element.inert = item.previous; });
    backgroundElements = [];
    document.body.style.overflow = bodyOverflow;
    if (returnFocus && returnFocus.isConnected) returnFocus.focus({ preventScroll: true });
  }

  links.forEach(function (link) {
    link.addEventListener("click", function (event) {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || !link.closest(".galleria")) return;
      event.preventDefault();
      open(link);
    });
  });
  closeButton.addEventListener("click", close);
  previousButton.addEventListener("click", function () { show(currentIndex - 1); });
  nextButton.addEventListener("click", function () { show(currentIndex + 1); });
  viewer.addEventListener("click", function (event) {
    if (event.target === viewer) close();
  });
  document.addEventListener("keydown", function (event) {
    if (viewer.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (gallery.length > 1 && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
      event.preventDefault();
      show(currentIndex + (event.key === "ArrowLeft" ? -1 : 1));
    } else if (event.key === "Tab") {
      const available = controls.filter(function (control) { return !control.hidden; });
      const first = available[0];
      const last = available[available.length - 1];
      if (event.shiftKey && (document.activeElement === first || !viewer.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !viewer.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    }
  });
  document.addEventListener("focusin", function (event) {
    if (!viewer.hidden && !viewer.contains(event.target)) closeButton.focus();
  });
  viewer.addEventListener("touchstart", function (event) {
    touchStart = null;
    if (event.touches.length !== 1 || event.target.closest("button")) return;
    const touch = event.touches[0];
    touchStart = { x: touch.clientX, y: touch.clientY, id: touch.identifier };
  }, { passive: true });
  viewer.addEventListener("touchmove", function (event) {
    if (event.touches.length !== 1) touchStart = null;
  }, { passive: true });
  viewer.addEventListener("touchend", function (event) {
    if (!touchStart) return;
    const touch = Array.from(event.changedTouches).find(function (item) { return item.identifier === touchStart.id; });
    if (touch) {
      const horizontal = touch.clientX - touchStart.x;
      const vertical = touch.clientY - touchStart.y;
      if (gallery.length > 1 && Math.abs(horizontal) > 50 && Math.abs(horizontal) > Math.abs(vertical) * 1.3) {
        event.preventDefault();
        show(currentIndex + (horizontal < 0 ? 1 : -1));
      }
    }
    touchStart = null;
  }, { passive: false });
  viewer.addEventListener("touchcancel", function () { touchStart = null; }, { passive: true });
}

// Fade-in solo sotto la prima schermata: nessuna attesa per i contenuti iniziali.
function setupScrollReveal() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reducedMotion.matches || !("IntersectionObserver" in window)) return;
  const selector = ".titolo-sezione, .scheda, .categoria, .punto-forza, .affiancati";
  const elements = Array.from(document.querySelectorAll(selector)).filter(function (element) {
    return !element.parentElement.closest(selector);
  });
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.remove("comparsa--attesa");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0, rootMargin: "0px 0px -24px 0px" });
  elements.forEach(function (element) {
    if (element.getBoundingClientRect().top < window.innerHeight) return;
    element.classList.add("comparsa", "comparsa--attesa");
    observer.observe(element);
  });
  document.addEventListener("focusin", function (event) {
    const container = event.target.closest(".comparsa--attesa");
    if (container) {
      container.classList.remove("comparsa--attesa");
      observer.unobserve(container);
    }
  });
  reducedMotion.addEventListener("change", function (event) {
    if (!event.matches) return;
    observer.disconnect();
    elements.forEach(function (element) { element.classList.remove("comparsa--attesa"); });
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
setupScrollReveal();