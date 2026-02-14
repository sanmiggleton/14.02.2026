// ---------- Scroll + nav ----------
const snap = document.querySelector(".snap");
const dots = Array.from(document.querySelectorAll(".dot"));

dots.forEach(btn => {
  btn.addEventListener("click", () => {
    const targetSel = btn.getAttribute("data-target");
    const target = document.querySelector(targetSel);
    if (target) target.scrollIntoView({ behavior: "smooth" });
  });
});

const sections = Array.from(document.querySelectorAll("section.section"));
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const id = "#" + e.target.id;
    dots.forEach(d => d.classList.toggle("active", d.dataset.target === id));
  });
}, { root: snap, threshold: 0.6 });

sections.forEach(s => io.observe(s));

const dotnav = document.getElementById("dotnav");

// ---------- Player ----------
const audio = document.getElementById("audio");
const musicSection = document.getElementById("music");
const art = document.getElementById("art");
const artistEl = document.getElementById("artist");
const titleEl = document.getElementById("title");
const seek = document.getElementById("seek");
const timeNow = document.getElementById("timeNow");
const timeEnd = document.getElementById("timeEnd");
const playBtn = document.getElementById("play");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

const normalPlaylist = [
  { artist: "Jay Park",       title: "The Promise",      src: "assets/audio/the_promise.mp3",      art: "assets/images/the_promise.jpg" },
  { artist: "Lee Hi, G.Soul", title: "NO WAY",           src: "assets/audio/no_way.mp3",           art: "assets/images/no_way.jpg" },
  { artist: "keshi",          title: "War With Heaven",  src: "assets/audio/war_with_heaven.mp3",  art: "assets/images/war_with_heaven.jpg" },
];
const noTrack = { artist: "Nina", title: "Someday", src: "assets/audio/someday.mp3", art: "assets/images/someday.jpg" };

let currentPlaylist = normalPlaylist;
let index = 0;
let inNoMode = false;
let lastNormalState = { index: 0, time: 0 };

function setTrack(track) {
  artistEl.textContent = track.artist;
  titleEl.textContent = track.title;
  art.src = track.art;
  audio.src = track.src;
}

function setIndex(i) {
  index = (i + currentPlaylist.length) % currentPlaylist.length;
  setTrack(currentPlaylist[index]);
}

function formatTime(seconds) {
  if (!isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function updatePlayingUI(isPlaying) {
  musicSection.classList.toggle("is-playing", isPlaying);
  playBtn.textContent = isPlaying ? "Pause" : "Play";
}

async function play() { await audio.play(); updatePlayingUI(true); }
function pause() { audio.pause(); updatePlayingUI(false); }

playBtn.addEventListener("click", async () => { try { audio.paused ? await play() : pause(); } catch {} });
prevBtn.addEventListener("click", async () => { if (inNoMode) return; setIndex(index - 1); try { await play(); } catch {} });
nextBtn.addEventListener("click", async () => { if (inNoMode) return; setIndex(index + 1); try { await play(); } catch {} });

audio.addEventListener("ended", async () => {
  if (inNoMode) { audio.currentTime = 0; try { await play(); } catch {}; return; }
  setIndex(index + 1);
  try { await play(); } catch {}
});

audio.addEventListener("timeupdate", () => {
  const cur = audio.currentTime;
  const dur = audio.duration || 0;
  timeNow.textContent = formatTime(cur);
  timeEnd.textContent = formatTime(dur);
  const pct = dur ? (cur / dur) * 100 : 0;
  seek.value = String(pct);
});

seek.addEventListener("input", () => {
  const dur = audio.duration || 0;
  audio.currentTime = dur * (Number(seek.value) / 100);
});

setTrack(normalPlaylist[0]);

// ---------- Question logic ----------
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const qTitle = document.getElementById("qTitle");
const qSub = document.getElementById("qSub");
const hearts = document.getElementById("hearts");

function startHearts() {
  const durationMs = 4200;
  const start = performance.now();

  function spawn() {
    const heart = document.createElement("div");
    heart.className = "heart";
    heart.textContent = "♥";
    heart.style.left = `${Math.random() * 100}%`;
    heart.style.fontSize = `${14 + Math.random() * 18}px`;
    heart.style.opacity = `${0.55 + Math.random() * 0.45}`;
    heart.style.animationDuration = `${2.4 + Math.random() * 1.2}s`;
    hearts.appendChild(heart);
    setTimeout(() => heart.remove(), 4000);
  }

  function loop(now) {
    if (now - start > durationMs) return;
    spawn();
    setTimeout(() => requestAnimationFrame(loop), 120);
  }

  requestAnimationFrame(loop);
}

noBtn.addEventListener("click", async () => {
  if (!inNoMode) { lastNormalState.index = index; lastNormalState.time = audio.currentTime || 0; }
  inNoMode = true;
  setTrack(noTrack);
  audio.currentTime = 0;
  try { await play(); } catch {}
  document.getElementById("music").scrollIntoView({ behavior: "smooth" });
});

yesBtn.addEventListener("click", async () => {
  qTitle.textContent = "You will be my Valentine.";
  qSub.textContent = "Locked in";
  yesBtn.disabled = true;
  noBtn.disabled = true;
  startHearts();

  if (inNoMode) {
    inNoMode = false;
    currentPlaylist = normalPlaylist;
    setIndex(lastNormalState.index);
    audio.addEventListener("loadedmetadata", () => {
      audio.currentTime = Math.min(lastNormalState.time, audio.duration || lastNormalState.time);
    }, { once: true });
    try { await play(); } catch {}
  }
});

// ---------- Loader ----------
const loader = document.getElementById("loader");
const loaderImg = document.getElementById("loaderImg");
const loaderPct = document.getElementById("loaderPct");
const loaderBar = document.getElementById("loaderBar");
const progress = document.getElementById("progress");
const openBtn = document.getElementById("openBtn");
const volumeMsg = document.getElementById("volumeMsg");

const LOAD_COUNT = 10;
const SLIDE_MS = 200;

const loadImages = Array.from({ length: LOAD_COUNT }, (_, i) => `assets/images/load${i + 1}.jpg`);
const assetsToPreload = [
  "assets/images/us.jpg",
  ...loadImages,
  "assets/images/the_promise.jpg",
  "assets/images/no_way.jpg",
  "assets/images/war_with_heaven.jpg",
  "assets/images/someday.jpg",
  "assets/audio/the_promise.mp3",
  "assets/audio/no_way.mp3",
  "assets/audio/war_with_heaven.mp3",
  "assets/audio/someday.mp3",
];

let slideshowProgress = 0;
let preloadProgress = 0;
let slideshowFirstPassDone = false;
let preloadDone = false;
let ready = false;

let openShown = false;
let slideshowTimer = null;

function setProgress(p01) {
  const pct = Math.max(0, Math.min(1, p01));
  const pctInt = Math.round(pct * 100);
  loaderPct.textContent = String(pctInt);
  loaderBar.style.width = `${pctInt}%`;
}

function blendedProgress() {
  const avg = (slideshowProgress + preloadProgress) / 2;
  const cap = Math.min(0.999, avg);
  return ready ? 1 : cap;
}

function markReadyIfDone() {
  if (ready) return;
  if (!(slideshowFirstPassDone && preloadDone)) return;

  ready = true;
  setProgress(1);

  // fade progress out first, then show button + volume msg
  progress.classList.add("fade-out");

  setTimeout(() => {
    if (openShown) return;
    openShown = true;

    openBtn.hidden = false;
    requestAnimationFrame(() => openBtn.classList.add("show"));

    volumeMsg.hidden = false;
    requestAnimationFrame(() => volumeMsg.classList.add("show"));
  }, 520);
}

function startSlideshowLoop() {
  let i = 0;
  loaderImg.src = loadImages[0];

  slideshowTimer = setInterval(() => {
    i = (i + 1) % LOAD_COUNT;
    loaderImg.src = loadImages[i];

    if (!slideshowFirstPassDone) {
      const shownCount = i + 1;
      slideshowProgress = Math.min(1, shownCount / LOAD_COUNT);
      setProgress(blendedProgress());

      if (shownCount >= LOAD_COUNT) {
        slideshowFirstPassDone = true;
        slideshowProgress = 1;
        setProgress(blendedProgress());
        markReadyIfDone();
      }
    }
  }, SLIDE_MS);
}

async function preloadAssets(list) {
  let loaded = 0;
  const total = list.length;

  function bump() {
    loaded += 1;
    preloadProgress = loaded / total;
    setProgress(blendedProgress());
    if (loaded >= total) {
      preloadDone = true;
      preloadProgress = 1;
      setProgress(blendedProgress());
      markReadyIfDone();
    }
  }

  const tasks = list.map((src) => new Promise((resolve) => {
    const isAudio = /\.(mp3|wav|m4a|ogg)$/i.test(src);

    if (isAudio) {
      const a = new Audio();
      a.preload = "auto";
      a.src = src;
      const done = () => { cleanup(); bump(); resolve(); };
      const cleanup = () => {
        a.removeEventListener("canplaythrough", done);
        a.removeEventListener("loadeddata", done);
        a.removeEventListener("error", done);
      };
      a.addEventListener("canplaythrough", done, { once: true });
      a.addEventListener("loadeddata", done, { once: true });
      a.addEventListener("error", done, { once: true });
      a.load();
    } else {
      const img = new Image();
      const done = () => { cleanup(); bump(); resolve(); };
      const cleanup = () => {
        img.removeEventListener("load", done);
        img.removeEventListener("error", done);
      };
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
      img.src = src;
    }
  }));

  await Promise.all(tasks);
}

(function initLoader() {
  setProgress(0);
  startSlideshowLoop();
  preloadAssets(assetsToPreload);
})();

openBtn.addEventListener("click", async () => {
  if (slideshowTimer) clearInterval(slideshowTimer);

  // start music (track 1)
  inNoMode = false;
  currentPlaylist = normalPlaylist;
  setIndex(0);
  audio.currentTime = 0;
  try { await play(); } catch {}

  // show bottom nav
  dotnav.classList.remove("is-hidden");

  // fade OUT loader
  loader.classList.add("is-exiting");

  // after fade, remove loader + fade IN hero
  setTimeout(() => {
    loader.remove();
    document.body.classList.remove("locked");

    const hero = document.getElementById("hero");
    hero.classList.add("is-visible");
  }, 1200);
});
