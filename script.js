const winLines = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

const storageKey = "quick-grid-save-v1";
const skins = [
  { id: "classic", name: "Classic", cost: 0, bg: "#f7f6f2", panel: "#fffef8", accent: "#ef6f4e", accent2: "#1c8a72" },
  { id: "mint", name: "Mint", cost: 80, bg: "#f0fff9", panel: "#ffffff", accent: "#0f9b8e", accent2: "#207c64" },
  { id: "sunset", name: "Sunset", cost: 180, bg: "#fff2e9", panel: "#fffaf5", accent: "#ff6a3d", accent2: "#8f4f2f" }
];

const game = {
  boardState: Array(9).fill(null),
  currentPlayer: "x",
  gameOver: true,
  rounds: 0,
  stars: 0,
  coins: 0,
  streak: 0,
  lastClaimDate: "",
  ownedSkins: ["classic"],
  activeSkin: "classic",
  trailerMode: false,
  trailerTimer: null
};

const board = document.getElementById("board");
const statusText = document.getElementById("statusText");
const levelValue = document.getElementById("levelValue");
const starsValue = document.getElementById("starsValue");
const coinsValue = document.getElementById("coinsValue");
const streakValue = document.getElementById("streakValue");
const skinsWrap = document.getElementById("skins");
const app = document.querySelector(".app");

function save() {
  localStorage.setItem(storageKey, JSON.stringify({
    stars: game.stars,
    coins: game.coins,
    streak: game.streak,
    lastClaimDate: game.lastClaimDate,
    ownedSkins: game.ownedSkins,
    activeSkin: game.activeSkin
  }));
}

function load() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    game.stars = saved.stars || 0;
    game.coins = saved.coins || 0;
    game.streak = saved.streak || 0;
    game.lastClaimDate = saved.lastClaimDate || "";
    game.ownedSkins = saved.ownedSkins || ["classic"];
    game.activeSkin = saved.activeSkin || "classic";
  } catch (_) {}
}

function currentLevel() {
  return Math.min(30, Math.floor(game.stars / 3) + 1);
}

function checkWin(player) {
  return winLines.find((line) => line.every((index) => game.boardState[index] === player));
}

function checkDraw() {
  return game.boardState.every((cell) => cell !== null);
}

function setStatus(text) {
  statusText.textContent = text;
}

function applySkin() {
  const skin = skins.find((s) => s.id === game.activeSkin) || skins[0];
  document.documentElement.style.setProperty("--bg", skin.bg);
  document.documentElement.style.setProperty("--panel", skin.panel);
  document.documentElement.style.setProperty("--accent", skin.accent);
  document.documentElement.style.setProperty("--accent-2", skin.accent2);
}

function renderSkins() {
  skinsWrap.innerHTML = "";
  skins.forEach((skin) => {
    const btn = document.createElement("button");
    btn.className = "skin";
    const owned = game.ownedSkins.includes(skin.id);
    const active = game.activeSkin === skin.id;
    btn.textContent = active
      ? "Using: " + skin.name
      : owned
        ? "Use " + skin.name
        : "Unlock " + skin.name + " (" + skin.cost + "c)";
    btn.disabled = active;
    btn.addEventListener("click", () => {
      if (game.ownedSkins.includes(skin.id)) {
        game.activeSkin = skin.id;
        applySkin();
        renderSkins();
        save();
        return;
      }
      if (game.coins >= skin.cost) {
        game.coins -= skin.cost;
        game.ownedSkins.push(skin.id);
        game.activeSkin = skin.id;
        applySkin();
        renderHUD();
        renderSkins();
        setStatus("Skin unlocked: " + skin.name);
        save();
      } else {
        setStatus("Need " + (skin.cost - game.coins) + " more coins.");
      }
    });
    skinsWrap.appendChild(btn);
  });
}


function renderHUD() {
  levelValue.textContent = currentLevel();
  starsValue.textContent = game.stars;
  coinsValue.textContent = game.coins;
  streakValue.textContent = game.streak;
}

function rewardRound(outcome) {
  if (outcome === "x") {
    game.stars += 1;
    game.coins += 16;
    setStatus("Win! +1 star, +16 coins.");
  } else if (outcome === "o") {
    game.coins += 6;
    setStatus("O wins. +6 coins for finishing.");
  } else {
    game.coins += 9;
    setStatus("Draw! +9 coins.");
  }

  if (game.stars > 0 && game.stars % 5 === 0) {
    game.coins += 20;
    setStatus("Milestone hit! +20 bonus coins.");
  }

  renderHUD();
  renderSkins();
  save();
}



function renderHUD() {
  levelValue.textContent = currentLevel();
  starsValue.textContent = game.stars;
  coinsValue.textContent = game.coins;
  streakValue.textContent = game.streak;
}


function clearBoardUI() {
  const cells = document.querySelectorAll(".cell");
  cells.forEach((c) => {
    c.textContent = "";
    c.classList.remove("win");
  });
}

function markWinLine(line) {
  if (!line) return;
  const cells = document.querySelectorAll(".cell");
  line.forEach((index) => cells[index].classList.add("win"));
}



function playBeep(type) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = type === "win" ? 620 : type === "draw" ? 440 : 320;
  gain.gain.value = 0.05;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.09);
  osc.onended = () => ctx.close();
}

function haptic(ms) {
  if (navigator.vibrate) navigator.vibrate(ms);
}


function startRound() {
  game.boardState = Array(9).fill(null);
  game.currentPlayer = "x";
  game.gameOver = false;
  game.rounds += 1;
  clearBoardUI();
  setStatus("Round " + game.rounds + ": Player X turn.");
}

function finishRound(outcome) {
  game.gameOver = true;
  rewardRound(outcome);
}

function setupBoard() {
  for (let i = 0; i < 9; i += 1) {
    const div = document.createElement("div");
    div.className = "cell";
    div.addEventListener("click", () => {
      if (game.gameOver || div.textContent) return;

      div.textContent = game.currentPlayer.toUpperCase();
      div.classList.remove("pop");
      void div.offsetWidth;
      div.classList.add("pop");
      playBeep("tap");
      haptic(14);

      game.boardState[i] = game.currentPlayer;

      const winLine = checkWin(game.currentPlayer);
      if (winLine) {
        markWinLine(winLine);
        playBeep("win");
        haptic([40, 30, 40]);
        finishRound(game.currentPlayer);
        return;
      }
      if (checkDraw()) {
        playBeep("draw");
        haptic(22);
        finishRound("draw");
        return;
      }

      game.currentPlayer = game.currentPlayer === "x" ? "o" : "x";
      setStatus("Player " + game.currentPlayer.toUpperCase() + " turn.");
    });
    board.appendChild(div);
  }
}





function randomMove() {
  if (game.gameOver) return;
  const options = [];
  for (let i = 0; i < game.boardState.length; i += 1) {
    if (game.boardState[i] === null) options.push(i);
  }
  if (options.length === 0) return;
  const idx = options[Math.floor(Math.random() * options.length)];
  const cell = board.children[idx];
  cell.click();
}

function runTrailerLoop() {
  if (!game.trailerMode) return;
  if (game.gameOver) startRound();
  game.trailerTimer = setInterval(() => {
    if (!game.trailerMode) return;
    if (game.gameOver) {
      startRound();
      return;
    }
    randomMove();
  }, 520);
}

function stopTrailerLoop() {
  clearInterval(game.trailerTimer);
  game.trailerTimer = null;
}

function toggleTrailerMode() {
  game.trailerMode = !game.trailerMode;
  const btn = document.getElementById("trailerBtn");
  if (game.trailerMode) {
    app.classList.add("trailer-mode");
    btn.textContent = "Trailer Mode: On";
    setStatus("Trailer mode enabled. Recording-ready auto demo.");
    stopTrailerLoop();
    runTrailerLoop();
  } else {
    app.classList.remove("trailer-mode");
    btn.textContent = "Trailer Mode: Off";
    stopTrailerLoop();
    setStatus("Trailer mode disabled.");
  }
}


function dayDiff(prevDateString, todayString) {
  const oneDay = 24 * 60 * 60 * 1000;
  const prev = new Date(prevDateString + "T00:00:00");
  const cur = new Date(todayString + "T00:00:00");
  return Math.round((cur - prev) / oneDay);
}

function claimDailyReward() {
  const today = new Date().toISOString().slice(0, 10);
  if (!game.lastClaimDate) {
    game.streak = 1;
  } else {
    const diff = dayDiff(game.lastClaimDate, today);
    if (diff === 1) game.streak += 1;
    if (diff > 1) game.streak = 1;
    if (diff === 0) return;
  }
  const reward = 15 + (game.streak * 2);
  game.coins += reward;
  game.lastClaimDate = today;
  setStatus("Daily reward: +" + reward + " coins. Streak " + game.streak + ".");
  renderHUD();
  save();
}
//git add .
//.   git push origin main