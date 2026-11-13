export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "POST") {
      const body = await request.json();

      if (body.method === "tools/list") {
        return Response.json({
          jsonrpc: "2.0",
          id: body.id,
          result: {
            tools: [
              {
                name: "ask_gemini",
                description: "إرسال سؤال إلى Google Gemini للحصول على إجابة.",
                inputSchema: {
                  type: "object",
                  properties: {
                    prompt: { type: "string", description: "السؤال المطلوب إرساله إلى Gemini" }
                  },
                  required: ["prompt"]
                }
              }
            ]
          }
        });
      }

      if (body.method === "tools/call" && body.params.name === "ask_gemini") {
        const prompt = body.params.arguments.prompt;
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          }
        );

        const data = await geminiRes.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "لم يتم استلام رد من Gemini.";

        return Response.json({
          jsonrpc: "2.0",
          id: body.id,
          result: { content: [{ type: "text", text: reply }] }
        });
      }

      if (body.method === "initialize") {
        return Response.json({
          jsonrpc: "2.0",
          id: body.id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {} },
            serverInfo: { name: "AI-Connectors", version: "1.0.0" }
          }
        });
      }
    }

    return new Response("AI-Connectors MCP Server is Running!", { status: 200 });
  }
};
