const ALLOWED_MODELS = new Set([
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b"
]);

const SYSTEM_PROMPTS = {
  generate: `Eres DANverse ScriptForge, un asistente experto en Luau y desarrollo de experiencias de Roblox. Responde en español claro. Produce código legible, con comentarios útiles, validación de argumentos y ubicación recomendada. Distingue Roblox Studio estándar de entornos de ejecución de terceros; nunca inventes APIs de Delta y avisa que sus capacidades varían por versión. Ayuda con scripts para experiencias propias y pruebas autorizadas. No ayudes a evadir anticheat, robar cuentas/datos, explotar juegos ajenos, duplicar objetos de pago ni eludir controles de acceso. Si una solicitud cruza esos límites, ofrece una alternativa segura para un juego propio.`,
  repair: `Eres el reparador de código Luau de DANverse ScriptForge. Responde en español. Analiza el código que te proporciona el usuario, separa errores probables de confirmados y entrega una versión corregida cuando sea posible. No digas que ejecutaste o probaste el código. Conserva el objetivo legítimo del script y señala APIs o dependencias que deban verificarse. No ayudes a evadir anticheat ni a explotar juegos ajenos.`,
  compat: `Eres el analizador de compatibilidad de DANverse ScriptForge. Responde en español. Revisa sintaxis aparente, servicios, APIs, dependencias, contexto probable (Script, LocalScript o ModuleScript), ubicación recomendada y riesgos. No afirmes compatibilidad real sin ejecutar el código en el entorno. Las APIs de ejecutores de terceros pueden cambiar y no deben darse por garantizadas. No ayudes a evadir anticheat ni a explotar juegos ajenos.`
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  if (url.pathname !== "/api/chat") return json({ error: "Ruta no encontrada" }, 404);
  if (!env.GROQ_API_KEY) {
    return json({ error: "Falta configurar el secreto GROQ_API_KEY en Cloudflare Pages." }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "El cuerpo debe ser JSON válido." }, 400);
  }

  const mode = String(body.mode || "generate");
  const text = String(body.text || "").trim();
  const modelRequested = String(body.model || "openai/gpt-oss-20b");
  const model = ALLOWED_MODELS.has(modelRequested) ? modelRequested : "openai/gpt-oss-20b";

  if (!SYSTEM_PROMPTS[mode]) return json({ error: "Modo no válido." }, 400);
  if (!text) return json({ error: "Escribe una solicitud o pega código." }, 400);
  if (text.length > 24000) return json({ error: "El texto supera el límite de 24 000 caracteres." }, 413);

  try {
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPTS[mode] },
          { role: "user", content: text }
        ],
        temperature: 0.25,
        max_completion_tokens: 6000
      })
    });

    const result = await groqResponse.json().catch(() => ({}));
    if (!groqResponse.ok) {
      const message = result?.error?.message || `Groq devolvió HTTP ${groqResponse.status}.`;
      return json({ error: message }, groqResponse.status === 429 ? 429 : 502);
    }

    const answer = result?.choices?.[0]?.message?.content;
    if (!answer) return json({ error: "Groq no devolvió contenido." }, 502);
    return json({ answer, model: result.model || model });
  } catch {
    return json({ error: "No se pudo conectar con Groq. Comprueba la conexión e inténtalo otra vez." }, 502);
  }
}
