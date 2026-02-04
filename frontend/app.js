/**
 * WordWise - Frontend (Profissional)
 * - Rodada de 5 palavras (uma por vez)
 * - Busca pool grande no backend por nível: /ask?level=...&count=...
 * - Sorteia 5 únicas por rodada e evita repetição local
 * - Validação chama o backend /validate (mensagens PT)
 * - Auto valida quando parar de digitar (idle)
<<<<<<< HEAD
 * - NÃO preenche frase automaticamente: mostra placeholder motivacional
=======
>>>>>>> 2fe4d58c0cf8e34a0ac1b88d7383084f22b7e8a3
 */

const DEFAULT_API_URL = "https://fiap-bff-v2.onrender.com/ask"; // só usado se não existir config salva

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
<<<<<<< HEAD
      bffApiUrl: obj?.bffApiUrl && String(obj.bffApiUrl).startsWith("http") ? String(obj.bffApiUrl) : DEFAULT_API_URL,
=======
      bffApiUrl: obj?.bffApiUrl && String(obj.bffApiUrl).startsWith("http") ? String(obj.bffApiUrl) : DEFAULT_API_URL
>>>>>>> 2fe4d58c0cf8e34a0ac1b88d7383084f22b7e8a3
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

endpointLink.href = API_URL;
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
  // backend pode devolver array puro ou {items: [...]}
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
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

<<<<<<< HEAD
function getMotivationalPlaceholder(word) {
  const w = word;
  const prompts = [
    `Desafio: escreva uma frase curta usando "${w}" (bem natural).`,
    `Use "${w}" em uma frase simples: sujeito + verbo + complemento.`,
    `Crie uma frase sobre você usando "${w}" (ex.: I ... "${w}" ...).`,
    `Tente uma frase no passado usando "${w}" (se fizer sentido).`,
    `Tente uma frase no futuro usando "${w}" (ex.: I will ...).`,
    `Faça uma frase que você realmente diria no dia a dia com "${w}".`,
    `Capriche: escreva uma frase com "${w}" e um detalhe (tempo/lugar/razão).`,
  ];
  return prompts[Math.floor(Math.random() * prompts.length)];
}

// -------- Game rules --------
const ROUND_WORDS = 5;

// 🔥 Pool grande por nível (resolve repetição)
=======
// -------- Game rules --------
const ROUND_WORDS = 5;

// 🔥 aqui está a mudança que resolve repetição no jogo
>>>>>>> 2fe4d58c0cf8e34a0ac1b88d7383084f22b7e8a3
const POOL_BY_LEVEL = { easy: 40, medium: 50, hard: 60, veryhard: 70 };

let queue = [];
let shown = [];
let seenWords = new Set();
let currentItem = null;

// para relatório final
let roundStats = { difficulty: "medium", items: [] };

function updateCounter() {
  gameCounter.textContent = `${shown.length} / ${ROUND_WORDS}`;
}

function enableGameButtons(isReady) {
  btnNextWord.disabled = !isReady;
  btnNextWord.classList.toggle("opacity-50", !isReady);
  btnNextWord.classList.toggle("cursor-not-allowed", !isReady);
}

function renderHistory() {
  wordList.innerHTML = "";
  if (!shown.length) {
    wordList.innerHTML = `
      <li class="rounded-2xl bg-slate-900/40 p-4 text-sm text-slate-300 ring-1 ring-white/10">
        Ainda nada por aqui.
      </li>`;
    return;
  }

  shown.slice().reverse().forEach((item) => {
    const li = document.createElement("li");
    li.className = "mb-2 rounded-2xl bg-white/5 px-4 py-3 text-sm ring-1 ring-white/10 hover:bg-white/10 cursor-pointer";
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

function renderDetails(item) {
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
<<<<<<< HEAD
          <p class="text-xs font-semibold text-slate-300">Exemplo (EN) — só pra referência</p>
=======
          <p class="text-xs font-semibold text-slate-300">Exemplo (EN)</p>
>>>>>>> 2fe4d58c0cf8e34a0ac1b88d7383084f22b7e8a3
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
  currentWordEl.textContent = item?.word || "—";
  currentTypeEl.textContent = item?.type || "—";
  currentHintEl.textContent = item ? "Agora escreva uma frase usando essa palavra 👇" : "—";
  renderDetails(item);
}

// -------- Fetch pool + pick 5 uniques --------
async function fetchPool(level) {
  const count = POOL_BY_LEVEL[level] || 50;

  // ✅ usa a URL que o usuário já configurou
  // ✅ usa o backend melhorado: /ask?level=...&count=...
  const url = `${API_URL}?level=${encodeURIComponent(level)}&count=${count}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro HTTP ${res.status} ao buscar palavras.`);
  const data = await res.json();
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
  validationResult.innerHTML = "";
  btnNewRound.classList.add("hidden");
}

async function startRound() {
  const level = difficultySelect.value;

  // reset estado da rodada
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

  currentWordEl.textContent = "—";
  currentTypeEl.textContent = "—";
  currentHintEl.textContent = `Carregando rodada (${difficultyLabel(level)})…`;

  try {
    setStatus("Buscando palavras…", "info");
    const pool = await fetchPool(level);

    // monta fila com 5 únicas
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
    console.error(e);
    setStatus("Erro ao iniciar rodada. Verifique endpoint/Render.", "error");
    currentHintEl.textContent = "Falha ao carregar. Confira o endpoint em ⚙️.";
  }
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

  shown.push(item);
  updateCounter();
  renderHistory();
  showCurrent(item);

<<<<<<< HEAD
  // ✅ AJUSTE PEDIDO:
  // Não preencher a frase automaticamente (nem com exemplo pronto).
  // Deixa o campo vazio e coloca um placeholder motivacional.
  sentenceInput.value = "";
  sentenceInput.placeholder = getMotivationalPlaceholder(item.word);

=======
  // sugestão inicial de frase (melhor usar o exemplo do backend se tiver)
  sentenceInput.value = item.useCaseEn ? item.useCaseEn : `I want to ${item.word} my goals.`;
>>>>>>> 2fe4d58c0cf8e34a0ac1b88d7383084f22b7e8a3
  validationResult.innerHTML = "";
  clearStatus();
}

function resetAll() {
  queue = [];
  shown = [];
  seenWords = new Set();
  currentItem = null;
  roundStats = { difficulty: difficultySelect.value, items: [] };

  enableGameButtons(false);
  updateCounter();
  renderHistory();
  renderDetails(null);

  currentWordEl.textContent = "—";
  currentTypeEl.textContent = "—";
  currentHintEl.textContent = "Clique em Começar para iniciar uma rodada de 5 palavras.";

  validationResult.innerHTML = "";
  sentenceInput.value = "";
  sentenceInput.placeholder = "Escreva uma frase em inglês usando a palavra atual…";
  autoValidateToggle.checked = false;
  btnNewRound.classList.add("hidden");
  clearStatus();
}

// -------- Validation (via backend /validate) --------
let validateDebounce = null;
let validateAbort = null;

const AUTO_IDLE_MS = 1300;
const MIN_CHARS_TO_VALIDATE = 10;

function renderCelebrate() {
  validationResult.innerHTML = `
    <div class="rounded-2xl bg-emerald-500/10 p-4 text-sm text-emerald-200 ring-1 ring-emerald-400/30">
      🎉 Perfeito! Frase correta ✅
    </div>
  `;
}

function renderTryAgainPt(matches) {
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
  const cleaned = (text || "").trim();
  if (!cleaned) return;
  if (!currentItem?.word) return;

  if (validateAbort) validateAbort.abort();
  validateAbort = new AbortController();

  const validateUrl = getValidateUrlFromAsk(API_URL);

  setStatus("Validando…", "info");

  try {
    const res = await fetch(validateUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: cleaned }),
      signal: validateAbort.signal,
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const ok = !!data.ok;
    const matches = Array.isArray(data.matches) ? data.matches : [];

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
    console.error(err);
    setStatus("Erro ao validar. Verifique o backend /validate.", "error");
  }
}

function scheduleAutoValidate() {
  if (!autoValidateToggle.checked) return;

  clearTimeout(validateDebounce);
  validateDebounce = setTimeout(() => {
    const value = (sentenceInput.value || "").trim();
    if (value.length >= MIN_CHARS_TO_VALIDATE) validateSentence(value);
  }, AUTO_IDLE_MS);
}

// -------- End of round report (PT) --------
function endRoundReport() {
  enableGameButtons(false);
  btnNewRound.classList.remove("hidden");

  const total = roundStats.items.length;
  const okCount = roundStats.items.filter((x) => x.ok).length;

  // conta categorias
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
         <p class="mt-1 text-sm text-slate-300">${topCats.map(([c,n]) => `${escapeHtml(c)} (${n})`).join(" • ")}</p>
       </div>`
    : "";

  const tipsHtml = tips.length
    ? `<div class="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
         <p class="text-sm font-semibold">Sugestões do que melhorar (PT)</p>
         <ul class="mt-2 grid gap-2">
           ${tips.slice(0, 6).map(t => `<li class="rounded-2xl bg-slate-950/50 p-3 text-sm ring-1 ring-white/10">${escapeHtml(t)}</li>`).join("")}
         </ul>
       </div>`
    : "";

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

  currentHintEl.textContent = "Rodada finalizada. Veja o relatório e inicie uma nova rodada.";
}

// -------- Settings modal --------
function openSettings() {
  apiUrlInput.value = API_URL;
  endpointLink.href = API_URL;
  if (configJson) configJson.value = JSON.stringify(CONFIG, null, 2);

  settingsModal.classList.remove("hidden");
  settingsModal.classList.add("flex");
}
function closeSettings() {
  settingsModal.classList.add("hidden");
  settingsModal.classList.remove("flex");
}

btnSettings.addEventListener("click", openSettings);
btnCloseSettings.addEventListener("click", closeSettings);
settingsModal.addEventListener("click", (e) => {
  if (e.target === settingsModal) closeSettings();
});

btnResetApi.addEventListener("click", () => {
  CONFIG = { bffApiUrl: DEFAULT_API_URL };
  API_URL = CONFIG.bffApiUrl;

  apiUrlInput.value = API_URL;
  endpointLink.href = API_URL;
  if (configJson) configJson.value = JSON.stringify(CONFIG, null, 2);

  resetAll();
});

btnSaveApi.addEventListener("click", () => {
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
      endpointLink.href = API_URL;

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

  const val = apiUrlInput.value.trim();
  if (!val.startsWith("http")) {
    setStatus("URL inválida. Use http:// ou https://", "error");
    return;
  }

  CONFIG = { bffApiUrl: val };
  saveConfig(CONFIG);

  API_URL = val;
  endpointLink.href = API_URL;

  closeSettings();
  setStatus("Endpoint atualizado ✅", "success");
  setTimeout(clearStatus, 900);

  resetAll();
});

// -------- Buttons & Events --------
btnStartGame.addEventListener("click", startRound);
btnNextWord.addEventListener("click", nextWord);
btnClear.addEventListener("click", resetAll);
btnNewRound.addEventListener("click", startRound);

btnValidate.addEventListener("click", () => validateSentence(sentenceInput.value));

btnClearSentence.addEventListener("click", () => {
  sentenceInput.value = "";
  validationResult.innerHTML = "";
  clearStatus();
});

btnCopySentence.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(sentenceInput.value || "");
    setStatus("Copiado ✅", "success");
    setTimeout(clearStatus, 800);
  } catch {
    setStatus("Não consegui copiar (bloqueio do navegador).", "error");
  }
});

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

sentenceInput.addEventListener("input", () => {
  if (autoValidateToggle.checked) scheduleAutoValidate();
});

sentenceInput.addEventListener("blur", () => {
  if (autoValidateToggle.checked) {
    const v = (sentenceInput.value || "").trim();
    if (v.length >= MIN_CHARS_TO_VALIDATE) validateSentence(v);
  }
});

// Init
resetAll();
