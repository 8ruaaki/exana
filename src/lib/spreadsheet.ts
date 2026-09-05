/**
 * Google Apps Script Webhook integration for spreadsheet logging.
 */

interface SpreadsheetRow {
  timestamp: string;
  nickname: string;
  problemTitle: string;
  weakness1: string;
  weakness2: string;
  weakness3: string;
  positives: string;
  improvements: string;
  practiceStatus: string;
}

export async function sendToSpreadsheet(data: SpreadsheetRow): Promise<boolean> {
  const webhookUrl = process.env.GAS_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log("[Spreadsheet] GAS_WEBHOOK_URL not configured. Logging data:");
    console.log(JSON.stringify(data, null, 2));
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error("[Spreadsheet] Webhook error:", response.status, response.statusText);
      return false;
    }

    console.log("[Spreadsheet] Data sent successfully.");
    return true;
  } catch (error) {
    console.error("[Spreadsheet] Error sending data:", error);
    return false;
  }
}

export function formatTimestamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const h = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${d} ${h}:${min}`;
}
