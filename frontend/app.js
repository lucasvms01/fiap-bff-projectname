/**
 * WordWise - Game Profissional
 * - Rodada fixa de 5 palavras
 * - Níveis: easy/medium/hard/veryhard (filtra pelo "peso" da palavra)
 * - Auto validate: valida apenas quando usuário PARA de digitar (idle)
 * - Relatório final (PT): sugestões do que melhorar nas frases
 */

const DEFAULT_API_URL = "https://fiap-bff-v2.onrender.com/ask";
let LANGUAGETOOL_URL = "https://api.languagetool.org/v2/check";

// ---------- Elements ----------
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

// ---------- Config storage ----------
function loadConfig() {
  const saved = localStorage.getItem("WORDWISE_CONFIG");
  if (!saved) return { bffApiUrl: DEFAULT_API_URL, languageToolUrl: LANGUAGETOOL_URL };
  try {
    const obj = JSON.parse(saved);
    return {
      bffApiUrl: obj?.bffApiUrl && String(obj.bffApiUrl).startsWith("http") ? String(obj.bffApiUrl) : DEFAULT_API_URL,
      languageToolUrl:
        obj?.languageToolUrl && String(obj.languageToolUrl).startsWith("http")
          ? String(obj.languageToolUrl)
          : LANGUAGETOOL_URL,
    };
  } catch {
    return { bffApiUrl: DEFAULT_API_URL, languageToolUrl: LANGUAGETOOL_URL };
  }
}
function saveConfig(next) {
  localStorage.setItem("WORDWISE_CONFIG", JSON.stringify(next, null, 2));
}

let CONFIG = loadConfig();
let API_URL = CONFIG.bffApiUrl;
LANGUAGETOOL_URL = CONFIG.languageToolUrl;

endpointLink.href = API_URL;
if (configJson) configJson.value = JSON.stringify(CONFIG, null, 2);

// ---------- Helpers ----------
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

  if (type === "error") {
    statusBadge.classList.add("bg-rose-500/15", "ring-rose-400/30", "text-rose-200");
  } else if (type === "success") {
    statusBadge.classList.add("bg-emerald-500/15", "ring-emerald-400/30", "text-emerald-200");
  } else {
    statusBadge.classList.add("bg-white/5", "ring-white/10", "text-slate-200");
  }
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

// ---------- Game rules ----------
const ROUND_WORDS = 5;

// Em vez de puxar 25 e ficar gigante, buscamos o necessário com margem
const TARGET_POOL = 40;
const MAX_FETCH_ATTEMPTS = 6;

let pool = [];
let queue = [];
let shown = [];
let seenWords = new Set();
let currentItem = null;

// Guardar resultados da rodada para relatório final
let roundStats = {
  difficulty: "medium",
  items: [], // [{word, sentence, ok, matches, byCategory}]
};

function updateCounter() {
  gameCounter.textContent = `${shown.length} / ${ROUND_WORDS}`;
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

function showCurrent(item) {
  currentItem = item;
  currentWordEl.textContent = item?.word || "—";
  currentTypeEl.textContent = item?.type || "—";
  currentHintEl.textContent = item ? "Agora escreva uma frase usando essa palavra 👇" : "—";
  renderDetails(item);
}

function randomPortugueseUseCase(word) {
  const w = word;
  const templates = [
    `Eu precisei "${w}" meus objetivos com disciplina, mesmo com dificuldades.`,
    `No trabalho, tive que "${w}" uma solução melhor antes do prazo.`,
    `Ele decidiu "${w}" um sonho antigo e não desistiu.`,
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
    </div>
  `;
}

// ---------- Difficulty filtering ----------
function scoreWord(word) {
  // heurística simples e bem prática: tamanho + “complexidade”
  const w = String(word || "").trim();
  if (!w) return 0;
  const len = w.length;
  const hasHyphen = w.includes("-");
  const hasDouble = /(tt|ss|rr|mm|pp|cc|gg)/i.test(w);
  const rareLetters = /[jqxz]/i.test(w);
  return len + (hasHyphen ? 2 : 0) + (hasDouble ? 1 : 0) + (rareLetters ? 2 : 0);
}

function matchesDifficulty(word, difficulty) {
  const s = scoreWord(word);
  if (difficulty === "easy") return s <= 7;            // palavras curtas / simples
  if (difficulty === "medium") return s >= 6 && s <= 10;
  if (difficulty === "hard") return s >= 9 && s <= 13;
  return s >= 12;                                     // veryhard
}

function normalizeWordItem(raw) {
  return {
    word: String(raw?.word ?? raw?.palavra ?? "").trim(),
    description: String(raw?.description ?? raw?.descricao ?? "").trim(),
    type: String(raw?.type ?? raw?.classe ?? "").trim(),
  };
}

async function fetchWordBatch() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
  return items.map(normalizeWordItem).filter((x) => x.word);
}

async function buildPoolForDifficulty(difficulty) {
  setStatus("Gerando palavras da rodada…", "info");

  const collected = [];
  let attempts = 0;

  while (collected.length < TARGET_POOL && attempts < MAX_FETCH_ATTEMPTS) {
    attempts += 1;
    const batch = await fetchWordBatch();
    shuffle(batch);

    for (const item of batch) {
      const key = item.word.toLowerCase();
      if (seenWords.has(key)) continue;
      if (!matchesDifficulty(item.word, difficulty)) continue;

      seenWords.add(key);
      collected.push(item);
      if (collected.length >= TARGET_POOL) break;
    }
  }

  if (!collected.length) {
    setStatus("Não consegui obter palavras nesse nível. Tente outro nível.", "error");
    return [];
  }

  setStatus(`Rodada pronta ✅ (${difficultyLabel(difficulty)})`, "success");
  setTimeout(clearStatus, 900);
  return collected;
}

function difficultyLabel(v) {
  if (v === "easy") return "Fácil";
  if (v === "medium") return "Médio";
  if (v === "hard") return "Difícil";
  return "Muito difícil";
}

// ---------- Round flow ----------
function enableGameButtons(isReady) {
  btnNextWord.disabled = !isReady;
  btnNextWord.classList.toggle("opacity-50", !isReady);
  btnNextWord.classList.toggle("cursor-not-allowed", !isReady);
}

function resetRoundUI() {
  validationResult.innerHTML = "";
  btnNewRound.classList.add("hidden");
}

async function startRound() {
  // limpa rodada atual
  pool = [];
  queue = [];
  shown = [];
  seenWords = new Set();
  currentItem = null;

  roundStats = { difficulty: difficultySelect.value, items: [] };

  resetRoundUI();
  enableGameButtons(false);
  updateCounter();
  renderHistory();
  renderDetails(null);

  currentWordEl.textContent = "—";
  currentTypeEl.textContent = "—";
  currentHintEl.textContent = "Carregando rodada…";

  try {
    pool = await buildPoolForDifficulty(roundStats.difficulty);

    // monta fila de 5 palavras aleatórias
    shuffle(pool);
    queue = pool.slice(0, ROUND_WORDS);

    enableGameButtons(queue.length > 0);
    updateCounter();
    renderHistory();

    // mostra a primeira
    nextWord();
  } catch (e) {
    console.error(e);
    setStatus("Erro ao iniciar rodada.", "error");
    currentHintEl.textContent = "Falha ao carregar. Verifique o endpoint.";
  }
}

function nextWord() {
  // se já completou 5 palavras, encerra a rodada
  if (shown.length >= ROUND_WORDS) {
    endRoundReport();
    return;
  }

  const item = queue.shift();
  if (!item) {
    // se fila acabar antes, encerra (não deve acontecer)
    endRoundReport();
    return;
  }

  shown.push(item);
  updateCounter();
  renderHistory();
  showCurrent(item);

  // sugere base de frase
  sentenceInput.value = `I want to ${item.word} my goals.`;
  validationResult.innerHTML = "";
}

function resetAll() {
  pool = [];
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
  autoValidateToggle.checked = false;
  btnNewRound.classList.add("hidden");
  clearStatus();
}

// ---------- Validation (profissional: só após parar de digitar) ----------
let validateDebounce = null;
let validateAbort = null;

const AUTO_IDLE_MS = 1300;   // <- aqui é o “para de digitar”
const MIN_CHARS_TO_VALIDATE = 10;

function ptCategoryFromMatch(m) {
  const issue = String(m?.rule?.issueType || "").toLowerCase();
  const cat = String(m?.rule?.category?.id || m?.rule?.category?.name || "").toLowerCase();

  // categorização em PT (bem util)
  if (issue.includes("misspelling")) return "Ortografia (spelling)";
  if (issue.includes("typographical")) return "Digitação";
  if (issue.includes("grammar")) return "Gramática";
  if (issue.includes("style")) return "Estilo";
  if (cat.includes("punct")) return "Pontuação";
  if (cat.includes("typo")) return "Digitação/Ortografia";
  return "Ajustes gerais";
}

function summarizeMatchesPt(matches) {
  const counter = new Map();
  for (const m of matches) {
    const c = ptCategoryFromMatch(m);
    counter.set(c, (counter.get(c) || 0) + 1);
  }
  const sorted = [...counter.entries()].sort((a,b) => b[1]-a[1]);
  return sorted;
}

function renderCelebrate() {
  validationResult.innerHTML = `
    <div class="rounded-2xl bg-emerald-500/10 p-4 text-sm text-emerald-200 ring-1 ring-emerald-400/30">
      🎉 Perfeito! Frase correta ✅
    </div>
  `;
}

function renderTryAgain(matches) {
  const summary = summarizeMatchesPt(matches).slice(0, 3);

  validationResult.innerHTML = `
    <div class="rounded-2xl bg-rose-500/10 p-4 text-sm text-rose-200 ring-1 ring-rose-400/30">
      😅 Quase! Tenta de novo — encontrei ${matches.length} ajuste(s).
      ${summary.length ? `<div class="mt-2 text-xs text-rose-100/90">Mais apareceu: ${summary.map(([c,n]) => `${c} (${n})`).join(" • ")}</div>` : ""}
    </div>
  `;

  // Mantém os cards (mensagens podem vir em EN do LT, mas o topo está em PT + categoria)
  const cards = matches.slice(0, 8).map((m) => {
    const cat = escapeHtml(ptCategoryFromMatch(m));
    const msg = escapeHtml(m.message || "Sugestão");
    const repl = (m.replacements || []).slice(0, 5).map((r) => escapeHtml(r.value)).join(", ");
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
  const byCategory = summarizeMatchesPt(matches || []);
  roundStats.items.push({ word, sentence, ok, matchesCount: (matches || []).length, byCategory });
}

async function validateSentence(text, { record = true } = {}) {
  const cleaned = (text || "").trim();
  if (!cleaned) return;

  // evita validar sem palavra atual
  if (!currentItem?.word) {
    setStatus("Comece uma rodada para validar.", "error");
    return;
  }

  // cancela anterior
  if (validateAbort) validateAbort.abort();
  validateAbort = new AbortController();

  setStatus("Validando…", "info");

  const body = new URLSearchParams();
  body.set("text", cleaned);
  body.set("language", "en-US");
  // dá uma ajudinha pra PT (não traduz tudo, mas melhora sugestões pra quem é PT)
  body.set("motherTongue", "pt");

  try {
    const res = await fetch(LANGUAGETOOL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      signal: validateAbort.signal,
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const matches = data?.matches || [];

    if (!matches.length) {
      setStatus("Correto ✅", "success");
      setTimeout(clearStatus, 800);
      renderCelebrate();
      if (record) recordRoundStat({ word: currentItem.word, sentence: cleaned, ok: true, matches: [] });
      return { ok: true, matches: [] };
    }

    setStatus("Tem ajustes…", "error");
    setTimeout(clearStatus, 900);
    renderTryAgain(matches);
    if (record) recordRoundStat({ word: currentItem.word, sentence: cleaned, ok: false, matches });
    return { ok: false, matches };
  } catch (err) {
    if (err?.name === "AbortError") return null;
    console.error(err);
    setStatus("Erro ao validar frase.", "error");
    return null;
  }
}

function scheduleAutoValidate() {
  if (!autoValidateToggle.checked) return;

  clearTimeout(validateDebounce);
  validateDebounce = setTimeout(() => {
    const value = (sentenceInput.value || "").trim();
    if (value.length >= MIN_CHARS_TO_VALIDATE) {
      validateSentence(value);
    }
  }, AUTO_IDLE_MS);
}

// ---------- End of round report (PT) ----------
function makeRoundAdvicePt() {
  if (!roundStats.items.length) {
    return {
      title: "Rodada finalizada",
      body: "Você terminou a rodada, mas não encontrei validações registradas. Valide pelo menos uma frase por palavra 🙂",
    };
  }

  const total = roundStats.items.length;
  const okCount = roundStats.items.filter((x) => x.ok).length;

  // soma categorias
  const catSum = new Map();
  for (const it of roundStats.items) {
    for (const [cat, n] of it.byCategory) {
      catSum.set(cat, (catSum.get(cat) || 0) + n);
    }
  }
  const topCats = [...catSum.entries()].sort((a,b) => b[1]-a[1]).slice(0, 4);

  // recomendações em PT (simples e úteis)
  const tips = [];
  for (const [cat] of topCats) {
    if (cat.includes("Ortografia")) tips.push("Revise ortografia: palavras digitadas errado costumam ser os erros mais fáceis de eliminar.");
    else if (cat.includes("Pontuação")) tips.push("Pontuação: confira ponto final, vírgulas e uso de maiúsculas no começo da frase.");
    else if (cat.includes("Gramática")) tips.push("Gramática: preste atenção em artigos (a/an/the), ordem das palavras e concordância do verbo.");
    else if (cat.includes("Estilo")) tips.push("Estilo: tente frases mais naturais e diretas, evitando construções “engessadas”.");
    else tips.push("Ajustes gerais: reescreva a frase de forma mais simples e compare com as sugestões.");
  }

  // se não tiver categorias, ainda dá dica
  if (!tips.length) tips.push("Tente escrever frases completas (sujeito + verbo + complemento) e valide novamente.");

  return {
    title: `Relatório da rodada (${difficultyLabel(roundStats.difficulty)})`,
    body: `Você validou ${total} frase(s). Acertos: ${okCount}/${total}.`,
    topCats,
    tips,
  };
}

function endRoundReport() {
  enableGameButtons(false);
  btnNewRound.classList.remove("hidden");

  const advice = makeRoundAdvicePt();

  const catsHtml =
    advice.topCats && advice.topCats.length
      ? `<div class="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
           <p class="text-sm font-semibold">O que mais apareceu</p>
           <p class="mt-1 text-sm text-slate-300">${advice.topCats.map(([c,n]) => `${escapeHtml(c)} (${n})`).join(" • ")}</p>
         </div>`
      : "";

  const tipsHtml =
    advice.tips && advice.tips.length
      ? `<div class="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
           <p class="text-sm font-semibold">Sugestões do que melhorar (PT)</p>
           <ul class="mt-2 grid gap-2">
             ${advice.tips.slice(0, 6).map(t => `<li class="rounded-2xl bg-slate-950/50 p-3 text-sm ring-1 ring-white/10">${escapeHtml(t)}</li>`).join("")}
           </ul>
         </div>`
      : "";

  validationResult.innerHTML = `
    <div class="rounded-2xl bg-emerald-500/10 p-4 text-sm text-emerald-200 ring-1 ring-emerald-400/30">
      ✅ Rodada concluída! ${escapeHtml(advice.body || "")}
    </div>
    ${catsHtml}
    ${tipsHtml}
    <div class="rounded-2xl bg-slate-950/50 p-4 text-sm text-slate-200 ring-1 ring-white/10">
      Quer subir o nível? Troque a dificuldade e clique em <b>Nova rodada</b> 🚀
    </div>
  `;

  currentHintEl.textContent = "Rodada finalizada. Veja o relatório e inicie uma nova rodada.";
}

// ---------- Settings modal ----------
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
  CONFIG = { bffApiUrl: DEFAULT_API_URL, languageToolUrl: "https://api.languagetool.org/v2/check" };
  API_URL = CONFIG.bffApiUrl;
  LANGUAGETOOL_URL = CONFIG.languageToolUrl;

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
      const languageToolUrl = String(parsed?.languageToolUrl || "").trim();

      if (!bffApiUrl.startsWith("http")) {
        setStatus("JSON inválido: bffApiUrl precisa começar com http:// ou https://", "error");
        return;
      }
      if (languageToolUrl && !languageToolUrl.startsWith("http")) {
        setStatus("JSON inválido: languageToolUrl precisa começar com http:// ou https://", "error");
        return;
      }

      CONFIG = { bffApiUrl, languageToolUrl: languageToolUrl || "https://api.languagetool.org/v2/check" };
      saveConfig(CONFIG);

      API_URL = CONFIG.bffApiUrl;
      LANGUAGETOOL_URL = CONFIG.languageToolUrl;

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

  CONFIG = { bffApiUrl: val, languageToolUrl: LANGUAGETOOL_URL };
  saveConfig(CONFIG);
  API_URL = val;
  endpointLink.href = API_URL;

  closeSettings();
  setStatus("Endpoint atualizado ✅", "success");
  setTimeout(clearStatus, 900);
  resetAll();
});

// ---------- Buttons & Events ----------
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

// Auto validate: só quando parar de digitar (idle)
autoValidateToggle.addEventListener("change", () => {
  if (autoValidateToggle.checked) {
    setStatus("Automático ligado ✅ (valida quando você parar de digitar)", "success");
    setTimeout(clearStatus, 900);
    scheduleAutoValidate();
  } else {
    setStatus("Automático desligado.", "info");
    setTimeout(clearStatus, 700);
  }
});

sentenceInput.addEventListener("input", () => {
  // PROFISSIONAL: só valida após o usuário parar (idle)
  if (autoValidateToggle.checked) scheduleAutoValidate();
});

// Extra: valida ao tirar o foco do campo (profissional também)
sentenceInput.addEventListener("blur", () => {
  if (autoValidateToggle.checked) {
    const v = (sentenceInput.value || "").trim();
    if (v.length >= MIN_CHARS_TO_VALIDATE) validateSentence(v);
  }
});

// Init
resetAll();
