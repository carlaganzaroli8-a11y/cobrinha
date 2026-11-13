/**
 * Snake Arena — Motor de Jogo em JavaScript Puro
 * Níveis progressivos, obstáculos, redução de área, controles por teclado/toque
 * e ranking Top 10 persistente via localStorage.
 */

const GRID_SIZE = 20;
const STORAGE_RANKING_KEY = "snake_arena_ranking_v1";
const STORAGE_SOUND_KEY = "snake_arena_sound_v1";
const MAX_RANKING_ITEMS = 10;
const FOOD_POINTS = 10;
const BONUS_POINTS = 25;
const BONUS_DURATION_MS = 7500;

/**
 * Definição dos 5 níveis de dificuldade crescente.
 * inset: reduz a área útil nas bordas (ex: inset 1 transforma 20x20 em 18x18).
 * obstacles: blocos sólidos posicionados no tabuleiro.
 */
const LEVELS = [
  {
    level: 1,
    name: "Campo Aberto",
    description: "Arena livre · Velocidade inicial",
    minScore: 0,
    nextScore: 50,
    tickMs: 145,
    inset: 0,
    obstacles: [],
  },
  {
    level: 2,
    name: "Quatro Pilares",
    description: "Pilares de pedra · Ritmo moderado",
    minScore: 50,
    nextScore: 120,
    tickMs: 120,
    inset: 0,
    obstacles: [
      { x: 4, y: 4 },
      { x: 4, y: 5 },
      { x: 15, y: 4 },
      { x: 15, y: 5 },
      { x: 4, y: 14 },
      { x: 4, y: 15 },
      { x: 15, y: 14 },
      { x: 15, y: 15 },
    ],
  },
  {
    level: 3,
    name: "Portais Centrais",
    description: "Barreiras no centro · +Velocidade",
    minScore: 120,
    nextScore: 210,
    tickMs: 100,
    inset: 0,
    obstacles: [
      { x: 9, y: 3 },
      { x: 10, y: 3 },
      { x: 9, y: 4 },
      { x: 10, y: 4 },
      { x: 9, y: 15 },
      { x: 10, y: 15 },
      { x: 9, y: 16 },
      { x: 10, y: 16 },
      { x: 3, y: 9 },
      { x: 4, y: 9 },
      { x: 15, y: 10 },
      { x: 16, y: 10 },
    ],
  },
  {
    level: 4,
    name: "Arena Compacta",
    description: "Área reduzida (18×18) · Corredores",
    minScore: 210,
    nextScore: 320,
    tickMs: 85,
    inset: 1,
    obstacles: [
      { x: 5, y: 5 },
      { x: 6, y: 5 },
      { x: 13, y: 5 },
      { x: 14, y: 5 },
      { x: 5, y: 14 },
      { x: 6, y: 14 },
      { x: 13, y: 14 },
      { x: 14, y: 14 },
      { x: 9, y: 7 },
      { x: 10, y: 12 },
    ],
  },
  {
    level: 5,
    name: "Núcleo Extremo",
    description: "Área mínima (16×16) · Velocidade máxima",
    minScore: 320,
    nextScore: null,
    tickMs: 70,
    inset: 2,
    obstacles: [
      { x: 5, y: 6 },
      { x: 5, y: 7 },
      { x: 14, y: 6 },
      { x: 14, y: 7 },
      { x: 5, y: 12 },
      { x: 5, y: 13 },
      { x: 14, y: 12 },
      { x: 14, y: 13 },
      { x: 9, y: 4 },
      { x: 10, y: 15 },
    ],
  },
];

const DIRECTIONS = {
  UP: { x: 0, y: -1, opposite: "DOWN" },
  DOWN: { x: 0, y: 1, opposite: "UP" },
  LEFT: { x: -1, y: 0, opposite: "RIGHT" },
  RIGHT: { x: 1, y: 0, opposite: "LEFT" },
};

// Elementos do DOM
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const hudScoreEl = document.getElementById("hud-score");
const hudLevelEl = document.getElementById("hud-level");
const hudSpeedEl = document.getElementById("hud-speed");
const hudTargetEl = document.getElementById("hud-target");
const progressBarEl = document.getElementById("level-progress-bar");
const progressFillEl = document.getElementById("level-progress-fill");

const overlayStart = document.getElementById("overlay-start");
const overlayPause = document.getElementById("overlay-pause");
const overlayGameover = document.getElementById("overlay-gameover");
const levelBanner = document.getElementById("level-banner");
const levelBannerKicker = document.getElementById("level-banner-kicker");
const levelBannerTitle = document.getElementById("level-banner-title");

const startForm = document.getElementById("start-form");
const playerNameInput = document.getElementById("player-name");
const btnSound = document.getElementById("btn-sound");
const btnPause = document.getElementById("btn-pause");
const btnResume = document.getElementById("btn-resume");
const btnRestartPause = document.getElementById("btn-restart-pause");
const btnPlayAgain = document.getElementById("btn-play-again");
const btnChangePlayer = document.getElementById("btn-change-player");

const pausePlayerNameEl = document.getElementById("pause-player-name");
const pauseScoreEl = document.getElementById("pause-score");
const gameoverReasonEl = document.getElementById("gameover-reason");
const gameoverScoreEl = document.getElementById("gameover-score");
const gameoverLevelEl = document.getElementById("gameover-level");
const gameoverRankMsgEl = document.getElementById("gameover-rank-msg");

const levelListEl = document.getElementById("level-list");
const activeLevelNameEl = document.getElementById("active-level-name");
const rankingEmptyEl = document.getElementById("ranking-empty");
const rankingTableWrapEl = document.getElementById("ranking-table-wrap");
const rankingBodyEl = document.getElementById("ranking-body");

const btnClearRanking = document.getElementById("btn-clear-ranking");
const clearConfirmBox = document.getElementById("clear-confirm-box");
const btnConfirmClear = document.getElementById("btn-confirm-clear");
const btnCancelClear = document.getElementById("btn-cancel-clear");

const dpadButtons = document.querySelectorAll(".dpad-btn");

// Estado do jogo
let gameState = "TITLE_MENU"; // TITLE_MENU | PLAYING | PAUSED | GAME_OVER
let playerName = "Jogador";
let snake = [];
let currentDir = "RIGHT";
let dirQueue = [];
let food = { x: 14, y: 10 };
let bonusFood = null; // { x, y, expiresAt }
let score = 0;
let levelIndex = 0;
let activeObstacles = [];
let lastTickTime = 0;
let freezeUntil = 0;
let bannerTimeoutId = null;
let lastRecordId = null;
let soundEnabled = loadSoundPreference();

// Áudio Web API sintetizado
let audioCtx = null;

function loadSoundPreference() {
  try {
    const saved = localStorage.getItem(STORAGE_SOUND_KEY);
    return saved === null ? true : saved === "true";
  } catch {
    return true;
  }
}

function saveSoundPreference(enabled) {
  try {
    localStorage.setItem(STORAGE_SOUND_KEY, String(enabled));
  } catch {
    // Ignora falhas de armazenamento privado
  }
}

function playTone(freq, durationSec, type = "sine", volume = 0.06, delay = 0) {
  if (!soundEnabled) return;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    const now = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + durationSec);
  } catch {
    // Ignora erros de áudio caso o navegador bloqueie
  }
}

function playSfx(kind) {
  if (!soundEnabled) return;
  if (kind === "eat") {
    playTone(520, 0.08, "triangle", 0.06);
    playTone(680, 0.09, "triangle", 0.05, 0.04);
  } else if (kind === "bonus") {
    playTone(660, 0.09, "sine", 0.07);
    playTone(880, 0.1, "sine", 0.07, 0.06);
    playTone(1100, 0.14, "sine", 0.06, 0.12);
  } else if (kind === "levelup") {
    playTone(440, 0.1, "triangle", 0.07);
    playTone(554, 0.1, "triangle", 0.07, 0.08);
    playTone(659, 0.12, "triangle", 0.07, 0.16);
    playTone(880, 0.22, "triangle", 0.08, 0.24);
  } else if (kind === "pause") {
    playTone(340, 0.08, "sine", 0.05);
  } else if (kind === "gameover") {
    playTone(260, 0.14, "sawtooth", 0.05);
    playTone(190, 0.22, "sawtooth", 0.05, 0.12);
  }
}

// Ranking no localStorage
function loadRanking() {
  try {
    const raw = localStorage.getItem(STORAGE_RANKING_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item) =>
          item &&
          typeof item.name === "string" &&
          typeof item.score === "number" &&
          typeof item.level === "number"
      )
      .sort((a, b) => b.score - a.score || b.level - a.level)
      .slice(0, MAX_RANKING_ITEMS);
  } catch {
    return [];
  }
}

function saveRanking(list) {
  try {
    localStorage.setItem(STORAGE_RANKING_KEY, JSON.stringify(list));
  } catch {
    // Ignora falha de cota
  }
}

function recordScoreToRanking(name, finalScore, levelReached) {
  if (finalScore <= 0) {
    return { entered: false, position: null };
  }
  const ranking = loadRanking();
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    score: finalScore,
    level: levelReached,
    date: Date.now(),
  };

  const combined = [...ranking, entry].sort(
    (a, b) => b.score - a.score || b.level - a.level || a.date - b.date
  );
  const trimmed = combined.slice(0, MAX_RANKING_ITEMS);
  const positionIndex = trimmed.findIndex((item) => item.id === entry.id);

  if (positionIndex !== -1) {
    saveRanking(trimmed);
    lastRecordId = entry.id;
    renderRanking();
    return { entered: true, position: positionIndex + 1 };
  }

  lastRecordId = null;
  renderRanking();
  return { entered: false, position: null };
}

function renderRanking() {
  const ranking = loadRanking();
  rankingBodyEl.innerHTML = "";

  if (ranking.length === 0) {
    rankingEmptyEl.hidden = false;
    rankingTableWrapEl.hidden = true;
    btnClearRanking.disabled = true;
    return;
  }

  rankingEmptyEl.hidden = true;
  rankingTableWrapEl.hidden = false;
  btnClearRanking.disabled = false;

  ranking.forEach((item, index) => {
    const tr = document.createElement("tr");
    if (item.id && item.id === lastRecordId) {
      tr.classList.add("is-new-record");
    }

    const posTd = document.createElement("td");
    posTd.className = `tabular rank-pos ${index < 3 ? `rank-pos-${index + 1}` : ""}`;
    posTd.textContent = `${index + 1}º`;

    const nameTd = document.createElement("td");
    nameTd.className = "rank-player";
    nameTd.textContent = item.name;
    nameTd.title = item.name;

    const levelTd = document.createElement("td");
    levelTd.className = "tabular";
    levelTd.textContent = `Nível ${item.level}`;

    const scoreTd = document.createElement("td");
    scoreTd.className = "tabular num-col";
    scoreTd.textContent = String(item.score);

    tr.append(posTd, nameTd, levelTd, scoreTd);
    rankingBodyEl.appendChild(tr);
  });
}

// Renderização da lista de níveis na barra lateral
function renderLevelRoadmap() {
  const currentLvl = LEVELS[levelIndex];
  activeLevelNameEl.textContent = `Nível ${currentLvl.level}: ${currentLvl.name}`;
  levelListEl.innerHTML = "";

  LEVELS.forEach((lvl, idx) => {
    const li = document.createElement("li");
    li.className = "level-item";
    if (idx === levelIndex) {
      li.classList.add("is-active");
    } else if (idx < levelIndex) {
      li.classList.add("is-cleared");
    }

    const mainDiv = document.createElement("div");
    mainDiv.className = "level-item-main";

    const nameSpan = document.createElement("span");
    nameSpan.className = "level-item-name";
    nameSpan.textContent = `${lvl.level}. ${lvl.name}`;

    const descSpan = document.createElement("span");
    descSpan.className = "level-item-desc";
    descSpan.textContent = lvl.description;

    mainDiv.append(nameSpan, descSpan);

    const reqSpan = document.createElement("span");
    reqSpan.className = "level-item-req tabular";
    reqSpan.textContent = lvl.minScore === 0 ? "Início" : `${lvl.minScore} pts`;

    li.append(mainDiv, reqSpan);
    levelListEl.appendChild(li);
  });
}

// Helpers de tabuleiro e colisão
function isInsidePlayableArea(x, y, inset) {
  return x >= inset && x < GRID_SIZE - inset && y >= inset && y < GRID_SIZE - inset;
}

function hasObstacleAt(x, y, obstacles) {
  return obstacles.some((obs) => obs.x === x && obs.y === y);
}

function hasSnakeAt(x, y, ignoreTail = false) {
  const limit = ignoreTail ? snake.length - 1 : snake.length;
  for (let i = 0; i < limit; i += 1) {
    if (snake[i].x === x && snake[i].y === y) return true;
  }
  return false;
}

function computeSafeObstaclesForLevel(lvlConfig, currentSnake, headDir) {
  const vec = DIRECTIONS[headDir];
  const head = currentSnake[0];
  const bufferCells = [
    { x: head.x + vec.x, y: head.y + vec.y },
    { x: head.x + vec.x * 2, y: head.y + vec.y * 2 },
  ];

  return lvlConfig.obstacles.filter((obs) => {
    if (!isInsidePlayableArea(obs.x, obs.y, lvlConfig.inset)) return false;
    const hitsSnake = currentSnake.some((seg) => seg.x === obs.x && seg.y === obs.y);
    const hitsBuffer = bufferCells.some((c) => c.x === obs.x && c.y === obs.y);
    return !hitsSnake && !hitsBuffer;
  });
}

function ensureSnakeInsideInset(inset) {
  const head = snake[0];
  const outOfBounds = snake.some((seg) => !isInsidePlayableArea(seg.x, seg.y, inset));
  if (!outOfBounds) return false;

  // Reposiciona a cobra com segurança no centro do tabuleiro preservando o comprimento
  const centerY = Math.floor(GRID_SIZE / 2);
  const startX = Math.floor(GRID_SIZE / 2) + 1;
  const maxLen = Math.min(snake.length, 6);
  const relocated = [];
  for (let i = 0; i < maxLen; i += 1) {
    relocated.push({ x: startX - i, y: centerY });
  }
  // Caso o comprimento seja maior que a linha central, dobra em L de forma segura
  while (relocated.length < snake.length) {
    const tail = relocated[relocated.length - 1];
    if (tail.y + 1 < GRID_SIZE - inset) {
      relocated.push({ x: tail.x, y: tail.y + 1 });
    } else if (tail.y - 1 >= inset) {
      relocated.push({ x: tail.x, y: tail.y - 1 });
    } else {
      break;
    }
  }
  snake = relocated;
  currentDir = "RIGHT";
  dirQueue = [];
  return head.x !== snake[0].x || head.y !== snake[0].y;
}

function spawnFreeCell(inset, obstacles, extraBlocked = null) {
  const freeCells = [];
  for (let y = inset; y < GRID_SIZE - inset; y += 1) {
    for (let x = inset; x < GRID_SIZE - inset; x += 1) {
      if (hasSnakeAt(x, y)) continue;
      if (hasObstacleAt(x, y, obstacles)) continue;
      if (extraBlocked && extraBlocked.x === x && extraBlocked.y === y) continue;
      freeCells.push({ x, y });
    }
  }
  if (freeCells.length === 0) return null;
  return freeCells[Math.floor(Math.random() * freeCells.length)];
}

function getCurrentTickMs() {
  const base = LEVELS[levelIndex].tickMs;
  if (levelIndex === LEVELS.length - 1 && score > 320) {
    const extraSteps = Math.floor((score - 320) / 80);
    return Math.max(56, base - extraSteps * 3);
  }
  return base;
}

function updateHUD() {
  const lvl = LEVELS[levelIndex];
  hudScoreEl.textContent = String(score);
  hudLevelEl.textContent = `${lvl.level} / ${LEVELS.length}`;

  const speedMultiplier = (LEVELS[0].tickMs / getCurrentTickMs()).toFixed(1);
  hudSpeedEl.textContent = `${speedMultiplier}×`;

  if (lvl.nextScore === null) {
    hudTargetEl.textContent = "Nível máximo";
    progressFillEl.style.width = "100%";
    progressBarEl.setAttribute("aria-valuenow", "100");
  } else {
    const span = lvl.nextScore - lvl.minScore;
    const gained = Math.max(0, score - lvl.minScore);
    const pct = Math.min(100, Math.round((gained / span) * 100));
    hudTargetEl.textContent = `${score} / ${lvl.nextScore} pts`;
    progressFillEl.style.width = `${pct}%`;
    progressBarEl.setAttribute("aria-valuenow", String(pct));
  }
}

function showLevelBanner(kicker, title, duration = 1800) {
  if (bannerTimeoutId) {
    clearTimeout(bannerTimeoutId);
  }
  levelBannerKicker.textContent = kicker;
  levelBannerTitle.textContent = title;
  levelBanner.hidden = false;
  bannerTimeoutId = setTimeout(() => {
    levelBanner.hidden = true;
  }, duration);
}

function hideAllOverlays() {
  overlayStart.hidden = true;
  overlayPause.hidden = true;
  overlayGameover.hidden = true;
}

function resolvePlayerName() {
  const typed = playerNameInput.value.trim();
  return typed.length > 0 ? typed : "Jogador";
}

function resetGameVariables() {
  const lvl = LEVELS[0];
  score = 0;
  levelIndex = 0;
  snake = [
    { x: 9, y: 10 },
    { x: 8, y: 10 },
    { x: 7, y: 10 },
  ];
  currentDir = "RIGHT";
  dirQueue = [];
  activeObstacles = [...lvl.obstacles];
  bonusFood = null;
  food = spawnFreeCell(lvl.inset, activeObstacles) || { x: 14, y: 10 };
  freezeUntil = 0;
  lastTickTime = performance.now();
  levelBanner.hidden = true;
  updateHUD();
  renderLevelRoadmap();
}

function startGame() {
  playerName = resolvePlayerName();
  lastRecordId = null;
  resetGameVariables();
  hideAllOverlays();
  gameState = "PLAYING";
  btnPause.disabled = false;
  btnPause.textContent = "Pausar";
  showLevelBanner("Nível 1", LEVELS[0].name, 1300);
  renderRanking();
}

function togglePause() {
  if (gameState === "PLAYING") {
    gameState = "PAUSED";
    playSfx("pause");
    btnPause.textContent = "Retomar";
    pausePlayerNameEl.textContent = playerName;
    pauseScoreEl.textContent = `${score} pts`;
    overlayPause.hidden = false;
  } else if (gameState === "PAUSED") {
    gameState = "PLAYING";
    playSfx("pause");
    btnPause.textContent = "Pausar";
    overlayPause.hidden = true;
    lastTickTime = performance.now();
  }
}

function triggerGameOver(reasonText) {
  gameState = "GAME_OVER";
  playSfx("gameover");
  btnPause.disabled = true;
  btnPause.textContent = "Pausar";
  levelBanner.hidden = true;

  const reachedLevel = LEVELS[levelIndex].level;
  const result = recordScoreToRanking(playerName, score, reachedLevel);

  gameoverReasonEl.textContent = reasonText;
  gameoverScoreEl.textContent = String(score);
  gameoverLevelEl.textContent = String(reachedLevel);

  if (result.entered) {
    gameoverRankMsgEl.textContent = `Novo destaque! ${playerName} entrou no Top 10 (${result.position}º lugar).`;
  } else if (score === 0) {
    gameoverRankMsgEl.textContent = "Marque pontos para entrar no ranking Top 10.";
  } else {
    gameoverRankMsgEl.textContent = "Pontuação abaixo do Top 10 atual. Tente novamente!";
  }

  overlayGameover.hidden = false;
}

function returnToStartMenu() {
  gameState = "TITLE_MENU";
  btnPause.disabled = true;
  btnPause.textContent = "Pausar";
  hideAllOverlays();
  overlayStart.hidden = false;
  resetGameVariables();
  playerNameInput.focus();
}

function enqueueDirection(nextDir) {
  if (gameState !== "PLAYING") return;
  const referenceDir =
    dirQueue.length > 0 ? dirQueue[dirQueue.length - 1] : currentDir;
  if (nextDir === referenceDir) return;
  if (DIRECTIONS[nextDir].opposite === referenceDir) return;
  if (dirQueue.length < 2) {
    dirQueue.push(nextDir);
  }
}

function checkLevelProgression() {
  const nextIdx = levelIndex + 1;
  if (nextIdx >= LEVELS.length) return;

  const nextLevel = LEVELS[nextIdx];
  if (score >= nextLevel.minScore) {
    levelIndex = nextIdx;
    playSfx("levelup");

    const relocated = ensureSnakeInsideInset(nextLevel.inset);
    activeObstacles = computeSafeObstaclesForLevel(
      nextLevel,
      snake,
      currentDir
    );

    if (
      !isInsidePlayableArea(food.x, food.y, nextLevel.inset) ||
      hasObstacleAt(food.x, food.y, activeObstacles) ||
      hasSnakeAt(food.x, food.y)
    ) {
      food = spawnFreeCell(nextLevel.inset, activeObstacles, bonusFood) || food;
    }

    if (
      bonusFood &&
      (!isInsidePlayableArea(bonusFood.x, bonusFood.y, nextLevel.inset) ||
        hasObstacleAt(bonusFood.x, bonusFood.y, activeObstacles))
    ) {
      bonusFood = null;
    }

    // Breve pausa de 750ms para o jogador visualizar o novo layout da fase
    freezeUntil = performance.now() + (relocated ? 1050 : 700);
    showLevelBanner(
      `Nível ${nextLevel.level} desbloqueado`,
      nextLevel.name,
      2100
    );
    renderLevelRoadmap();
    updateHUD();
  }
}

function stepGame(now) {
  if (now < freezeUntil) return;

  if (bonusFood && now >= bonusFood.expiresAt) {
    bonusFood = null;
  }

  if (dirQueue.length > 0) {
    currentDir = dirQueue.shift();
  }

  const vec = DIRECTIONS[currentDir];
  const head = snake[0];
  const nextHead = { x: head.x + vec.x, y: head.y + vec.y };
  const lvl = LEVELS[levelIndex];

  // Colisão com parede / borda reduzida
  if (!isInsidePlayableArea(nextHead.x, nextHead.y, lvl.inset)) {
    triggerGameOver("Colisão com a parede");
    return;
  }

  // Colisão com obstáculo
  if (hasObstacleAt(nextHead.x, nextHead.y, activeObstacles)) {
    triggerGameOver("Colisão com obstáculo");
    return;
  }

  const willEatFruit = nextHead.x === food.x && nextHead.y === food.y;
  const willEatBonus =
    bonusFood !== null &&
    nextHead.x === bonusFood.x &&
    nextHead.y === bonusFood.y;

  // Colisão com o próprio corpo (ignora a cauda se não estiver crescendo)
  if (hasSnakeAt(nextHead.x, nextHead.y, !(willEatFruit || willEatBonus))) {
    triggerGameOver("Colisão com o próprio corpo");
    return;
  }

  snake.unshift(nextHead);

  if (willEatFruit) {
    score += FOOD_POINTS;
    playSfx("eat");
    food = spawnFreeCell(lvl.inset, activeObstacles, bonusFood) || food;

    if (!bonusFood && Math.random() < 0.25) {
      const bonusPos = spawnFreeCell(lvl.inset, activeObstacles, food);
      if (bonusPos) {
        bonusFood = {
          x: bonusPos.x,
          y: bonusPos.y,
          expiresAt: now + BONUS_DURATION_MS,
        };
      }
    }

    updateHUD();
    checkLevelProgression();
  } else if (willEatBonus) {
    score += BONUS_POINTS;
    bonusFood = null;
    playSfx("bonus");
    updateHUD();
    checkLevelProgression();
  } else {
    snake.pop();
  }
}

// Renderização em alta resolução (HiDPI) no Canvas
function resizeCanvasIfNeeded() {
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;
  const dpr = window.devicePixelRatio || 1;
  const targetWidth = Math.round(rect.width * dpr);
  const targetHeight = Math.round(rect.height * dpr);
  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }
}

function drawRoundedRect(x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function renderBoard(now) {
  resizeCanvasIfNeeded();
  const width = canvas.width;
  const height = canvas.height;
  const cell = width / GRID_SIZE;
  const inset = LEVELS[levelIndex].inset;

  // Fundo base
  ctx.fillStyle = "#0e1815";
  ctx.fillRect(0, 0, width, height);

  // Área restrita (quando inset > 0 nos níveis 4 e 5)
  if (inset > 0) {
    ctx.fillStyle = "#192622";
    for (let y = 0; y < GRID_SIZE; y += 1) {
      for (let x = 0; x < GRID_SIZE; x += 1) {
        if (!isInsidePlayableArea(x, y, inset)) {
          ctx.fillRect(x * cell, y * cell, cell, cell);
          ctx.strokeStyle = "#263b34";
          ctx.lineWidth = Math.max(1, cell * 0.05);
          ctx.strokeRect(
            x * cell + cell * 0.14,
            y * cell + cell * 0.14,
            cell * 0.72,
            cell * 0.72
          );
        }
      }
    }
  }

  // Grade sutil na área jogável
  ctx.strokeStyle = "rgba(38, 62, 54, 0.35)";
  ctx.lineWidth = 1;
  for (let i = inset; i <= GRID_SIZE - inset; i += 1) {
    const pos = i * cell;
    ctx.beginPath();
    ctx.moveTo(pos, inset * cell);
    ctx.lineTo(pos, (GRID_SIZE - inset) * cell);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(inset * cell, pos);
    ctx.lineTo((GRID_SIZE - inset) * cell, pos);
    ctx.stroke();
  }

  // Borda interna destacada se a área foi reduzida
  if (inset > 0) {
    ctx.strokeStyle = "rgba(245, 158, 11, 0.55)";
    ctx.lineWidth = Math.max(2, cell * 0.08);
    ctx.strokeRect(
      inset * cell,
      inset * cell,
      (GRID_SIZE - inset * 2) * cell,
      (GRID_SIZE - inset * 2) * cell
    );
  }

  // Obstáculos
  activeObstacles.forEach((obs) => {
    const px = obs.x * cell + cell * 0.1;
    const py = obs.y * cell + cell * 0.1;
    const size = cell * 0.8;
    ctx.fillStyle = "#3b4f48";
    drawRoundedRect(px, py, size, size, cell * 0.18);
    ctx.fill();

    ctx.strokeStyle = "#5c7a70";
    ctx.lineWidth = Math.max(1, cell * 0.06);
    ctx.stroke();
  });

  // Fruta principal
  const pulse = 1 + Math.sin(now * 0.006) * 0.07;
  const fx = (food.x + 0.5) * cell;
  const fy = (food.y + 0.5) * cell;
  ctx.fillStyle = "#f97316";
  ctx.beginPath();
  ctx.arc(fx, fy, cell * 0.34 * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#86efac";
  ctx.beginPath();
  ctx.ellipse(
    fx + cell * 0.1,
    fy - cell * 0.28,
    cell * 0.1,
    cell * 0.05,
    -0.5,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Fruta bônus dourada
  if (bonusFood) {
    const remainingRatio = Math.max(
      0,
      (bonusFood.expiresAt - now) / BONUS_DURATION_MS
    );
    const bx = (bonusFood.x + 0.5) * cell;
    const by = (bonusFood.y + 0.5) * cell;

    ctx.strokeStyle = "rgba(250, 204, 21, 0.45)";
    ctx.lineWidth = Math.max(2, cell * 0.08);
    ctx.beginPath();
    ctx.arc(
      bx,
      by,
      cell * 0.42,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * remainingRatio
    );
    ctx.stroke();

    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(bx, by, cell * 0.31, 0, Math.PI * 2);
    ctx.fill();
  }

  // Corpo da cobra
  for (let i = snake.length - 1; i >= 0; i -= 1) {
    const seg = snake[i];
    const isHead = i === 0;
    const pad = isHead ? cell * 0.06 : cell * 0.1;
    const x = seg.x * cell + pad;
    const y = seg.y * cell + pad;
    const size = cell - pad * 2;

    if (isHead) {
      ctx.fillStyle = "#34d399";
    } else {
      const ratio = 1 - (i / Math.max(snake.length, 1)) * 0.42;
      ctx.fillStyle = `rgba(16, 185, 129, ${ratio.toFixed(2)})`;
    }

    drawRoundedRect(x, y, size, size, isHead ? cell * 0.28 : cell * 0.22);
    ctx.fill();

    // Olhos direcionais na cabeça
    if (isHead) {
      ctx.fillStyle = "#062116";
      const eyeRadius = Math.max(2, cell * 0.085);
      let eye1 = { x: x + size * 0.72, y: y + size * 0.28 };
      let eye2 = { x: x + size * 0.72, y: y + size * 0.72 };

      if (currentDir === "LEFT") {
        eye1 = { x: x + size * 0.28, y: y + size * 0.28 };
        eye2 = { x: x + size * 0.28, y: y + size * 0.72 };
      } else if (currentDir === "UP") {
        eye1 = { x: x + size * 0.28, y: y + size * 0.28 };
        eye2 = { x: x + size * 0.72, y: y + size * 0.28 };
      } else if (currentDir === "DOWN") {
        eye1 = { x: x + size * 0.28, y: y + size * 0.72 };
        eye2 = { x: x + size * 0.72, y: y + size * 0.72 };
      }

      ctx.beginPath();
      ctx.arc(eye1.x, eye1.y, eyeRadius, 0, Math.PI * 2);
      ctx.arc(eye2.x, eye2.y, eyeRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Loop principal
function gameLoop(now) {
  if (gameState === "PLAYING") {
    const tickMs = getCurrentTickMs();
    if (now - lastTickTime >= tickMs) {
      lastTickTime = now;
      stepGame(now);
    }
  }
  renderBoard(now);
  requestAnimationFrame(gameLoop);
}

// Eventos de teclado
window.addEventListener("keydown", (event) => {
  const isTypingName = document.activeElement === playerNameInput;
  const key = event.key;

  if (key === "Enter") {
    if (gameState === "TITLE_MENU" || gameState === "GAME_OVER") {
      event.preventDefault();
      startGame();
      return;
    }
  }

  if (key === " ") {
    if (isTypingName) return; // Permite digitar espaços no nome do jogador
    if (gameState === "TITLE_MENU" || gameState === "GAME_OVER") {
      event.preventDefault();
      startGame();
      return;
    }
    if (gameState === "PAUSED") {
      event.preventDefault();
      togglePause();
      return;
    }
  }

  if (key === "p" || key === "P") {
    if (isTypingName) return;
    if (gameState === "PLAYING" || gameState === "PAUSED") {
      event.preventDefault();
      togglePause();
      return;
    }
  }

  if (gameState !== "PLAYING") return;

  switch (key) {
    case "ArrowUp":
    case "w":
    case "W":
      event.preventDefault();
      enqueueDirection("UP");
      break;
    case "ArrowDown":
    case "s":
    case "S":
      event.preventDefault();
      enqueueDirection("DOWN");
      break;
    case "ArrowLeft":
    case "a":
    case "A":
      event.preventDefault();
      enqueueDirection("LEFT");
      break;
    case "ArrowRight":
    case "d":
    case "D":
      event.preventDefault();
      enqueueDirection("RIGHT");
      break;
    default:
      break;
  }
});

// Controles por botões na tela
dpadButtons.forEach((button) => {
  const handlePress = (event) => {
    event.preventDefault();
    const dir = button.getAttribute("data-dir");
    if (dir) enqueueDirection(dir);
  };
  button.addEventListener("pointerdown", handlePress);
});

// Controles por gesto de deslize (swipe) no tabuleiro
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener(
  "touchstart",
  (event) => {
    if (event.touches.length === 0) return;
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  },
  { passive: true }
);

canvas.addEventListener(
  "touchmove",
  (event) => {
    if (gameState === "PLAYING") {
      event.preventDefault();
    }
  },
  { passive: false }
);

canvas.addEventListener(
  "touchend",
  (event) => {
    if (gameState !== "PLAYING" || event.changedTouches.length === 0) return;
    const dx = event.changedTouches[0].clientX - touchStartX;
    const dy = event.changedTouches[0].clientY - touchStartY;
    const minSwipe = 24;

    if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      enqueueDirection(dx > 0 ? "RIGHT" : "LEFT");
    } else {
      enqueueDirection(dy > 0 ? "DOWN" : "UP");
    }
  },
  { passive: true }
);

// Botões da interface
startForm.addEventListener("submit", (event) => {
  event.preventDefault();
  startGame();
});

btnPause.addEventListener("click", togglePause);
btnResume.addEventListener("click", togglePause);
btnRestartPause.addEventListener("click", startGame);
btnPlayAgain.addEventListener("click", startGame);
btnChangePlayer.addEventListener("click", returnToStartMenu);

function syncSoundButton() {
  btnSound.textContent = soundEnabled ? "Som: Ligado" : "Som: Mudo";
  btnSound.setAttribute("aria-pressed", String(soundEnabled));
}

btnSound.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  saveSoundPreference(soundEnabled);
  syncSoundButton();
  if (soundEnabled) playSfx("eat");
});

// Limpeza de ranking com confirmação inline
btnClearRanking.addEventListener("click", () => {
  btnClearRanking.hidden = true;
  clearConfirmBox.hidden = false;
});

btnCancelClear.addEventListener("click", () => {
  clearConfirmBox.hidden = true;
  btnClearRanking.hidden = false;
});

btnConfirmClear.addEventListener("click", () => {
  saveRanking([]);
  lastRecordId = null;
  clearConfirmBox.hidden = true;
  btnClearRanking.hidden = false;
  renderRanking();
});

// Inicialização
syncSoundButton();
resetGameVariables();
renderRanking();
requestAnimationFrame(gameLoop);
