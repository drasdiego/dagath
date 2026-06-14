const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

// Orçamento de raciocínio. -1 deixa o modelo decidir (dinâmico): perguntas
// simples respondem rápido, perguntas complexas ganham mais profundidade.
const THINKING_BUDGET = Number.parseInt(process.env.GEMINI_THINKING_BUDGET ?? "-1", 10);
const MAX_OUTPUT_TOKENS = Number.parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS ?? "2048", 10);

type GeminiResponse = {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
    finishReason?: string;
  }[];
  error?: { message?: string };
};

export async function generateText(
  prompt: string,
  systemInstruction: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada");
  }

  const contents = [
    {
      role: "user" as const,
      parts: [{ text: prompt }],
    },
  ];

  const response = await fetch(`${BASE_URL}/${MODEL}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    cache: "no-store",
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemInstruction }],
      },
      contents,
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        thinkingConfig: {
          thinkingBudget: THINKING_BUDGET,
        },
      },
    }),
  });

  const data = (await response.json()) as GeminiResponse;

  if (!response.ok) {
    throw new Error(`Gemini API: ${data.error?.message ?? response.status}`);
  }

  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini API: resposta vazia");
  }

  return text;
}

// Saída estruturada para etapas internas (ex.: extração de memória). Sem
// raciocínio e com baixa temperatura: rápido, barato e determinístico.
export async function generateJson<T>(
  prompt: string,
  systemInstruction: string
): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada");
  }

  const response = await fetch(`${BASE_URL}/${MODEL}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    cache: "no-store",
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [
        {
          role: "user" as const,
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    }),
  });

  const data = (await response.json()) as GeminiResponse;

  if (!response.ok) {
    throw new Error(`Gemini API: ${data.error?.message ?? response.status}`);
  }

  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini API: resposta vazia");
  }

  return JSON.parse(text) as T;
}
