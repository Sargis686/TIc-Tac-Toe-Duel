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