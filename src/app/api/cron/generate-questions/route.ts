import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  // 1. Bắt buộc secret để không ai trigger được cron từ bên ngoài
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization") || "";
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Kiểm tra env bên trong handler (không crash lúc build)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  try {
    // Bảng questions hiện chưa có trong generated types -> dùng client chưa định kiểu.
    const supabase = (await createAdminClient()) as unknown as SupabaseClient;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // 3. Kiểm tra hôm nay đã có đủ câu hỏi chưa
    const { data: existingQuestions, error: existingError } = await supabase
      .from("questions")
      .select("id")
      .eq("target_date", today);

    if (existingError) {
      // Bảng questions có thể chưa tồn tại -> báo rõ thay vì chạy tiếp
      return NextResponse.json(
        { error: `Không đọc được bảng questions: ${existingError.message}` },
        { status: 500 }
      );
    }

    if (existingQuestions && existingQuestions.length >= 10) {
      return NextResponse.json({
        message: `Hôm nay (${today}) đã có đủ câu hỏi trong hệ thống.`,
      });
    }

    // 4. Sinh 20 câu hỏi mới
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite" });
    const prompt = `
      Hãy tạo 20 câu hỏi trắc nghiệm kiến thức tổng hợp/mới nhất bằng tiếng Việt.
      Định dạng kết quả trả về BẮT BUỘC là 1 mảng JSON thuần (không chứa markdown triple backticks \`\`\`json), mỗi phần tử có cấu trúc:
      [
        {
          "question": "Nội dung câu hỏi?",
          "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
          "answer": 0
        }
      ]
    `;

    // Gemini có thể trả 503 khi quá tải -> thử lại vài lần
    let result: Awaited<ReturnType<typeof model.generateContent>> | undefined;
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        result = await model.generateContent(prompt);
        break;
      } catch (e) {
        const status = (e as { status?: number })?.status;
        if (status === 503 && attempt < 4) {
          console.warn(`Gemini quá tải (503), thử lại lần ${attempt + 1}...`);
          await new Promise((r) => setTimeout(r, attempt * 2000));
          continue;
        }
        throw e;
      }
    }

    if (!result) throw new Error("Không thể sinh câu hỏi từ Gemini (quá tải).");

    const responseText = result.response.text().trim();
    // Bỏ markdown fence và trích đúng mảng JSON đầu tiên (model đôi khi kèm văn bản/ký tự thừa)
    const withoutFence = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const start = withoutFence.indexOf("[");
    const end = withoutFence.lastIndexOf("]");
    const jsonSlice =
      start >= 0 && end > start ? withoutFence.slice(start, end + 1) : withoutFence;
    const questionsData = JSON.parse(jsonSlice);

    const insertData = questionsData.map((q: { question: string; options: string[]; answer: number }) => ({
      question: q.question,
      options: q.options,
      answer: q.answer,
      target_date: today,
    }));

    const { error: insertError } = await supabase.from("questions").insert(insertData);
    if (insertError) {
      throw new Error(`Lỗi lưu câu hỏi: ${insertError.message}`);
    }

    // 5. Dọn câu hỏi cũ hơn 30 ngày
    const { error: cleanupError } = await supabase.rpc("delete_old_questions");
    if (cleanupError) {
      console.warn("Lưu ý - Lỗi dọn dẹp câu hỏi cũ:", cleanupError.message);
    }

    return NextResponse.json({
      success: true,
      message: `Đã tự động tạo thành công ${insertData.length} câu hỏi mới cho ngày ${today} và tự động dọn dẹp các câu hỏi cũ hơn 30 ngày!`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Lỗi Cron Job:", error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
