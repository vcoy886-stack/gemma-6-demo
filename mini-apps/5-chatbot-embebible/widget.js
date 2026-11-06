/**
 * Widget de chat IA embebible — corre 100% en el navegador del visitante
 * (WebGPU + Gemma), sin backend ni costo de API por conversación.
 *
 * Uso en cualquier web:
 *   <script src=".../widget.js" data-business="Mi Negocio"
 *           data-context="Horario: 9am-8pm. Envíos a todo el país..."></script>
 */
(function () {
  const scriptTag = document.currentScript;
  const business = scriptTag.dataset.business || "Nuestro negocio";
  const context = scriptTag.dataset.context || "";
  const accent = scriptTag.dataset.accent || "#6366f1";
  const engineUrl = new URL("./gemma-engine.js", scriptTag.src).href;

  const uid = "gcw-" + Math.random().toString(36).slice(2, 9);

  // Elimina un montaje previo (útil para vistas previas en vivo)
  document.querySelectorAll("[data-gcw-root]").forEach((el) => el.remove());

  const style = document.createElement("style");
  style.textContent = `
    #${uid} * { box-sizing: border-box; font-family: 'Inter', system-ui, sans-serif; }
    #${uid}-bubble {
      position: fixed; bottom: 22px; right: 22px; z-index: 999999;
      width: 58px; height: 58px; border-radius: 50%;
      background: linear-gradient(135deg, ${accent}, #a855f7);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; box-shadow: 0 8px 24px rgba(0,0,0,.35);
      font-size: 26px; border: none; transition: transform .15s;
    }
    #${uid}-bubble:hover { transform: scale(1.06); }
    #${uid}-panel {
      position: fixed; bottom: 92px; right: 22px; z-index: 999999;
      width: 340px; max-width: calc(100vw - 44px); height: 460px; max-height: 70vh;
      background: #13161d; border: 1px solid #252938; border-radius: 16px;
      display: none; flex-direction: column; overflow: hidden;
      box-shadow: 0 16px 48px rgba(0,0,0,.5); color: #e8eaf0;
    }
    #${uid}-panel.open { display: flex; }
    #${uid}-head {
      padding: 14px 16px; background: #1a1e28; border-bottom: 1px solid #252938;
      display: flex; align-items: center; gap: 10px; font-size: 13.5px; font-weight: 600;
    }
    #${uid}-head .gcw-dot { width: 7px; height: 7px; border-radius: 50%; background: #f59e0b; }
    #${uid}-head .gcw-dot.ready { background: #22c55e; }
    #${uid}-close { margin-left: auto; background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 16px; }
    #${uid}-body { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; font-size: 13.5px; }
    #${uid}-body .gcw-msg { padding: 9px 12px; border-radius: 12px; line-height: 1.5; max-width: 88%; white-space: pre-wrap; }
    #${uid}-body .gcw-msg.user { background: #1e2235; align-self: flex-end; }
    #${uid}-body .gcw-msg.bot { background: #141720; align-self: flex-start; border: 1px solid #252938; }
    #${uid}-body .gcw-hint { color: #6b7280; font-size: 12px; text-align: center; padding: 10px; }
    #${uid}-inputwrap { padding: 10px; border-top: 1px solid #252938; display: flex; gap: 8px; }
    #${uid}-input { flex: 1; background: #1a1e28; border: 1px solid #252938; border-radius: 9px; padding: 9px 11px; color: #e8eaf0; font-size: 13px; outline: none; }
    #${uid}-send { background: linear-gradient(135deg, ${accent}, #a855f7); border: none; border-radius: 9px; width: 36px; color: #fff; cursor: pointer; font-size: 15px; }
    #${uid}-send:disabled { opacity: .4; cursor: not-allowed; }
    #${uid}-badge { text-align: center; font-size: 10.5px; color: #6b7280; padding: 6px 0 2px; }
  `;
  document.head.appendChild(style);

  const root = document.createElement("div");
  root.id = uid;
  root.setAttribute("data-gcw-root", "1");
  root.innerHTML = `
    <button id="${uid}-bubble" title="Chat con ${business}">💬</button>
    <div id="${uid}-panel">
      <div id="${uid}-head">
        <span class="gcw-dot" id="${uid}-dot"></span>
        <span>${business}</span>
        <button id="${uid}-close">✕</button>
      </div>
      <div id="${uid}-body">
        <div class="gcw-hint">Pregunta lo que quieras — el asistente conoce la info de ${business}.</div>
      </div>
      <div id="${uid}-inputwrap">
        <input id="${uid}-input" type="text" placeholder="Escribe tu pregunta…" />
        <button id="${uid}-send">➤</button>
      </div>
      <div id="${uid}-badge">Chat con IA on-device · sin costo por conversación</div>
    </div>
  `;
  document.body.appendChild(root);

  const bubble = root.querySelector(`#${uid}-bubble`);
  const panel = root.querySelector(`#${uid}-panel`);
  const closeBtn = root.querySelector(`#${uid}-close`);
  const body = root.querySelector(`#${uid}-body`);
  const input = root.querySelector(`#${uid}-input`);
  const sendBtn = root.querySelector(`#${uid}-send`);
  const dot = root.querySelector(`#${uid}-dot`);

  let engine = null;
  let loaded = false;
  let sending = false;

  function addMsg(role, text) {
    const div = document.createElement("div");
    div.className = "gcw-msg " + (role === "user" ? "user" : "bot");
    div.textContent = text;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    return div;
  }

  async function ensureEngine() {
    if (loaded) return;
    const hint = body.querySelector(".gcw-hint");
    const { GemmaEngine } = await import(engineUrl);
    if (!GemmaEngine.isSupported()) {
      if (hint) hint.textContent = "Este navegador no soporta WebGPU. Prueba con Chrome/Edge 113+.";
      throw new Error("WebGPU no soportado");
    }
    engine = new GemmaEngine();
    if (hint) hint.textContent = "Cargando asistente (una sola vez, luego queda en caché)…";
    await engine.load((pct) => { if (hint) hint.textContent = `Cargando asistente… ${Math.round(pct)}%`; });
    if (hint) hint.remove();
    dot.classList.add("ready");
    loaded = true;
  }

  async function send() {
    const text = input.value.trim();
    if (!text || sending) return;
    sending = true;
    input.value = "";
    sendBtn.disabled = true;
    addMsg("user", text);

    const thinking = addMsg("bot", "…");
    try {
      await ensureEngine();
      const sys = `Eres el asistente de atención al cliente de "${business}". Usa esta información del negocio para responder preguntas de clientes de forma breve (máximo 3 frases) y en español:\n\n${context}\n\nSi no sabes la respuesta con la información dada, dilo con honestidad y sugiere contactar directamente al negocio.`;
      let acc = "";
      await engine.generate(sys, text, (partial) => { acc = partial; thinking.textContent = partial; });
      thinking.textContent = acc.trim();
    } catch (err) {
      thinking.textContent = "No se pudo responder: " + err.message;
    }
    sending = false;
    sendBtn.disabled = false;
  }

  bubble.addEventListener("click", () => {
    panel.classList.toggle("open");
    if (panel.classList.contains("open")) input.focus();
  });
  closeBtn.addEventListener("click", () => panel.classList.remove("open"));
  sendBtn.addEventListener("click", send);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
})();
