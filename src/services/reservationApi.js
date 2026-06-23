import { CONFIG } from "../config/config";

const dates = ["2026/07/01", "2026/07/08", "2026/07/15", "2026/08/05", "2026/08/27"];
const times = ["13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"];

let mockSlots = dates.flatMap((date, dateIndex) => {
  return times.map((time, timeIndex) => {
    const row = 2 + dateIndex * times.length + timeIndex;

    if (date === "2026/07/01" && time === "13:00") {
      return {
        row,
        date,
        time,
        status: "mine",
        note: "白衣装で撮影希望",
      };
    }

    return {
      row,
      date,
      time,
      status: "available",
      note: "",
    };
  });
});

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
    const sourceSlot = mockSlots.find((slot) => slot.row === payload.row);
    const targetRow = Number(payload.targetRow || payload.row);

    if (!sourceSlot) {
      throw new Error("変更元の予約が見つかりません");
    }

    mockSlots = mockSlots.map((slot) => {
      if (payload.row === targetRow && slot.row === payload.row) {
        return {
          ...slot,
          note: payload.note || "",
        };
      }

      if (slot.row === payload.row) {
        return {
          ...slot,
          status: "available",
          note: "",
        };
      }

      if (slot.row === targetRow) {
        return {
          ...slot,
          status: "mine",
          note: payload.note || "",
        };
      }

      return slot;
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
