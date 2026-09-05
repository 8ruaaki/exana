import { NextRequest, NextResponse } from "next/server";
import { sendToSpreadsheet, formatTimestamp } from "@/lib/spreadsheet";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const data = {
      timestamp: formatTimestamp(),
      nickname: body.nickname || "",
      problemTitle: body.problemTitle || "",
      weakness1: body.weakness1 || "",
      weakness2: body.weakness2 || "",
      weakness3: body.weakness3 || "",
      positives: body.positives || "",
      improvements: body.improvements || "",
      practiceStatus: body.practiceStatus || "",
    };

    const success = await sendToSpreadsheet(data);

    return NextResponse.json({
      success,
      message: success
        ? "スプレッドシートに記録しました"
        : "GAS_WEBHOOK_URLが未設定のため、ログ出力のみ行いました",
    });
  } catch (error) {
    console.error("[Spreadsheet API] Error:", error);
    return NextResponse.json(
      { error: "Spreadsheet recording failed" },
      { status: 500 }
    );
  }
}
