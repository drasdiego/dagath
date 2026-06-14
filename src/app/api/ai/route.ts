import { NextResponse } from "next/server";
import { generateText } from "@/integrations/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const question = searchParams.get("q") ?? "Responda em uma frase: o que é platina no Warframe?";

  try {
    const answer = await generateText(
      question,
      "Você é o assistente da Dagath, uma plataforma de dados sobre Warframe. Responda em português do Brasil, em no máximo três frases, sem formatação."
    );
    return NextResponse.json({ model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash", answer });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 502 }
    );
  }
}