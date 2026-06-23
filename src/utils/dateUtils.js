export function formatDate(dateText) {
  const [year, month, day] = dateText.split("/").map(Number);
  const date = new Date(year, month - 1, day);
  const week = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];

  return `${month}/${day}(${week})`;
}

export function groupByDate(slots) {
  return slots.reduce((acc, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = [];
    }

    acc[slot.date].push(slot);
    return acc;
  }, {});
}