

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
      bffApiUrl:
        obj?.bffApiUrl && String(obj.bffApiUrl).startsWith("http")
          ? String(obj.bffApiUrl)
          : DEFAULT_API_URL,
    };
  } catch {
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
function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setStatus(text, type = "info") {
  if (!statusBadge) return;
  statusBadge.textContent = text;
  statusBadge.classList.remove("hidden");

  statusBadge.classList.remove("bg-rose-500/15", "ring-rose-400/30", "text-rose-200");
  statusBadge.classList.remove("bg-emerald-500/15", "ring-emerald-400/30", "text-emerald-200");
  statusBadge.classList.remove("bg-white/5", "ring-white/10", "text-slate-200");

  if (type === "error") statusBadge.classList.add("bg-rose-500/15", "ring-rose-400/30", "text-rose-200");
  else if (type === "success")
    statusBadge.classList.add("bg-emerald-500/15", "ring-emerald-400/30", "text-emerald-200");
  else statusBadge.classList.add("bg-white/5", "ring-white/10", "text-slate-200");
}

function clearStatus() {
  if (!statusBadge) return;
  statusBadge.classList.add("hidden");
  statusBadge.textContent = "";
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function normalizeAskResponse(data) {
  
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.data)) return data.data; // compat extra
  return [];
}

function getValidateUrlFromAsk(apiUrl) {
  return String(apiUrl).replace(/\/ask\/?$/i, "/validate");
}

function difficultyLabel(v) {
  if (v === "easy") return "Fácil";
  if (v === "medium") return "Médio";
  if (v === "hard") return "Difícil";
  return "Muito difícil";
}

function getMotivationalPlaceholder(word) {
  const w = word;
  const prompts = [
    `Escreva uma frase curta usando "${w}" (bem natural).`,
    `Use "${w}" em uma frase simples: sujeito + verbo + complemento.`,
    `Crie uma frase sobre você usando "${w}" (ex.: I ... "${w}" ...).`,
    `Tente uma frase no passado usando "${w}" (se fizer sentido).`,
    `Tente uma frase no futuro usando "${w}" (ex.: I will ...).`,
    `Faça uma frase que você realmente diria no dia a dia com "${w}".`,
    `Capriche: escreva uma frase com "${w}" e um detalhe (tempo/lugar/razão).`,
  ];
  return prompts[Math.floor(Math.random() * prompts.length)];
}

function randomPortugueseUseCase(word) {
  const w = word;
  const templates = [
    `Eu precisei "${w}" meus objetivos com disciplina, mesmo com dificuldades.`,
    `No trabalho, tive que "${w}" uma solução melhor antes do prazo.`,
    `Ela conseguiu "${w}" o que queria com muita determinação.`,
    `Quando você quer algo, você começa a "${w}" isso com foco.`,
    `Eu fui tentar "${w}" uma oportunidade que poderia mudar tudo.`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

// -------- UX: Busy / Loading --------
let UI_BUSY = false;
const _btnText = new Map();

function setButtonBusy(btn, busy, busyText = "Processando…") {
  if (!btn) return;
  if (busy) {
    if (!_btnText.has(btn)) _btnText.set(btn, btn.textContent);
    btn.disabled = true;
    btn.classList.add("opacity-50", "cursor-not-allowed");
    btn.textContent = busyText;
  } else {
    btn.disabled = false;
    btn.classList.remove("opacity-50", "cursor-not-allowed");
    if (_btnText.has(btn)) btn.textContent = _btnText.get(btn);
  }
}

function setBusy(busy, label = "Carregando…") {
  UI_BUSY = busy;
  setButtonBusy(btnStartGame, busy, label);
  setButtonBusy(btnNewRound, busy, label);
  setButtonBusy(btnNextWord, busy, "Carregando…");
  setButtonBusy(btnValidate, busy, "Validando…");
  setButtonBusy(btnClear, busy, "…");
  setButtonBusy(btnCopySentence, busy, "…");
  setButtonBusy(btnClearSentence, busy, "…");
}

// -------- API Fetch  --------
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
  } catch {
    return null;
  }
}

function normalizeApiError(data, fallbackMessage) {
  // backend manda { error, details }
  if (data && typeof data === "object") {
    return {
      msg: data.error || fallbackMessage,
      details: data.details,
    };
  }
  return { msg: fallbackMessage, details: undefined };
}

async function apiFetch(url, options = {}) {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 20000;
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
    if (err?.name === "AbortError") throw new ApiError("Tempo esgotado. Tente novamente.", 408);
    if (err instanceof ApiError) throw err;
    throw new ApiError("Falha de rede. Verifique sua conexão.", 0);
  } finally {
    clearTimeout(t);
  }
}

function renderApiErrorBox(whereEl, title, details) {
  if (!whereEl) return;
  const list =
    Array.isArray(details) && details.length
      ? `<ul class="mt-2 list-disc pl-5 text-xs text-rose-100/90">
          ${details.slice(0, 6).map((d) => `<li>${escapeHtml(String(d))}</li>`).join("")}
        </ul>`
      : "";

  whereEl.innerHTML = `
    <div class="rounded-2xl bg-rose-500/10 p-4 text-sm text-rose-200 ring-1 ring-rose-400/30">
      ⚠️ ${escapeHtml(title || "Ocorreu um erro.")}
      ${list}
      <div class="mt-3 text-xs text-rose-100/80">
        Dica: confira o endpoint em <b>⚙️</b> e se o backend está rodando.
      </div>
    </div>
  `;
}

// -------- Game rules --------
const ROUND_WORDS = 5;

// Pool grande por nível (evita repetição)
const POOL_BY_LEVEL = { easy: 40, medium: 50, hard: 60, veryhard: 70 };

let queue = [];
let shown = [];
let seenWords = new Set();
let currentItem = null;

// relatório final
let roundStats = { difficulty: "medium", items: [] };

function updateCounter() {
  if (!gameCounter) return;
  gameCounter.textContent = `${shown.length} / ${ROUND_WORDS}`;
}

function enableGameButtons(isReady) {

  if (btnNextWord) {
    btnNextWord.disabled = !isReady;
    btnNextWord.classList.toggle("opacity-50", !isReady);
    btnNextWord.classList.toggle("cursor-not-allowed", !isReady);
  }
  if (btnValidate) btnValidate.disabled = !isReady;
  if (btnCopySentence) btnCopySentence.disabled = !isReady;
  if (btnClearSentence) btnClearSentence.disabled = !isReady;
}

function renderHistory() {
  if (!wordList) return;
  wordList.innerHTML = "";

  if (!shown.length) {
    wordList.innerHTML = `
      <li class="rounded-2xl bg-slate-900/40 p-4 text-sm text-slate-300 ring-1 ring-white/10">
        Ainda nada por aqui.
      </li>`;
    return;
  }

  shown
    .slice()
    .reverse()
    .forEach((item) => {
      const li = document.createElement("li");
      li.className =
        "mb-2 rounded-2xl bg-white/5 px-4 py-3 text-sm ring-1 ring-white/10 hover:bg-white/10 cursor-pointer";
      li.innerHTML = `
        <div class="flex items-center justify-between gap-2">
          <span class="font-semibold">${escapeHtml(item.word)}</span>
          <span class="text-xs text-slate-400">${escapeHtml(item.type || "")}</span>
        </div>
      `;
      li.addEventListener("click", () => showCurrent(item));
      wordList.appendChild(li);
    });
}

function renderDetails(item) {
  if (!details) return;

  if (!item) {
    details.innerHTML = `
      <div class="rounded-2xl bg-slate-900/40 p-4 ring-1 ring-white/10">
        <p class="text-sm text-slate-300">Nenhuma palavra ainda. Comece o game 🙂</p>
      </div>
    `;
    return;
  }

  const ptUse = randomPortugueseUseCase(item.word);

  details.innerHTML = `
    <div class="rounded-2xl bg-slate-900/40 p-4 ring-1 ring-white/10">
      <div class="flex items-center justify-between gap-2">
        <h3 class="text-lg font-semibold">${escapeHtml(item.word)}</h3>
        <span class="rounded-xl bg-white/5 px-3 py-2 text-xs text-slate-200 ring-1 ring-white/10">
          ${escapeHtml(item.type || "")}
        </span>
      </div>

      <p class="mt-3 text-sm text-slate-200">
        ${escapeHtml(item.description || "Sem descrição no momento.")}
      </p>

      <div class="mt-4">
        <p class="text-xs font-semibold text-slate-300">Caso de uso (PT - aleatório)</p>
        <div class="mt-2 rounded-2xl bg-slate-950/50 p-3 text-sm text-slate-200 ring-1 ring-white/10">
          ${escapeHtml(ptUse)}
        </div>
      </div>

      ${
        item.useCaseEn
          ? `
        <div class="mt-4">
          <p class="text-xs font-semibold text-slate-300">Exemplo (EN) — só referência</p>
          <div class="mt-2 rounded-2xl bg-slate-950/50 p-3 text-sm text-slate-200 ring-1 ring-white/10">
            ${escapeHtml(item.useCaseEn)}
          </div>
        </div>
      `
          : ""
      }
    </div>
  `;
}

function showCurrent(item) {
  currentItem = item;
  if (currentWordEl) currentWordEl.textContent = item?.word || "—";
  if (currentTypeEl) currentTypeEl.textContent = item?.type || "—";
  if (currentHintEl) currentHintEl.textContent = item ? "Agora escreva uma frase usando essa palavra 👇" : "—";
  renderDetails(item);
}

// -------- Fetch pool + pick uniques --------
async function fetchPool(level) {
  const count = POOL_BY_LEVEL[level] || 50;
  const url = `${API_URL}?level=${encodeURIComponent(level)}&count=${count}`;
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

async function startRound() {
  if (UI_BUSY) return;

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
    setBusy(true, "Buscando…");
    setStatus("Buscando palavras…", "info");

    const pool = await fetchPool(level);

    queue = pickUniqueRandom(pool, ROUND_WORDS, seenWords);
    if (queue.length < ROUND_WORDS) {
      setBusy(false);
      setStatus("Poucas palavras únicas retornaram. Tente novamente.", "error");
      enableGameButtons(false);
      return;
    }

    setBusy(false);
    setStatus("Rodada pronta ✅", "success");
    setTimeout(clearStatus, 900);

    enableGameButtons(true);
    nextWord();
  } catch (e) {
    setBusy(false);
    console.error(e);

    const msg = e?.message || "Erro ao iniciar rodada. Verifique endpoint/Render.";
    setStatus(msg, "error");

    if (validationResult && e?.details) {
      renderApiErrorBox(validationResult, msg, Array.isArray(e.details) ? e.details : []);
    }

    if (currentHintEl) currentHintEl.textContent = "Falha ao carregar. Confira o endpoint em ⚙️.";
  }
}

function nextWord() {
  if (UI_BUSY) return;

  if (shown.length >= ROUND_WORDS) {
    endRoundReport();
    return;
  }

  const item = queue.shift();
  if (!item) {
    endRoundReport();
    return;
  }

  shown.push(item);
  updateCounter();
  renderHistory();
  showCurrent(item);

  
  if (sentenceInput) {
    sentenceInput.value = "";
    sentenceInput.placeholder = getMotivationalPlaceholder(item.word);
    sentenceInput.dispatchEvent(new Event("input"));
  }

  if (validationResult) validationResult.innerHTML = "";
  clearStatus();
}

function resetAll() {
  if (UI_BUSY) return;

  queue = [];
  shown = [];
  seenWords = new Set();
  currentItem = null;
  roundStats = { difficulty: difficultySelect ? difficultySelect.value : "medium", items: [] };

  enableGameButtons(false);
  updateCounter();
  renderHistory();
  renderDetails(null);

  if (currentWordEl) currentWordEl.textContent = "—";
  if (currentTypeEl) currentTypeEl.textContent = "—";
  if (currentHintEl) currentHintEl.textContent = "Clique em Começar para iniciar uma rodada de 5 palavras.";

  if (validationResult) validationResult.innerHTML = "";
  if (sentenceInput) {
    sentenceInput.value = "";
    sentenceInput.placeholder = "Escreva uma frase em inglês usando a palavra atual…";
  }
  if (autoValidateToggle) autoValidateToggle.checked = false;
  if (btnNewRound) btnNewRound.classList.add("hidden");
  clearStatus();
}

// -------- Validation --------
let validateDebounce = null;
let validateAbort = null;

const AUTO_IDLE_MS = 1300;
const MIN_CHARS_TO_VALIDATE = 10;

function mapMatchCategoryToPt(m) {
  const cat = (m?.rule?.issueType || m?.rule?.category?.id || "").toLowerCase();
  if (cat.includes("missp")) return "Ortografia";
  if (cat.includes("typ")) return "Tipografia";
  if (cat.includes("punct")) return "Pontuação";
  if (cat.includes("grammar")) return "Gramática";
  if (cat.includes("style")) return "Estilo";
  return "Ajustes gerais";
}

function normalizeMatches(matches) {
  return (matches || []).map((m) => ({
    ...m,
    ptCategory: mapMatchCategoryToPt(m),
    ptMessage: m?.message || m?.shortMessage || "Sugestão",
    replacements: Array.isArray(m?.replacements) ? m.replacements.map((r) => r?.value).filter(Boolean) : [],
  }));
}

function renderCelebrate() {
  if (!validationResult) return;
  validationResult.innerHTML = `
    <div class="rounded-2xl bg-emerald-500/10 p-4 text-sm text-emerald-200 ring-1 ring-emerald-400/30">
      🎉 Perfeito! Frase correta ✅
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

  const cards = matches.slice(0, 8).map((m) => {
    const cat = escapeHtml(m.ptCategory || "Ajustes gerais");
    const msg = escapeHtml(m.ptMessage || "Sugestão");
    const repl = Array.isArray(m.replacements) ? m.replacements.slice(0, 6).map(escapeHtml).join(", ") : "";
    return `
      <div class="rounded-2xl bg-slate-950/50 p-4 ring-1 ring-white/10">
        <p class="text-xs text-slate-400">${cat}</p>
        <p class="mt-1 text-sm font-semibold">${msg}</p>
        ${repl ? `<p class="mt-2 text-xs text-slate-300">Sugestões: ${repl}</p>` : ""}
      </div>
    `;
  });

  validationResult.innerHTML += cards.join("");
}

function recordRoundStat({ word, sentence, ok, matches }) {
  roundStats.items.push({
    word,
    sentence,
    ok,
    matchesCount: (matches || []).length,
    categories: (matches || []).map((m) => m.ptCategory || "Ajustes gerais"),
  });
}

async function validateSentence(text, { record = true } = {}) {
  if (UI_BUSY) return;

  const cleaned = (text || "").trim();
  if (!cleaned) return;
  if (!currentItem?.word) return;

  if (validateAbort) validateAbort.abort();
  validateAbort = new AbortController();

  const validateUrl = getValidateUrlFromAsk(API_URL);

  try {
    setBusy(true, "Validando…");
    setStatus("Validando…", "info");

    const data = await apiFetch(validateUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: cleaned }),
      signal: validateAbort.signal,
      timeoutMs: 20000,
    });

    const ok = !!data.ok;
    const matches = normalizeMatches(Array.isArray(data.matches) ? data.matches : []);

    setBusy(false);

    if (ok) {
      setStatus("Correto ✅", "success");
      setTimeout(clearStatus, 800);
      renderCelebrate();
      if (record) recordRoundStat({ word: currentItem.word, sentence: cleaned, ok: true, matches: [] });
      return;
    }

    setStatus("Tem ajustes…", "error");
    setTimeout(clearStatus, 900);
    renderTryAgainPt(matches);
    if (record) recordRoundStat({ word: currentItem.word, sentence: cleaned, ok: false, matches });
  } catch (err) {
    if (err?.name === "AbortError") return;
    setBusy(false);

    // erro elegante vindo do backend
    const msg = err?.message || "Erro ao validar. Verifique o backend /validate.";
    setStatus(msg, "error");
    if (validationResult) renderApiErrorBox(validationResult, msg, Array.isArray(err?.details) ? err.details : []);
  }
}

function scheduleAutoValidate() {
  if (!autoValidateToggle || !autoValidateToggle.checked) return;

  clearTimeout(validateDebounce);
  validateDebounce = setTimeout(() => {
    const value = (sentenceInput?.value || "").trim();
    if (value.length >= MIN_CHARS_TO_VALIDATE) validateSentence(value, { record: false });
  }, AUTO_IDLE_MS);
}

// -------- End of round report (PT) --------
function endRoundReport() {
  enableGameButtons(false);
  if (btnNewRound) btnNewRound.classList.remove("hidden");

  const total = roundStats.items.length;
  const okCount = roundStats.items.filter((x) => x.ok).length;

  const counter = new Map();
  for (const it of roundStats.items) {
    if (it.ok) continue;
    for (const c of it.categories) counter.set(c, (counter.get(c) || 0) + 1);
  }
  const topCats = [...counter.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);

  const tips = [];
  for (const [cat] of topCats) {
    if (cat.includes("Ortografia")) tips.push("Revise ortografia: confira palavras digitadas errado e tente reescrever com calma.");
    else if (cat.includes("Pontuação")) tips.push("Pontuação: revise ponto final, vírgulas e letra maiúscula no começo da frase.");
    else if (cat.includes("Gramática")) tips.push("Gramática: atenção a artigos (a/an/the) e concordância do verbo.");
    else if (cat.includes("Estilo")) tips.push("Estilo: tente frases mais naturais e diretas, evitando traduções literais.");
    else tips.push("Ajustes gerais: simplifique a frase e compare com as sugestões.");
  }
  if (!tips.length) tips.push("Continue praticando: tente frases completas e claras, e valide novamente.");

  const catsHtml = topCats.length
    ? `<div class="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
         <p class="text-sm font-semibold">O que mais apareceu</p>
         <p class="mt-1 text-sm text-slate-300">${topCats.map(([c, n]) => `${escapeHtml(c)} (${n})`).join(" • ")}</p>
       </div>`
    : "";

  const tipsHtml = tips.length
    ? `<div class="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
         <p class="text-sm font-semibold">Sugestões do que melhorar (PT)</p>
         <ul class="mt-2 grid gap-2">
           ${tips
             .slice(0, 6)
             .map((t) => `<li class="rounded-2xl bg-slate-950/50 p-3 text-sm ring-1 ring-white/10">${escapeHtml(t)}</li>`)
             .join("")}
         </ul>
       </div>`
    : "";

  if (validationResult) {
    validationResult.innerHTML = `
      <div class="rounded-2xl bg-emerald-500/10 p-4 text-sm text-emerald-200 ring-1 ring-emerald-400/30">
        ✅ Rodada concluída! Acertos: ${okCount}/${total}.
      </div>
      ${catsHtml}
      ${tipsHtml}
      <div class="rounded-2xl bg-slate-950/50 p-4 text-sm text-slate-200 ring-1 ring-white/10">
        Troque o nível e clique em <b>Nova rodada</b> para continuar 🚀
      </div>
    `;
  }

  if (currentHintEl) currentHintEl.textContent = "Rodada finalizada. Veja o relatório e inicie uma nova rodada.";
}

// -------- Settings modal --------
function openSettings() {
  if (apiUrlInput) apiUrlInput.value = API_URL;
  if (endpointLink) endpointLink.href = API_URL;
  if (configJson) configJson.value = JSON.stringify(CONFIG, null, 2);

  if (!settingsModal) return;
  settingsModal.classList.remove("hidden");
  settingsModal.classList.add("flex");
}
function closeSettings() {
  if (!settingsModal) return;
  settingsModal.classList.add("hidden");
  settingsModal.classList.remove("flex");
}

if (btnSettings) btnSettings.addEventListener("click", openSettings);
if (btnCloseSettings) btnCloseSettings.addEventListener("click", closeSettings);
if (settingsModal) {
  settingsModal.addEventListener("click", (e) => {
    if (e.target === settingsModal) closeSettings();
  });
}

if (btnResetApi) {
  btnResetApi.addEventListener("click", () => {
    if (UI_BUSY) return;

    CONFIG = { bffApiUrl: DEFAULT_API_URL };
    API_URL = CONFIG.bffApiUrl;

    if (apiUrlInput) apiUrlInput.value = API_URL;
    if (endpointLink) endpointLink.href = API_URL;
    if (configJson) configJson.value = JSON.stringify(CONFIG, null, 2);

    resetAll();
  });
}

if (btnSaveApi) {
  btnSaveApi.addEventListener("click", () => {
    if (UI_BUSY) return;

    const jsonVal = (configJson?.value || "").trim();
    if (jsonVal) {
      try {
        const parsed = JSON.parse(jsonVal);
        const bffApiUrl = String(parsed?.bffApiUrl || "").trim();

        if (!bffApiUrl.startsWith("http")) {
          setStatus("JSON inválido: bffApiUrl precisa começar com http:// ou https://", "error");
          return;
        }

        CONFIG = { bffApiUrl };
        saveConfig(CONFIG);

        API_URL = CONFIG.bffApiUrl;
        if (endpointLink) endpointLink.href = API_URL;

        closeSettings();
        setStatus("Configurações salvas ✅", "success");
        setTimeout(clearStatus, 900);

        resetAll();
        return;
      } catch {
        setStatus("JSON inválido. Verifique aspas, vírgulas e chaves.", "error");
        return;
      }
    }

    const val = (apiUrlInput?.value || "").trim();
    if (!val.startsWith("http")) {
      setStatus("URL inválida. Use http:// ou https://", "error");
      return;
    }

    CONFIG = { bffApiUrl: val };
    saveConfig(CONFIG);

    API_URL = val;
    if (endpointLink) endpointLink.href = API_URL;

    closeSettings();
    setStatus("Endpoint atualizado ✅", "success");
    setTimeout(clearStatus, 900);

    resetAll();
  });
}

// -------- Buttons & Events --------
if (btnStartGame) btnStartGame.addEventListener("click", startRound);
if (btnNextWord) btnNextWord.addEventListener("click", nextWord);
if (btnClear) btnClear.addEventListener("click", resetAll);
if (btnNewRound) btnNewRound.addEventListener("click", startRound);

if (btnValidate) btnValidate.addEventListener("click", () => validateSentence(sentenceInput?.value || "", { record: true }));

if (btnClearSentence) {
  btnClearSentence.addEventListener("click", () => {
    if (UI_BUSY) return;
    if (sentenceInput) sentenceInput.value = "";
    if (validationResult) validationResult.innerHTML = "";
    clearStatus();
  });
}

if (btnCopySentence) {
  btnCopySentence.addEventListener("click", async () => {
    if (UI_BUSY) return;
    try {
      await navigator.clipboard.writeText(sentenceInput?.value || "");
      setStatus("Copiado ✅", "success");
      setTimeout(clearStatus, 800);
    } catch {
      setStatus("Não consegui copiar (bloqueio do navegador).", "error");
    }
  });
}

if (autoValidateToggle) {
  autoValidateToggle.addEventListener("change", () => {
    if (autoValidateToggle.checked) {
      setStatus("Automático ligado ✅ (valida quando você para de digitar)", "success");
      setTimeout(clearStatus, 900);
      scheduleAutoValidate();
    } else {
      setStatus("Automático desligado.", "info");
      setTimeout(clearStatus, 700);
    }
  });
}

if (sentenceInput) {
  sentenceInput.addEventListener("input", () => {
    if (validationResult) validationResult.innerHTML = "";
    if (autoValidateToggle?.checked) scheduleAutoValidate();
  });

  sentenceInput.addEventListener("blur", () => {
    if (autoValidateToggle?.checked) {
      const v = (sentenceInput.value || "").trim();
      if (v.length >= MIN_CHARS_TO_VALIDATE) validateSentence(v, { record: false });
    }
  });
}

// Init
resetAll();
