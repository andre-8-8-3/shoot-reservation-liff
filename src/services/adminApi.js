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

  return postAdminAction("createSlots", payload, "予約枠の作成に失敗しました");
}

export async function deleteReservationSlots(payload) {
  if (!CONFIG.GAS_URL) {
    return {
      ok: true,
      result: {
        deletedCount: Array.isArray(payload.rows) ? payload.rows.length : 0,
        blockedCount: 0,
      },
      mock: true,
    };
  }

  return postAdminAction("deleteSlots", payload, "予約枠の削除に失敗しました");
}

async function postAdminAction(action, payload, fallbackMessage) {
  const res = await fetch(`${CONFIG.GAS_URL}?action=${encodeURIComponent(action)}`, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();

  if (!json.ok) {
    throw new Error(json.message || fallbackMessage || "管理操作に失敗しました");
  }

  return json;
}
