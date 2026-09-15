import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

let client: Anthropic | null = null;
function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  if (!client) client = new Anthropic({ apiKey });
  return client;
}

export function isAiGenerationEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Pide a Claude que redacte una respuesta natural EXCLUSIVAMENTE a partir de los hechos
 * reales ya consultados en la base de datos (pasados en `facts`). Nunca se le pide que
 * invente datos del negocio: solo que los explique con mejor tono y priorización.
 * Si no hay API key configurada o la llamada falla, devuelve null para que el llamador
 * use el texto determinista como respaldo.
 */
export async function refineWithClaude(opts: {
  userQuestion: string;
  facts: string;
  userName: string;
  extraInstructions?: string;
}): Promise<string | null> {
  const anthropic = getClient();
  if (!anthropic) return null;

  const system = `Eres el copiloto comercial dentro de VentasIA, un sistema de ventas para pequeñas y medianas empresas.
Hablas en español, tono profesional y cercano, como un gerente comercial que ayuda a ${opts.userName}.
Responde ÚNICAMENTE usando los datos reales que se te entregan a continuación entre <datos></datos>.
Nunca inventes clientes, cifras, productos, precios o políticas que no estén en esos datos.
Si los datos no alcanzan para responder algo, dilo explícitamente en vez de adivinar.
Sé breve, concreto y accionable. Usa listas cuando ayude a priorizar.`;

  const userMessage = `Pregunta del usuario: "${opts.userQuestion}"

<datos>
${opts.facts}
</datos>

${opts.extraInstructions ?? ""}`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 700,
      system,
      messages: [{ role: "user", content: userMessage }],
    });
    const textBlock = response.content.find((b) => b.type === "text");
    return textBlock && "text" in textBlock ? textBlock.text : null;
  } catch (err) {
    console.error("Claude API error:", err);
    return null;
  }
}
