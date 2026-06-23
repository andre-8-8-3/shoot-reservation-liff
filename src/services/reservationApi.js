import { CONFIG } from "../config/config";

let mockSlots = [
  { row: 2, date: "2026/07/01", time: "13:00", status: "available", note: "" },
  { row: 3, date: "2026/07/01", time: "14:00", status: "available", note: "" },
  { row: 4, date: "2026/07/01", time: "15:00", status: "reserved", note: "" },
  { row: 5, date: "2026/07/01", time: "16:00", status: "available", note: "" },
  { row: 6, date: "2026/07/01", time: "17:00", status: "available", note: "" },

  { row: 7, date: "2026/07/08", time: "13:00", status: "reserved", note: "" },
  { row: 8, date: "2026/07/08", time: "14:00", status: "available", note: "" },
  { row: 9, date: "2026/07/08", time: "15:00", status: "mine", note: "白衣装で撮影希望" },
  { row: 10, date: "2026/07/08", time: "16:00", status: "available", note: "" },
  { row: 11, date: "2026/07/08", time: "17:00", status: "available", note: "" },

  { row: 12, date: "2026/07/15", time: "13:00", status: "available", note: "" },
  { row: 13, date: "2026/07/15", time: "14:00", status: "available", note: "" },
  { row: 14, date: "2026/07/15", time: "15:00", status: "available", note: "" },
  { row: 15, date: "2026/07/15", time: "16:00", status: "reserved", note: "" },
  { row: 16, date: "2026/07/15", time: "17:00", status: "available", note: "" },

  { row: 17, date: "2026/08/05", time: "13:00", status: "available", note: "" },
  { row: 18, date: "2026/08/05", time: "14:00", status: "available", note: "" },
  { row: 19, date: "2026/08/05", time: "15:00", status: "available", note: "" },
  { row: 20, date: "2026/08/05", time: "16:00", status: "available", note: "" },
  { row: 21, date: "2026/08/05", time: "17:00", status: "available", note: "" },

  { row: 22, date: "2026/08/27", time: "13:00", status: "available", note: "" },
  { row: 23, date: "2026/08/27", time: "14:00", status: "reserved", note: "" },
  { row: 24, date: "2026/08/27", time: "15:00", status: "available", note: "" },
  { row: 25, date: "2026/08/27", time: "16:00", status: "available", note: "" },
  { row: 26, date: "2026/08/27", time: "17:00", status: "available", note: "" },
];

export async function fetchReservations(userId) {
  if (!CONFIG.GAS_URL) {
    return {
      ok: true,
      slots: mockSlots,
      mock: true,
    };
  }

  const url = `${CONFIG.GAS_URL}?action=list&userId=${encodeURIComponent(userId)}`;
  const res = await fetch(url);
  const json = await res.json();

  if (!json.ok) {
    throw new Error(json.message || "予約一覧の取得に失敗しました");
  }

  return json;
}

export async function reserveSlot(payload) {
  if (!CONFIG.GAS_URL) {
    mockSlots = mockSlots.map((slot) => {
      if (slot.row !== payload.row) return slot;

      return {
        ...slot,
        status: "mine",
        note: payload.note || "",
      };
    });

    return { ok: true, mock: true };
  }

  return postToGas("reserve", payload);
}

export async function updateSlot(payload) {
  if (!CONFIG.GAS_URL) {
    mockSlots = mockSlots.map((slot) => {
      if (slot.row !== payload.row) return slot;

      return {
        ...slot,
        note: payload.note || "",
      };
    });

    return { ok: true, mock: true };
  }

  return postToGas("update", payload);
}

export async function cancelSlot(payload) {
  if (!CONFIG.GAS_URL) {
    mockSlots = mockSlots.map((slot) => {
      if (slot.row !== payload.row) return slot;

      return {
        ...slot,
        status: "available",
        note: "",
      };
    });

    return { ok: true, mock: true };
  }

  return postToGas("cancel", payload);
}

async function postToGas(action, payload) {
  const res = await fetch(`${CONFIG.GAS_URL}?action=${encodeURIComponent(action)}`, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();

  if (!json.ok) {
    throw new Error(json.message || "処理に失敗しました");
  }

  return json;
}