import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth/guards";

const MAX_PROMPT_LENGTH = 4000;

export async function POST(request: Request) {
  try {
    // Bắt buộc đăng nhập để tránh lạm dụng quota/chi phí
    await requireUser();

    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Thiếu nội dung prompt" }, { status: 400 });
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        { error: `Prompt vượt quá ${MAX_PROMPT_LENGTH} ký tự` },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Chưa cấu hình GEMINI_API_KEY" }, { status: 500 });
    }

    const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
    const callGemini = () =>
      fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

    let response = await callGemini();

    // Thử lại tối đa 2 lần nếu Gemini đang quá tải (503)
    for (let attempt = 0; attempt < 2 && response.status === 503; attempt++) {
      await new Promise((r) => setTimeout(r, 1500));
      response = await callGemini();
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lỗi từ Gemini API:", errorText);
      return NextResponse.json({ error: "Gemini API trả về lỗi" }, { status: 502 });
    }

    const data = await response.json();
    const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      return NextResponse.json({ error: "Không nhận được nội dung từ Gemini" }, { status: 502 });
    }

    return NextResponse.json({ result: resultText });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Lỗi route /api/gemini:", error);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
