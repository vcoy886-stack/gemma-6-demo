/**
 * Motor de IA compartido — Gemma en el navegador (WebGPU, sin backend ni API key)
 * Basado en el demo original del repo (index (5).html), extraído aquí para
 * reutilizarse en las 5 mini apps como capa opcional de "mejora con IA"
 * (obligatoria solo en la app 5, el chatbot embebible).
 *
 * Uso:
 *   import { GemmaEngine } from "./gemma-engine.js";
 *   const engine = new GemmaEngine();
 *   await engine.load((pct, label) => ...);   // descarga/inicializa el modelo
 *   await engine.generate(systemPrompt, userText, (partial) => ...); // streaming
 */

const MODEL_URL =
  "https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it-web.task";
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@0.10.22/wasm";

export class GemmaEngine {
  constructor() {
    this.llm = null;
    this.ready = false;
    this.loading = false;
  }

  static isSupported() {
    return !!navigator.gpu;
  }

  async load(onProgress) {
    if (this.ready || this.loading) return;
    this.loading = true;

    const { FilesetResolver, LlmInference } = await import(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@0.10.22/genai_bundle.mjs"
    );

    let fake = 0;
    const timer = setInterval(() => {
      fake = Math.min(fake + Math.random() * 1.5, 88);
      if (onProgress) onProgress(fake, "Descargando modelo (~2 GB, se guarda en caché)…");
    }, 400);

    try {
      const fileset = await FilesetResolver.forGenAiTasks(WASM_URL);
      this.llm = await LlmInference.createFromModelPath(fileset, MODEL_URL);
      clearInterval(timer);
      if (onProgress) onProgress(100, "Listo");
      this.ready = true;
    } catch (err) {
      clearInterval(timer);
      this.loading = false;
      throw err;
    }
    this.loading = false;
  }

  /**
   * Genera texto a partir de una instrucción de sistema + entrada del usuario,
   * usando el formato de turnos de Gemma. Llama a onPartial(textoAcumulado) en streaming.
   */
  async generate(systemPrompt, userText, onPartial) {
    if (!this.ready || !this.llm) throw new Error("El motor de IA no está cargado todavía.");

    const prompt =
      (systemPrompt ? `<start_of_turn>user\n${systemPrompt}\n\n${userText}<end_of_turn>\n` : `<start_of_turn>user\n${userText}<end_of_turn>\n`) +
      `<start_of_turn>model\n`;

    let acc = "";
    await this.llm.generateResponse(prompt, (partial) => {
      acc += partial;
      if (onPartial) onPartial(acc);
    });
    return acc;
  }
}
