/**
 * WordWise - Frontend (Profissional)
 * - Rodada de 5 palavras (uma por vez)
 * - Busca pool grande no backend por nível: /ask?level=...&count=...
 * - Sorteia 5 únicas por rodada e evita repetição local
 * - Validação chama o backend /validate (mensagens PT)
 * - Auto valida quando parar de digitar (idle)
 * - Campo da frase SEMPRE vazio (sem autopreenchimento)
 *
 * Ajustes desta etapa:
 * ✅ Tratamento elegante de erros (lê { error, details } do backend)
 * ✅ UX: loading, botões desabilitados, feedback visual consistente
 */

const DEFAULT_API_URL = "https://fiap-bff-v2.onrender.com/ask"; // usado só se não houver config salva

// -------- Elements --------
const btnStartGame = document.getElementById("btnStartGame");
const btnNextWord = document.getElementById("btnNextWord");
const btnClear = document.getElementById("btnClear");
const btnNewRound = document.getElementById("btnNewRound");

const difficultySelect = document.getElementById("difficultySelect");

const gameCounter = document.getElementById("gameCounter");
const statusBadge = document.getElementById("statusBadge");

const currentWordEl = document.getElementById("currentWord");
const currentTypeEl = document.getElementById("currentType");
const currentHintEl = document.getElementById("currentHint");

const wordList = document.getElementById("wordList");
const details = document.getElementById("details");

const sentenceInput = document.getElementById("sentenceInput");
const btnValidate = document.getElementById("btnValidate");
const validationResult = document.getElementById("validationResult");
const btnClearSentence = document.getElementById("btnClearSentence");
const btnCopySentence = document.getElementById("btnCopySentence");
const autoValidateToggle = document.getElementById("autoValidateToggle");

const endpointLink = document.getElementById("endpointLink");

// Settings modal
const settingsModal = document.getElementById("settingsModal");
const btnSettings = document.getElementById("btnSettings");
const btnCloseSettings = document.getElementById("btnCloseSettings");
const apiUrlInput = document.getElementById("apiUrlInput");
const btnSaveApi = document.getElementById("btnSaveApi");
const btnResetApi = document.getElementById("btnResetApi");
const configJson = document.getElementById("configJson");

// -------- Config storage --------
function loadConfig() {
  const saved = localStorage.getItem("WORDWISE_CONFIG");
  if (!saved) return { bffApiUrl: DEFAULT_API_URL };
  try {
    const obj = JSON.parse(saved);
    return {
      bffApiUrl: obj?.bffApiUrl || DEFAULT_API_URL,
    };
  } catch (_) {
    return { bffApiUrl: DEFAULT_API_URL };
  }
}
function saveConfig(next) {
  localStorage.setItem("WORDWISE_CONFIG", JSON.stringify(next, null, 2));
}

let CONFIG = loadConfig();
let API_URL = CONFIG.bffApiUrl;

if (endpointLink) endpointLink.href = API_URL;
if (configJson) configJson.value = JSON.stringify(CONFIG, null, 2);

// -------- Helpers --------

// UI busy state (desabilita botões e evita cliques duplicados)
let UI_BUSY = false;
const _btnText = new Map();

function setButtonBusy(btn, busy, busyText = "Processando…") {
  if (!btn) return;
  if (busy) {
    if (!_btnText.has(btn)) _btnText.set(btn, btn.textContent);
    btn.disabled = true;
    btn.classList.add("opacity-60", "cursor-not-allowed");
    btn.textContent = busyText;
  } else {
    btn.disabled = false;
    btn.classList.remove("opacity-60", "cursor-not-allowed");
    if (_btnText.has(btn)) btn.textContent = _btnText.get(btn);
  }
}

function setBusy(busy, context = "") {
  UI_BUSY = busy;

  // Botões principais
  setButtonBusy(btnStartGame, busy, context || "Carregando…");
  setButtonBusy(btnNewRound, busy, context || "Carregando…");

  // Esses dependem do estado do jogo; aqui só força busy quando true
  if (busy) {
    setButtonBusy(btnNextWord, true, "Carregando…");
    setButtonBusy(btnValidate, true, "Validando…");
    if (btnClear) setButtonBusy(btnClear, true, "…");
  } else {
    // restaura manualmente (o fluxo do jogo pode desabilitar de novo depois)
    if (btnNextWord) {
      btnNextWord.disabled = false;
      btnNextWord.classList.remove("opacity-60", "cursor-not-allowed");
      if (_btnText.has(btnNextWord)) btnNextWord.textContent = _btnText.get(btnNextWord);
    }
    if (btnValidate) {
      btnValidate.disabled = false;
      btnValidate.classList.remove("opacity-60", "cursor-not-allowed");
      if (_btnText.has(btnValidate)) btnValidate.textContent = _btnText.get(btnValidate);
    }
    if (btnClear) {
      btnClear.disabled = false;
      btnClear.classList.remove("opacity-60", "cursor-not-allowed");
      if (_btnText.has(btnClear)) btnClear.textContent = _btnText.get(btnClear);
    }
  }
}

class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch (_) {
    return null;
  }
}

function normalizeApiError(data, fallbackMessage) {
  // backend envia { error, details }
  if (data && typeof data === "object") {
    const msg = data.error || fallbackMessage;
    const details = data.details;
    return { msg, details };
  }
  return { msg: fallbackMessage, details: undefined };
}

async function apiFetch(url, options = {}) {
  // timeout simples
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs || 15000;
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...options, signal: options.signal || controller.signal });
    const data = await safeJson(res);

    if (!res.ok) {
      const { msg, details } = normalizeApiError(data, `Erro HTTP ${res.status}`);
      throw new ApiError(msg || "Erro na requisição", res.status, details);
    }
    return data;
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new ApiError("Tempo esgotado. Verifique sua internet e tente novamente.", 408);
    }
    if (err instanceof ApiError) throw err;
    throw new ApiError("Falha de rede. Verifique sua conexão e tente novamente.", 0);
  } finally {
    clearTimeout(t);
  }
}

function setStatus(text, type = "info") {
  if (!statusBadge) return;
  statusBadge.textContent = text;
  statusBadge.classList.remove("hidden");

  statusBadge.classList.remove("bg-rose-500/15", "ring-rose-400/30", "text-rose-200");
  statusBadge.classList.remove("bg-emerald-500/15", "ring-emerald-400/30", "text-emerald-200");
  statusBadge.classList.remove("bg-white/5", "ring-white/10", "text-slate-200");

  if (type === "error") statusBadge.classList.add("bg-rose-500/15", "ring-rose-400/30", "text-rose-200");
  else if (type === "success") statusBadge.classList.add("bg-emerald-500/15", "ring-emerald-400/30", "text-emerald-200");
  else statusBadge.classList.add("bg-white/5", "ring-white/10", "text-slate-200");
}
function clearStatus() {
  if (!statusBadge) return;
  statusBadge.classList.add("hidden");
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function difficultyLabel(level) {
  if (level === "easy") return "Fácil";
  if (level === "hard") return "Difícil";
  return "Médio";
}

function getValidateUrlFromAsk(askUrl) {
  // Se askUrl termina com /ask, troca para /validate. Senão, assume /validate no mesmo host.
  try {
    const u = new URL(askUrl);
    const p = u.pathname || "";
    if (p.endsWith("/ask")) u.pathname = p.replace(/\/ask$/, "/validate");
    else u.pathname = "/validate";
    return u.toString();
  } catch (_) {
    // fallback bem simples
    if (askUrl.endsWith("/ask")) return askUrl.replace(/\/ask$/, "/validate");
    return askUrl.replace(/\/+$/, "") + "/validate";
  }
}

// -------- Game constants --------
const ROUND_WORDS = 5;

// Pool por dificuldade (maior = menos repetição)
const POOL_BY_LEVEL = {
  easy: 60,
  medium: 70,
  hard: 80,
};

// -------- Game state --------
let queue = [];
let shown = [];
let currentItem = null;
let seenWords = new Set();
let roundStats = { difficulty: "medium", items: [] };

// Validação
let validateAbort = null;
let autoValidateTimer = null;

// -------- Rendering --------
function updateCounter() {
  if (!gameCounter) return;
  gameCounter.textContent = `${shown.length}/${ROUND_WORDS}`;
}

function renderHistory() {
  if (!wordList) return;
  wordList.innerHTML = "";
  for (const it of shown) {
    const li = document.createElement("li");
    li.className = "flex items-center justify-between gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-slate-200 ring-1 ring-white/10";
    li.innerHTML = `
      <span class="font-medium">${escapeHtml(it.word || "—")}</span>
      <span class="text-xs text-slate-300/70">${escapeHtml(it.type || "")}</span>
    `;
    wordList.appendChild(li);
  }
}

function renderDetails(item) {
  if (!details) return;

  if (!item) {
    details.innerHTML = `
      <div class="rounded-2xl bg-white/5 p-4 text-sm text-slate-200 ring-1 ring-white/10">
        Selecione uma palavra para ver detalhes.
      </div>
    `;
    return;
  }

  const hint = item.hint ? `<div class="mt-2 text-xs text-slate-200/80">Dica: ${escapeHtml(item.hint)}</div>` : "";

  details.innerHTML = `
    <div class="rounded-2xl bg-white/5 p-4 text-sm text-slate-200 ring-1 ring-white/10">
      <div class="flex items-center justify-between gap-2">
        <div class="text-lg font-semibold">${escapeHtml(item.word || "—")}</div>
        <div class="text-xs text-slate-300/70">${escapeHtml(item.type || "")}</div>
      </div>
      ${hint}
    </div>
  `;
}

function renderCelebrate() {
  if (!validationResult) return;
  validationResult.innerHTML = `
    <div class="rounded-2xl bg-emerald-500/10 p-4 text-sm text-emerald-200 ring-1 ring-emerald-400/30">
      🎉 Mandou bem! Frase correta.
    </div>
  `;
}

function renderTryAgainPt(matches) {
  if (!validationResult) return;

  const summary = matches.slice(0, 3).map((m) => `${m.ptCategory || "Ajustes"}`).join(" • ");

  validationResult.innerHTML = `
    <div class="rounded-2xl bg-rose-500/10 p-4 text-sm text-rose-200 ring-1 ring-rose-400/30">
      😅 Quase! Tenta de novo — encontrei ${matches.length} ajuste(s).
      ${summary ? `<div class="mt-2 text-xs text-rose-100/90">Categorias: ${escapeHtml(summary)}</div>` : ""}
    </div>
  `;
}

function renderValidationError(message, details = []) {
  if (!validationResult) return;

  const list =
    Array.isArray(details) && details.length
      ? `<ul class="mt-2 list-disc pl-5 text-xs text-rose-100/90">${details
          .slice(0, 6)
          .map((d) => `<li>${escapeHtml(String(d))}</li>`)
          .join("")}</ul>`
      : "";

  validationResult.innerHTML = `
    <div class="rounded-2xl bg-rose-500/10 p-4 text-sm text-rose-200 ring-1 ring-rose-400/30">
      ⚠️ ${escapeHtml(String(message || "Ocorreu um erro."))}
      ${list}
      <div class="mt-3 text-xs text-rose-100/80">
        Dica: confira o endpoint em <b>⚙️</b> e se o backend está rodando.
      </div>
    </div>
  `;
}

// -------- Backend response normalize --------
function normalizeAskResponse(data) {
  // backend pode vir:
  // - { words: [...] }
  // - { data: [...] }
  // - [ ... ]
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.words)) return data.words;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

// -------- Random helpers --------
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function fetchPool(level) {
  const count = POOL_BY_LEVEL[level] || 50;
  const url = `${API_URL}?level=${encodeURIComponent(level)}&count=${count}`;

  setStatus("Buscando palavras…", "info");
  const data = await apiFetch(url, { timeoutMs: 20000 });
  return normalizeAskResponse(data);
}

function pickUniqueRandom(items, n, seenSet) {
  const arr = items.slice();
  shuffle(arr);

  const out = [];
  for (const it of arr) {
    const key = String(it.word || "").toLowerCase();
    if (!key) continue;
    if (seenSet.has(key)) continue;
    seenSet.add(key);
    out.push(it);
    if (out.length >= n) break;
  }
  return out;
}

// -------- Round flow --------
function resetRoundUI() {
  if (validationResult) validationResult.innerHTML = "";
  if (btnNewRound) btnNewRound.classList.add("hidden");
}

function enableGameButtons(isReady) {
  if (btnNextWord) btnNextWord.disabled = !isReady;
  if (btnValidate) btnValidate.disabled = !isReady;
  if (btnClearSentence) btnClearSentence.disabled = !isReady;
  if (btnCopySentence) btnCopySentence.disabled = !isReady;
}

function recordRoundStat(item) {
  roundStats.items.push({
    ...item,
    at: new Date().toISOString(),
  });
}

async function startRound() {
  const level = difficultySelect ? difficultySelect.value : "medium";

  queue = [];
  shown = [];
  seenWords = new Set();
  currentItem = null;
  roundStats = { difficulty: level, items: [] };

  resetRoundUI();
  enableGameButtons(false);
  updateCounter();
  renderHistory();
  renderDetails(null);

  if (currentWordEl) currentWordEl.textContent = "—";
  if (currentTypeEl) currentTypeEl.textContent = "—";
  if (currentHintEl) currentHintEl.textContent = `Carregando rodada (${difficultyLabel(level)})…`;

  try {
    setBusy(true, "Carregando…");
    setStatus("Buscando palavras…", "info");
    const pool = await fetchPool(level);
    setBusy(false);

    queue = pickUniqueRandom(pool, ROUND_WORDS, seenWords);
    if (queue.length < ROUND_WORDS) {
      setStatus("Poucas palavras únicas retornaram. Tente novamente.", "error");
      enableGameButtons(false);
      return;
    }

    setStatus("Rodada pronta ✅", "success");
    setTimeout(clearStatus, 900);

    enableGameButtons(true);
    nextWord();
  } catch (e) {
    setBusy(false);

    if (e?.name === "ApiError") {
      const msg = e.message || "Erro ao iniciar rodada.";
      setStatus(msg, "error");
      if (validationResult) {
        const details = Array.isArray(e.details) ? e.details : [];
        renderValidationError(msg, details);
      }
      if (currentHintEl) currentHintEl.textContent = "Falha ao carregar. Confira o endpoint em ⚙️.";
      enableGameButtons(false);
      return;
    }

    console.error(e);
    setStatus("Erro ao iniciar rodada. Verifique endpoint/Render.", "error");
    if (currentHintEl) currentHintEl.textContent = "Falha ao carregar. Confira o endpoint em ⚙️.";
    enableGameButtons(false);
  }
}

function endRoundReport() {
  setStatus("Rodada finalizada ✅", "success");
  if (btnNewRound) btnNewRound.classList.remove("hidden");
  if (currentWordEl) currentWordEl.textContent = "Fim";
  if (currentTypeEl) currentTypeEl.textContent = "—";
  if (currentHintEl) currentHintEl.textContent = "Clique em “Nova Rodada” para jogar de novo.";
  enableGameButtons(false);
}

function nextWord() {
  if (shown.length >= ROUND_WORDS) {
    endRoundReport();
    return;
  }

  const item = queue.shift();
  if (!item) {
    endRoundReport();
    return;
  }

  currentItem = item;
  shown.push(item);

  updateCounter();
  renderHistory();
  renderDetails(item);

  if (currentWordEl) currentWordEl.textContent = item.word || "—";
  if (currentTypeEl) currentTypeEl.textContent = item.type || "—";
  if (currentHintEl) currentHintEl.textContent = item.hint || "Use a palavra em uma frase.";

  // Campo SEMPRE vazio
  if (sentenceInput) sentenceInput.value = "";
  if (validationResult) validationResult.innerHTML = "";

  enableGameButtons(true);
}

function cleanupText(text) {
  return String(text || "").trim();
}

function mapMatchCategoryToPt(m) {
  const cat = (m?.rule?.issueType || m?.rule?.category?.id || "").toLowerCase();
  if (cat.includes("missp")) return "Ortografia";
  if (cat.includes("typ")) return "Tipografia";
  if (cat.includes("grammar")) return "Gramática";
  if (cat.includes("style")) return "Estilo";
  return "Ajustes";
}

function normalizeMatches(matches) {
  return (matches || []).map((m) => ({
    ...m,
    ptCategory: mapMatchCategoryToPt(m),
  }));
}

async function validateSentence(text, { record = true } = {}) {
  const cleaned = cleanupText(text);
  if (!cleaned) return;
  if (!currentItem?.word) return;

  if (validateAbort) validateAbort.abort();
  validateAbort = new AbortController();

  const validateUrl = getValidateUrlFromAsk(API_URL);

  setBusy(true, "Validando…");
  setStatus("Validando…", "info");

  try {
    const data = await apiFetch(validateUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: cleaned }),
      signal: validateAbort.signal,
      timeoutMs: 20000,
    });

    const ok = !!data.ok;
    const matches = normalizeMatches(Array.isArray(data.matches) ? data.matches : []);

    if (ok) {
      setBusy(false);
      setStatus("Correto ✅", "success");
      setTimeout(clearStatus, 800);
      renderCelebrate();
      if (record) recordRoundStat({ word: currentItem.word, sentence: cleaned, ok: true, matches: [] });
      return;
    }

    setStatus("Tem ajustes…", "error");
    setTimeout(clearStatus, 900);
    renderTryAgainPt(matches);
    setBusy(false);
    if (record) recordRoundStat({ word: currentItem.word, sentence: cleaned, ok: false, matches });
  } catch (err) {
    if (err?.name === "AbortError") return;
    setBusy(false);

    // Erros elegantes (backend padroniza { error, details })
    if (err?.name === "ApiError") {
      const msg = err.message || "Erro ao validar.";
      const details = Array.isArray(err.details) ? err.details : [];
      setStatus(msg, "error");
      renderValidationError(msg, details);
      return;
    }

    console.error(err);
    setStatus("Erro ao validar. Verifique sua conexão ou o backend /validate.", "error");
    renderValidationError("Erro ao validar.", []);
  }
}

function scheduleAutoValidate() {
  if (!autoValidateToggle || !autoValidateToggle.checked) return;
  clearTimeout(autoValidateTimer);

  autoValidateTimer = setTimeout(() => {
    if (!sentenceInput) return;
    validateSentence(sentenceInput.value, { record: false });
  }, 650);
}

// -------- Events --------
if (btnStartGame) btnStartGame.addEventListener("click", () => startRound());
if (btnNewRound) btnNewRound.addEventListener("click", () => startRound());
if (btnNextWord) btnNextWord.addEventListener("click", () => nextWord());

if (btnClearSentence)
  btnClearSentence.addEventListener("click", () => {
    if (sentenceInput) sentenceInput.value = "";
    if (validationResult) validationResult.innerHTML = "";
    clearStatus();
  });

if (btnCopySentence)
  btnCopySentence.addEventListener("click", async () => {
    const text = sentenceInput ? sentenceInput.value : "";
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Copiado ✅", "success");
      setTimeout(clearStatus, 700);
    } catch (_) {
      setStatus("Não foi possível copiar.", "error");
    }
  });

if (btnValidate)
  btnValidate.addEventListener("click", () => {
    if (!sentenceInput) return;
    validateSentence(sentenceInput.value, { record: true });
  });

if (sentenceInput)
  sentenceInput.addEventListener("input", () => {
    if (validationResult) validationResult.innerHTML = "";
    scheduleAutoValidate();
  });

// -------- Settings modal --------
function openSettings() {
  if (!settingsModal) return;
  settingsModal.classList.remove("hidden");
  if (apiUrlInput) apiUrlInput.value = API_URL;
}
function closeSettings() {
  if (!settingsModal) return;
  settingsModal.classList.add("hidden");
}

if (btnSettings) btnSettings.addEventListener("click", openSettings);
if (btnCloseSettings) btnCloseSettings.addEventListener("click", closeSettings);

if (btnSaveApi)
  btnSaveApi.addEventListener("click", () => {
    const nextUrl = apiUrlInput ? apiUrlInput.value.trim() : "";
    if (!nextUrl) return;

    API_URL = nextUrl;
    CONFIG = { ...CONFIG, bffApiUrl: API_URL };
    saveConfig(CONFIG);

    if (endpointLink) endpointLink.href = API_URL;
    if (configJson) configJson.value = JSON.stringify(CONFIG, null, 2);

    setStatus("Endpoint salvo ✅", "success");
    setTimeout(clearStatus, 800);
    closeSettings();
  });

if (btnResetApi)
  btnResetApi.addEventListener("click", () => {
    API_URL = DEFAULT_API_URL;
    CONFIG = { ...CONFIG, bffApiUrl: API_URL };
    saveConfig(CONFIG);

    if (apiUrlInput) apiUrlInput.value = API_URL;
    if (endpointLink) endpointLink.href = API_URL;
    if (configJson) configJson.value = JSON.stringify(CONFIG, null, 2);

    setStatus("Endpoint resetado ✅", "success");
    setTimeout(clearStatus, 900);
  });

// -------- Init --------
resetRoundUI();
enableGameButtons(false);
updateCounter();
renderHistory();
renderDetails(null);
if (currentHintEl) currentHintEl.textContent = "Selecione a dificuldade e clique em “Iniciar”.";
