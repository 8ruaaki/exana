/**
 * Exana — Google Apps Script (Code.gs)
 * 
 * Exana アプリからの POST リクエストを受け取り、
 * スプレッドシートに学習ログを1行追加する Webhook スクリプト。
 * 
 * ===== デプロイ手順 =====
 * 
 * 1. Google スプレッドシートを新規作成する
 *    - シート名はデフォルトの「シート1」のままでOK
 *    - 1行目にヘッダーを入力：
 *      A1: 記録日時
 *      B1: ニックネーム
 *      C1: 対象問題名
 *      D1: 不足している力①
 *      E1: 不足している力②
 *      F1: 不足している力③
 *      G1: よい点（保護者向け）
 *      H1: 改善点（保護者向け）
 *      I1: 再現演習ステータス
 * 
 * 2. 「拡張機能」→「Apps Script」を開く
 * 
 * 3. Code.gs に以下のコードを貼り付けて保存
 * 
 * 4. 「デプロイ」→「新しいデプロイ」
 *    - 種類: 「ウェブアプリ」
 *    - 実行するユーザー: 「自分」
 *    - アクセスできるユーザー: 「全員」
 *    - 「デプロイ」をクリック
 * 
 * 5. 表示されたウェブアプリの URL をコピー
 * 
 * 6. Exana の .env.local に設定：
 *    GAS_WEBHOOK_URL=https://script.google.com/macros/s/xxxxx/exec
 */

// ===== メイン処理 =====

/**
 * POST リクエストを受け取り、スプレッドシートに1行追加する
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // データを1行追加
    sheet.appendRow([
      data.timestamp       || "",   // A: 記録日時
      data.nickname        || "",   // B: ニックネーム
      data.problemTitle    || "",   // C: 対象問題名
      data.weakness1       || "",   // D: 不足している力①
      data.weakness2       || "",   // E: 不足している力②
      data.weakness3       || "",   // F: 不足している力③
      data.positives       || "",   // G: よい点（保護者向け）
      data.improvements    || "",   // H: 改善点（保護者向け）
      data.practiceStatus  || "",   // I: 再現演習ステータス
    ]);
    
    // 成功レスポンス
    return ContentService
      .createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // エラーレスポンス
    return ContentService
      .createTextOutput(JSON.stringify({ 
        status: "error", 
        message: error.message 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * GET リクエスト（動作確認用）
 */
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ 
      status: "ok", 
      message: "Exana Webhook is running" 
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
