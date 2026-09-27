(() => {
  const sanitizeGuestName = (value) => {
    if (typeof value !== "string") return "";

    const normalized = value.normalize("NFC");
    const isLettersOnly = /^\p{L}+$/u.test(normalized);
    return normalized.length <= 60 && isLettersOnly ? normalized : "";
  };

  const queryParams = new URLSearchParams(window.location.search);
  const guestParamKeys = ["untuk", "nama"];
  const providedGuestKeys = guestParamKeys.filter((key) => queryParams.has(key));
  const hasRepeatedGuestParam = guestParamKeys.some((key) => queryParams.getAll(key).length > 1);
  const rawGuestName = providedGuestKeys.length === 1 ? queryParams.get(providedGuestKeys[0]) : null;
  const guestName = sanitizeGuestName(rawGuestName);
  const invalidGuestName = providedGuestKeys.length > 1 || hasRepeatedGuestParam ||
    (providedGuestKeys.length === 1 && !guestName);
  const INVITATION_CONFIG = {
    eventDate: "2026-10-18T09:00:00+08:00",
    eventTime: "08.00 WITA",
    timeZone: "Asia/Jakarta",
    locationName: "Kediaman mempelai pria",
    locationAddress: "Jl. Keramat raya gang keramat II bedak rt 16 rw 01.",
    mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=MJJ4%2B69C%20Sungai%20Bilu%2C%20Kota%20Banjarmasin%2C%20Kalimantan%20Selatan",
    mapEmbedUrl: "https://www.google.com/maps?q=MJJ4%2B69C%20Sungai%20Bilu%2C%20Kota%20Banjarmasin%2C%20Kalimantan%20Selatan&output=embed",
    coverPhoto: "Assets/Foto-Firman-Maulida.webp",
    galleryPhotos: [
      {
        src: "Assets/Foto-galeri1.webp",
        alt: "Firman dan Maulida",
        position: "50% 50%",
      },
      {
        src: "Assets/Foto-galeri2.webp",
        alt: "Firman dan Maulida",
        position: "38% 50%",
      },
      {
        src: "Assets/Foto-galeri3.webp",
        alt: "Firman dan Maulida",
        position: "62% 50%",
      },
    ],
    musicSrc: "Lagu/Cinta Terakhir - Ari Lasso (Saxophone Cover by Dori Wirawan) - (256 Kbps).mp3",
  };

  const currentPage = window.location.pathname.toLowerCase();
  const navigationEntry = performance.getEntriesByType("navigation")[0];

  if (invalidGuestName) {
    document.body.classList.add("invalid-guest-page");
    const errorPanel = document.querySelector("#parameter-error");
    if (errorPanel) errorPanel.hidden = false;
    document.querySelector("#page-loader")?.classList.add("is-hidden");
    return;
  }

  document.body.classList.add("media-protection");
  document.querySelectorAll("img, audio, video").forEach((media) => {
    media.draggable = false;
  });

  const preventMediaGrab = (event) => {
    if (event.target instanceof Element && event.target.closest("img, audio, video")) {
      event.preventDefault();
    }
  };

  document.addEventListener("contextmenu", preventMediaGrab);
  document.addEventListener("dragstart", preventMediaGrab);

  if (currentPage.endsWith("/undangan.html") && navigationEntry?.type === "reload") {
    const indexUrl = new URL("index.html", window.location.href);
    if (guestName) indexUrl.searchParams.set("untuk", guestName);
    window.location.replace(indexUrl.href);
    return;
  }

  const loader = document.querySelector("#page-loader");
  const openLink = document.querySelector(".tombol-undangan[href='Undangan.html']");
  const loadStartedAt = Date.now();

  const guestNameElement = document.querySelector("#guest-name");
  if (guestNameElement) guestNameElement.textContent = guestName || "Tamu Undangan";

  if (openLink) {
    const invitationUrl = new URL(openLink.getAttribute("href"), window.location.href);
    if (guestName) invitationUrl.searchParams.set("untuk", guestName);
    openLink.href = invitationUrl.href;
  }

  if (currentPage.endsWith("/undangan.html") && guestName) {
    document.querySelectorAll('a[href="index.html"]').forEach((link) => {
      const indexUrl = new URL(link.getAttribute("href"), window.location.href);
      indexUrl.searchParams.set("untuk", guestName);
      link.href = indexUrl.href;
    });
  }

  const setText = (selector, text) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = text;
  };

  const coverPhoto = document.querySelector("#cover-photo");
  if (coverPhoto) coverPhoto.src = INVITATION_CONFIG.coverPhoto;

  const gallery = document.querySelector("#gallery-grid");
  if (gallery) {
    const galleryItems = INVITATION_CONFIG.galleryPhotos.map((photo, index) => {
      const figure = document.createElement("figure");
      const image = document.createElement("img");
      figure.className = `gallery-item gallery-item-${index + 1} reveal-on-scroll`;
      image.src = photo.src;
      image.alt = photo.alt;
      image.loading = "lazy";
      image.decoding = "async";
      image.draggable = false;
      image.style.objectPosition = photo.position;
      figure.append(image);
      return figure;
    });
    gallery.replaceChildren(...galleryItems);
  }

  const eventDate = new Date(INVITATION_CONFIG.eventDate);
  const eventDateIsValid = Number.isFinite(eventDate.getTime());
  const formattedDate = eventDateIsValid
    ? new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: INVITATION_CONFIG.timeZone,
      }).format(eventDate)
    : "";

  setText("#event-date-label", formattedDate);
  setText("#event-date-full", formattedDate);
  setText("#event-time", INVITATION_CONFIG.eventTime);
  setText("#event-location-name", INVITATION_CONFIG.locationName);
  setText("#event-location-address", INVITATION_CONFIG.locationAddress);

  const mapLink = document.querySelector("#event-map-link");
  if (mapLink && INVITATION_CONFIG.mapsUrl) {
    mapLink.href = INVITATION_CONFIG.mapsUrl;
    mapLink.hidden = false;
  }

  const mapFrame = document.querySelector("#event-map-frame");
  if (mapFrame && INVITATION_CONFIG.mapEmbedUrl) {
    mapFrame.src = INVITATION_CONFIG.mapEmbedUrl;
  }

  const countdownUnits = {
    days: document.querySelector("#countdown-days"),
    hours: document.querySelector("#countdown-hours"),
    minutes: document.querySelector("#countdown-minutes"),
    seconds: document.querySelector("#countdown-seconds"),
  };
  const countdownMessage = document.querySelector("#countdown-message");

  const updateCountdown = () => {
    if (!eventDateIsValid || !countdownUnits.days) return;

    const remaining = Math.max(0, eventDate.getTime() - Date.now());
    const totalSeconds = Math.floor(remaining / 1000);
    const values = {
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
    };

    Object.entries(values).forEach(([unit, value]) => {
      countdownUnits[unit].textContent = String(value).padStart(2, "0");
    });

    if (countdownMessage) {
      countdownMessage.textContent = remaining === 0 ? "Hari bahagia telah tiba" : "";
    }
  };

  updateCountdown();
  if (eventDateIsValid) window.setInterval(updateCountdown, 1000);

  const audio = document.querySelector("#wedding-audio");
  const audioToggle = document.querySelector("#audio-toggle");
  if (audio && audioToggle) {
    const icon = audioToggle.querySelector("i");
    const stopWeddingAudio = () => {
      audio.pause();
      if (audio.readyState > 0) audio.currentTime = 0;
      try {
        window.sessionStorage.removeItem("playWeddingMusic");
      } catch {
      }
    };

    const shouldAutoplay = (() => {
      try {
        const requested = window.sessionStorage.getItem("playWeddingMusic") === "true";
        window.sessionStorage.removeItem("playWeddingMusic");
        return requested;
      } catch {
        return false;
      }
    })();

    if (INVITATION_CONFIG.musicSrc) {
      audio.src = INVITATION_CONFIG.musicSrc;
      audioToggle.disabled = false;
      audioToggle.title = "Putar atau jeda lagu";
      audioToggle.setAttribute("aria-label", "Putar lagu");
    } else {
      audioToggle.disabled = true;
    }

    audioToggle.addEventListener("click", async () => {
      if (audio.paused) {
        try {
          await audio.play();
        } catch {
          audioToggle.title = "Lagu tidak dapat diputar. Periksa sumber lagu.";
        }
      } else {
        audio.pause();
      }
    });

    audio.addEventListener("play", () => {
      if (icon) icon.className = "bi bi-music-note-beamed";
      audioToggle.setAttribute("aria-label", "Jeda lagu");
    });
    audio.addEventListener("pause", () => {
      if (icon) icon.className = "bi bi-pause-fill";
      audioToggle.setAttribute("aria-label", "Putar lagu");
    });

    window.addEventListener("pagehide", stopWeddingAudio);
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) stopWeddingAudio();
    });

    document.querySelectorAll('a[href="index.html"]').forEach((link) => {
      link.addEventListener("click", stopWeddingAudio);
    });

    if (shouldAutoplay && INVITATION_CONFIG.musicSrc) {
      audio.play().catch(() => {
        audioToggle.setAttribute("aria-label", "Putar lagu");
      });
    }
  }

  const revealItems = document.querySelectorAll(".reveal-on-scroll");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    revealItems.forEach((item) => item.classList.add("will-reveal"));
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  document.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch") return;

    const splash = document.createElement("span");
    splash.className = "touch-splash";
    splash.style.left = `${event.clientX}px`;
    splash.style.top = `${event.clientY}px`;

    [-140, -50, 45, 135].forEach((angle) => {
      const drop = document.createElement("span");
      drop.className = "splash-drop";
      drop.style.setProperty("--angle", `${angle}deg`);
      splash.append(drop);
    });

    document.body.append(splash);
    splash.addEventListener("animationend", () => splash.remove(), { once: true });
  }, { passive: true });

  const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  const imagesReady = Promise.all(
    Array.from(document.images, (image) => {
      if (image.complete || image.loading === "lazy") return Promise.resolve();
      return new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      });
    }),
  );
  const fontsReady = document.fonts?.ready ?? Promise.resolve();
  const fontFallback = wait(3000);

  Promise.all([imagesReady, Promise.race([fontsReady, fontFallback])])
    .then(() => wait(Math.max(0, 650 - (Date.now() - loadStartedAt))))
    .then(() => loader?.classList.add("is-hidden"));

  openLink?.addEventListener("click", (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    openLink.setAttribute("aria-disabled", "true");
    if (INVITATION_CONFIG.musicSrc) {
      try {
        window.sessionStorage.setItem("playWeddingMusic", "true");
      } catch {
      }
    }
    document.body.classList.add("is-leaving");

    const transitionDuration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1050;
    window.setTimeout(() => {
      window.location.assign(openLink.href);
    }, transitionDuration);
  });
})();
