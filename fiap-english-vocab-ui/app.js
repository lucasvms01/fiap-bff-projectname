const DEFAULT_API_URL = "https://fiap-bff-9aojr.onrender.com/ask";

const btnFetch = document.getElementById("btnFetch");
const btnClear = document.getElementById("btnClear");
const filterInput = document.getElementById("filterInput");
const cards = document.getElementById("cards");
const statusBox = document.getElementById("statusBox");
const countLabel = document.getElementById("countLabel");

let allItems = [];

function setStatus(message, type = "info") {
  statusBox.classList.remove("hidden");
  statusBox.textContent = message;

  // Estilo simples por tipo (sem depender de CSS externo)
  statusBox.className =
    "mt-4 rounded-2xl p-4 text-sm ring-1 " +
    (type === "error"
      ? "bg-red-500/10 text-red-200 ring-red-400/30"
      : type === "success"
      ? "bg-emerald-500/10 text-emerald-200 ring-emerald-400/30"
      : "bg-slate-900/60 text-slate-200 ring-white/10");
}

function clearStatus() {
  statusBox.classList.add("hidden");
  statusBox.textContent = "";
}

function normalize(str) {
  return String(str || "").toLowerCase().trim();
}

function render(items) {
  cards.innerHTML = "";

  countLabel.textContent = `${items.length} ${items.length === 1 ? "item" : "itens"}`;

  if (!items.length) {
    cards.innerHTML = `
      <div class="sm:col-span-2 rounded-2xl bg-slate-900/60 p-6 text-sm text-slate-300 ring-1 ring-white/10">
        Nenhum resultado para exibir.
      </div>
    `;
    return;
  }

  for (const item of items) {
    const word = item?.word ?? "—";
    const description = item?.description ?? "Sem descrição.";
    const useCase = item?.useCase ?? "Sem caso de uso.";

    const el = document.createElement("article");
    el.className =
      "rounded-3xl bg-white/5 p-5 ring-1 ring-white/10 hover:bg-white/10 transition";

    el.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <h4 class="text-lg font-semibold text-slate-100">${escapeHtml(word)}</h4>
        <button
          class="copyBtn rounded-xl bg-white/5 px-3 py-1 text-xs text-slate-200 ring-1 ring-white/10 hover:bg-white/10"
          data-word="${escapeHtml(word)}"
          title="Copiar palavra"
        >Copiar</button>
      </div>

      <p class="mt-3 text-sm text-slate-300">
        <span class="text-slate-200 font-semibold">Descrição:</span>
        ${escapeHtml(description)}
      </p>

      <div class="mt-3 rounded-2xl bg-slate-900/60 p-4 text-sm text-slate-200 ring-1 ring-white/10">
        <div class="text-xs font-semibold text-slate-300">Caso de uso</div>
        <div class="mt-1">${escapeHtml(useCase)}</div>
      </div>
    `;

    cards.appendChild(el);
  }

  // Copiar palavra
  document.querySelectorAll(".copyBtn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const w = btn.getAttribute("data-word") || "";
      try {
        await navigator.clipboard.writeText(w);
        setStatus(`Copiado: "${w}"`, "success");
        setTimeout(clearStatus, 1500);
      } catch {
        setStatus("Não foi possível copiar para a área de transferência.", "error");
      }
    });
  });
}

// Proteção básica contra HTML injection ao renderizar
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function fetchWords() {
  btnFetch.disabled = true;
  clearStatus();
  setStatus("Buscando palavras no BFF...");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(DEFAULT_API_URL, {
      method: "GET",
      headers: { "Accept": "application/json" },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      throw new Error("Resposta inválida: não é um array.");
    }

    allItems = data;
    applyFilter();
    setStatus("Pronto! Palavras carregadas.", "success");
    setTimeout(clearStatus, 1500);
  } catch (err) {
    const msg =
      err?.name === "AbortError"
        ? "Tempo excedido ao consultar o BFF (timeout)."
        : `Erro ao buscar palavras: ${err?.message || "desconhecido"}`;
    setStatus(msg, "error");
    allItems = [];
    render([]);
  } finally {
    btnFetch.disabled = false;
  }
}

function applyFilter() {
  const q = normalize(filterInput.value);
  const filtered = q
    ? allItems.filter((x) => normalize(x?.word).includes(q))
    : allItems;

  render(filtered);
}

// Events
btnFetch.addEventListener("click", fetchWords);
btnClear.addEventListener("click", () => {
  filterInput.value = "";
  allItems = [];
  render([]);
  clearStatus();
});
filterInput.addEventListener("input", applyFilter);

// Estado inicial
render([]);
