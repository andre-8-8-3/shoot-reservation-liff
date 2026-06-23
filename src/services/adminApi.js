import { CONFIG } from "../config/config";

export async function createReservationSlots(payload) {
  if (!CONFIG.GAS_URL) {
    return {
      ok: true,
      result: {
        createdCount: 9,
        skippedCount: 0,
      },
      mock: true,
    };
  }

  const res = await fetch(`${CONFIG.GAS_URL}?action=createSlots`, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();

  if (!json.ok) {
    throw new Error(json.message || "予約枠の作成に失敗しました");
  }

  return json;
}
