export function getSlotView(slot) {
  if (slot.status === "available") {
    return {
      className: "available",
      meta: "予約できます",
      button: "予約",
      disabled: false,
    };
  }

  if (slot.status === "mine") {
    return {
      className: "mine",
      meta: "あなたの予約",
      button: "変更",
      disabled: false,
    };
  }

  return {
    className: "reserved",
    meta: "予約済み",
    button: "予約済",
    disabled: true,
  };
}

export function filterSlots(slots, filter) {
  return slots.filter((slot) => {
    if (filter === "available") {
      return slot.status === "available";
    }

    if (filter === "mine") {
      return slot.status === "mine";
    }

    if (filter === "july") {
      return slot.date.startsWith("2026/07");
    }

    if (filter === "august") {
      return slot.date.startsWith("2026/08");
    }

    return true;
  });
}
