/**
 * English Vocab Helper - Front (Vanilla)
 * - Consome o BFF /ask (GET) e renderiza word/description/useCase
 * - Usuário escreve uma frase e valida (gramática/estilo) usando LanguageTool
 */

const DEFAULT_API_URL = "https://fiap-bff-v2.onrender.com/ask";// público
const LANGUAGETOOL_URL = "https://api.languagetool.org/v2/check"; // público

// Elements
const btnFetch = document.getElementById("btnFetch");
const btnClear = document.getElementById("btnClear");
const filterInput = document.getElementById("filterInput");
const cards = document.getElementById("cards");
const statusBox = document.getElementById("statusBox");
const countLabel = document.getElementById("countLabel");

const wordSelect = document.getElementById("wordSelect");
const btnCopyWord = document.getElementById("btnCopyWord");

const wordLabel = document.getElementById("wordLabel");
const descLabel = document.getElementById("descLabel");
const useLabel = document.getElementById("useLabel");
const hintLabel = document.getElementById("hintLabel");

const sentenceInput = document.getElementById("sentenceInput");
const btnValidate = document.getElementById("btnValidate");
const wordUsageHint = document.getElementById("wordUsageHint");

const validationBox = document.getElementById("validationBox");
const suggestionsList = document.getElementById("suggestionsList");
const betterSentence = document.getElementById("betterSentence");
const btnApplySuggestion = document.getElementById("btnApplySuggestion");
const btnCopySentence = document.getElementById("btnCopySentence");

const endpointLink = document.getElementById("endpointLink");

// Settings modal
const settingsModal = document.getElementById("settingsModal");
const btnSettings = document.getElementById("btnSettings");
const btnCloseSettings = document.getElementById("btnCloseSettings");
const apiUrlInput = document.getElementById("apiUrlInput");
const btnSaveApi = document.getElementById("btnSaveApi");
const btnResetApi = document.getElementById("btnResetApi");

// State
let allItems = [];
let filteredItems = [];
let selectedWordItem = null;

let API_URL = loadApiUrl();
endpointLink.href = API_URL;

// ---------- UI Helpers ----------
function setStatus(message, type = "info") {
  statusBox.classList.remove("hidden");

  const base = "mt-4 rounded-2xl p-4 text-sm ring-1";
  const cls =
    type === "error"
      ? "bg-red-500/10 text-red-200 ring-red-400/30"
      : type === "success"
      ? "bg-emerald-500/10 text-emerald-200 ring-emerald-400/30"
      : "bg-slate-900/60 text-slate-200 ring-white/10";

  statusBox.className = `${base} ${cls}`;
  statusBox.textContent = message;
}

function clearStatus() {
  statusBox.classList.add("hidden");
  statusBox.textContent = "";
}

function setValidation(message, type = "info") {
  validationBox.classList.remove("hidden");

  const base = "mt-4 rounded-2xl p-4 text-sm ring-1";
  const cls =
    type === "error"
      ? "bg-red-500/10 text-red-200 ring-red-400/30"
      : type === "success"
      ? "bg-emerald-500/10 text-emerald-200 ring-emerald-400/30"
      : "bg-slate-900/60 text-slate-200 ring-white/10";

  validationBox.className = `${base} ${cls}`;
  validationBox.textContent = message;
}

function clearValidation() {
  validationBox.classList.add("hidden");
  validationBox.textContent = "";
  suggestionsList.innerHTML = `<li class="text-slate-400">—</li>`;
  betterSentence.textContent = "—";
  betterSentence.classList.add("text-slate-400");
  btnApplySuggestion.disabled = true;
  btnCopySentence.disabled = true;
}

function normalize(str) {
  return String(str || "").toLowerCase().trim();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function debounce(fn, delay = 700) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

function wordInSentence(word, sentence) {
  // word boundary (case-insensitive)
  const w = String(word || "").trim();
  if (!w) return false;
  const re = new RegExp(`\\b${escapeRegExp(w)}\\b`, "i");
  return re.test(sentence);
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---------- Settings ----------
function loadApiUrl() {
  const saved = localStorage.getItem("BFF_API_URL");
  return saved && saved.startsWith("http") ? saved : DEFAULT_API_URL;
}

function saveApiUrl(url) {
  localStorage.setItem("BFF_API_URL", url);
}

function openSettings() {
  apiUrlInput.value = API_URL;
  settingsModal.classList.remove("hidden");
  settingsModal.classList.add("flex");
}

function closeSettings() {
  settingsModal.classList.add("hidden");
  settingsModal.classList.remove("flex");
}

// ---------- Rendering ----------
function renderCards(items) {
  cards.innerHTML = "";

  countLabel.textContent = `${items.length} ${items.length === 1 ? "item" : "itens"}`;

  if (!items.length) {
    cards.innerHTML = `
      <div class="rounded-2xl bg-slate-900/60 p-6 text-sm text-slate-300 ring-1 ring-white/10">
        Nenhum resultado para exibir.
      </div>
    `;
    return;
  }

  for (const item of items) {
    const word = item?.word ?? "—";
    const description = item?.description ?? "Sem descrição.";
    const useCase = item?.useCase ?? "Sem caso de uso.";

    const el = document.createElement("button");
    el.type = "button";
    el.className =
      "text-left rounded-3xl bg-white/5 p-4 ring-1 ring-white/10 hover:bg-white/10 transition focus:outline-none focus:ring-2 focus:ring-indigo-500";

    el.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-xs text-slate-400">Word</div>
          <div class="text-base font-semibold text-slate-100">${escapeHtml(word)}</div>
        </div>
        <div class="text-xs text-slate-400">${escapeHtml(shorten(description, 42))}</div>
      </div>
      <div class="mt-3 text-xs text-slate-300">
        <span class="font-semibold text-slate-200">Use:</span>
        ${escapeHtml(shorten(useCase, 80))}
      </div>
    `;

    el.addEventListener("click", () => {
      setSelectedWord(item);
      wordSelect.value = item.word;
      sentenceInput.focus();
    });

    cards.appendChild(el);
  }
}

function shorten(text, max = 60) {
  const s = String(text || "");
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

function populateSelect(items) {
  wordSelect.innerHTML = "";
  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = items.length ? "— selecione —" : "— gere as palavras —";
  wordSelect.appendChild(opt0);

  for (const it of items) {
    const opt = document.createElement("option");
    opt.value = it.word;
    opt.textContent = it.word;
    wordSelect.appendChild(opt);
  }
}

function setSelectedWord(item) {
  selectedWordItem = item;

  const word = item?.word ?? "—";
  const description = item?.description ?? "—";
  const useCase = item?.useCase ?? "—";

  wordLabel.textContent = word;
  descLabel.textContent = description;
  useLabel.textContent = useCase;

  hintLabel.textContent = `Agora escreva uma frase em inglês usando "${word}".`;

  btnCopyWord.disabled = !item?.word;

  sentenceInput.disabled = !item?.word;
  btnValidate.disabled = !item?.word;

  // reset feedback
  clearValidation();

  wordUsageHint.textContent = item?.word
    ? `Use a palavra "${word}" exatamente na frase (dica: Ctrl+Enter valida).`
    : "Selecione uma palavra para habilitar o treino.";
}

function applyFilter() {
  const q = normalize(filterInput.value);
  filteredItems = q ? allItems.filter((x) => normalize(x?.word).includes(q)) : allItems;

  renderCards(filteredItems);
  populateSelect(filteredItems);

  // se a palavra selecionada sumiu do filtro, desmarcar
  if (selectedWordItem && q && !filteredItems.some((x) => x.word === selectedWordItem.word)) {
    setSelectedWord(null);
    wordSelect.value = "";
  }
}

// ---------- Networking ----------
async function fetchWords() {
  btnFetch.disabled = true;
  clearStatus();
  setStatus("Buscando palavras no BFF...");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(API_URL, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}${text ? " - " + text : ""}`);
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      throw new Error("Resposta inválida: não é um array.");
    }

    allItems = data;
    filterInput.value = "";
    applyFilter();

    setStatus("Pronto! Selecione uma palavra e escreva sua frase.", "success");

    // Seleciona automaticamente a primeira (melhor UX)
    if (allItems.length) {
      setSelectedWord(allItems[0]);
      wordSelect.value = allItems[0].word;
      sentenceInput.disabled = false;
      btnValidate.disabled = false;
      sentenceInput.focus();
    } else {
      setSelectedWord(null);
      wordSelect.value = "";
    }
  } catch (err) {
    const msg =
      err?.name === "AbortError"
        ? "Tempo excedido ao consultar o BFF (timeout)."
        : `Erro ao buscar palavras: ${err?.message || "desconhecido"}`;
    setStatus(msg, "error");
    allItems = [];
    filteredItems = [];
    renderCards([]);
    populateSelect([]);
    setSelectedWord(null);
  } finally {
    btnFetch.disabled = false;
  }
}

async function validateSentence() {
  const word = selectedWordItem?.word || "";
  const sentence = sentenceInput.value.trim();

  clearValidation();

  if (!word) {
    setValidation("Selecione uma palavra primeiro.", "error");
    return;
  }

  if (sentence.length < 6) {
    setValidation("Escreva uma frase um pouco maior para validar.", "error");
    return;
  }

  if (!wordInSentence(word, sentence)) {
    setValidation(`Sua frase não contém a palavra "${word}". Tente incluir ela exatamente.`, "error");
    suggestionsList.innerHTML = `
      <li>Inclua a palavra <b>${escapeHtml(word)}</b> na frase.</li>
      <li>Ex.: <span class="text-slate-300">I want to ${escapeHtml(word)} my skills.</span></li>
    `;
    return;
  }

  setValidation("Validando gramática e estilo...", "info");
  btnValidate.disabled = true;

  try {
    // LanguageTool expects application/x-www-form-urlencoded
    const body = new URLSearchParams();
    body.set("text", sentence);
    body.set("language", "en-US");

    const res = await fetch(LANGUAGETOOL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`LanguageTool HTTP ${res.status}${t ? " - " + t : ""}`);
    }

    const data = await res.json();
    const matches = Array.isArray(data?.matches) ? data.matches : [];

    // Se não houver alertas, aprova
    if (!matches.length) {
      setValidation("Frase OK ✅ Sem sugestões de correção!", "success");
      suggestionsList.innerHTML = `<li class="text-slate-200">Nenhuma correção necessária. Ótimo!</li>`;
      betterSentence.textContent = sentence;
      betterSentence.classList.remove("text-slate-400");
      btnCopySentence.disabled = false;
      btnApplySuggestion.disabled = true;
      return;
    }

    // Monta sugestões
    const suggestions = matches
      .slice(0, 8)
      .map((m) => ({
        message: m.message,
        short: m.shortMessage,
        offset: m.offset,
        length: m.length,
        replacements: (m.replacements || []).slice(0, 4).map((r) => r.value),
        context: m.context?.text,
      }));

    // Frase “melhorada” (aplica primeira sugestão de cada match, quando existir)
    let improved = sentence;
    // Precisamos aplicar da direita pra esquerda (pra não quebrar offsets)
    const sorted = [...matches].sort((a, b) => b.offset - a.offset);
    for (const m of sorted) {
      const rep = m.replacements?.[0]?.value;
      if (!rep) continue;
      improved =
        improved.slice(0, m.offset) + rep + improved.slice(m.offset + m.length);
    }

    setValidation(`Encontramos ${matches.length} sugestão(ões).`, "info");

    suggestionsList.innerHTML = suggestions
      .map((s) => {
        const label = s.short ? `${s.short}: ` : "";
        const reps = s.replacements.length ? `Sugestões: ${s.replacements.join(", ")}` : "Sem substituições sugeridas.";
        return `
          <li class="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
            <div class="text-slate-100">${escapeHtml(label + s.message)}</div>
            <div class="mt-1 text-xs text-slate-300">${escapeHtml(reps)}</div>
          </li>
        `;
      })
      .join("");

    betterSentence.textContent = improved;
    betterSentence.classList.remove("text-slate-400");
    btnApplySuggestion.disabled = improved === sentence;
    btnCopySentence.disabled = false;
  } catch (err) {
    // Fallback básico (sem LanguageTool)
    setValidation(
      `Não consegui validar com o serviço externo. Fiz uma validação básica. (${err?.message || "erro"})`,
      "error"
    );

    const basic = basicSuggestions(word, sentence);
    suggestionsList.innerHTML = basic.map((x) => `<li>${escapeHtml(x)}</li>`).join("");

    betterSentence.textContent = sentence;
    betterSentence.classList.remove("text-slate-400");
    btnCopySentence.disabled = false;
    btnApplySuggestion.disabled = true;
  } finally {
    btnValidate.disabled = false;
  }
}

function basicSuggestions(word, sentence) {
  const tips = [];
  tips.push(`OK: a frase contém "${word}".`);

  if (!/[.!?]$/.test(sentence)) tips.push("Sugestão: finalize a frase com ponto final.");
  if (sentence.split(/\s+/).length < 7) tips.push("Sugestão: tente deixar a frase um pouco mais completa.");
  if (/very very/i.test(sentence)) tips.push('Sugestão: evite repetição como "very very".');
  if (/^\w/.test(sentence) && sentence[0] === sentence[0].toLowerCase())
    tips.push("Sugestão: comece a frase com letra maiúscula.");

  tips.push("Dica: tente usar a palavra em um contexto real (trabalho, estudos, rotina).");
  return tips;
}

// ---------- Clipboard ----------
async function copyText(text) {
  await navigator.clipboard.writeText(text);
}

// ---------- Events ----------
btnFetch.addEventListener("click", fetchWords);

btnClear.addEventListener("click", () => {
  filterInput.value = "";
  allItems = [];
  filteredItems = [];
  renderCards([]);
  populateSelect([]);
  setSelectedWord(null);
  wordSelect.value = "";
  sentenceInput.value = "";
  sentenceInput.disabled = true;
  btnValidate.disabled = true;
  btnCopyWord.disabled = true;
  clearStatus();
  clearValidation();
});

filterInput.addEventListener("input", applyFilter);

wordSelect.addEventListener("change", () => {
  const w = wordSelect.value;
  if (!w) {
    setSelectedWord(null);
    sentenceInput.value = "";
    return;
  }
  const item = filteredItems.find((x) => x.word === w) || allItems.find((x) => x.word === w);
  if (item) setSelectedWord(item);
});

btnCopyWord.addEventListener("click", async () => {
  if (!selectedWordItem?.word) return;
  try {
    await copyText(selectedWordItem.word);
    setStatus(`Copiado: "${selectedWordItem.word}"`, "success");
    setTimeout(clearStatus, 1200);
  } catch {
    setStatus("Não foi possível copiar.", "error");
  }
});

btnValidate.addEventListener("click", validateSentence);

btnApplySuggestion.addEventListener("click", () => {
  const s = betterSentence.textContent;
  if (!s || s === "—") return;
  sentenceInput.value = s;
  sentenceInput.focus();
  // Revalida rapidinho (UX)
  validateSentence();
});

btnCopySentence.addEventListener("click", async () => {
  const s = sentenceInput.value.trim();
  if (!s) return;
  try {
    await copyText(s);
    setValidation("Frase copiada ✅", "success");
    setTimeout(clearValidation, 1000);
  } catch {
    setValidation("Não foi possível copiar a frase.", "error");
  }
});

// Atalho Ctrl+Enter para validar
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "Enter") {
    if (!btnValidate.disabled) validateSentence();
  }
});

// Validação automática (quando parar de digitar)
const autoValidate = debounce(() => {
  if (sentenceInput.disabled) return;
  const s = sentenceInput.value.trim();
  if (s.length >= 6) validateSentence();
}, 900);

sentenceInput.addEventListener("input", autoValidate);

// Settings
btnSettings.addEventListener("click", openSettings);
btnCloseSettings.addEventListener("click", closeSettings);
settingsModal.addEventListener("click", (e) => {
  if (e.target === settingsModal) closeSettings();
});

btnResetApi.addEventListener("click", () => {
  API_URL = DEFAULT_API_URL;
  apiUrlInput.value = API_URL;
});

btnSaveApi.addEventListener("click", () => {
  const val = apiUrlInput.value.trim();
  if (!val.startsWith("http")) {
    setStatus("URL inválida. Use http:// ou https://", "error");
    return;
  }
  API_URL = val;
  saveApiUrl(API_URL);
  endpointLink.href = API_URL;
  closeSettings();
  setStatus("Endpoint atualizado ✅", "success");
  setTimeout(clearStatus, 1200);
});

// Init
renderCards([]);
populateSelect([]);
setSelectedWord(null);
endpointLink.href = API_URL;