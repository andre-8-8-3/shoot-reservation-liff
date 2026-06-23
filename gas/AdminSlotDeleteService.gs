function deleteReservationSlots_(body) {
  const adminUserId = String(body.adminUserId || "").trim();
  const rows = Array.isArray(body.rows) ? body.rows.map(Number) : [];

  assertAdmin_(adminUserId);

  if (rows.length === 0) {
    throw new Error("削除する予約枠を選択してください");
  }

  const uniqueRows = rows
    .filter(function(row) {
      return row && row >= 2;
    })
    .filter(function(row, index, array) {
      return array.indexOf(row) === index;
    })
    .sort(function(a, b) {
      return b - a;
    });

  if (uniqueRows.length === 0) {
    throw new Error("削除対象の行番号が正しくありません");
  }

  const sheet = getReservationSheet_();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const lastRow = sheet.getLastRow();
    const deletedRows = [];
    const blockedRows = [];

    uniqueRows.forEach(function(rowNumber) {
      if (rowNumber > lastRow) {
        blockedRows.push({ row: rowNumber, reason: "対象行が存在しません" });
        return;
      }

      const row = sheet.getRange(rowNumber, 1, 1, 6).getDisplayValues()[0];
      const name = String(row[COL_NAME - 1] || "").trim();
      const userId = String(row[COL_USER_ID - 1] || "").trim();
      const date = String(row[COL_DATE - 1] || "").trim();
      const time = String(row[COL_TIME - 1] || "").trim();

      if (name || userId) {
        blockedRows.push({ row: rowNumber, date: date, time: time, reason: "予約済みのため削除できません" });
        return;
      }

      sheet.deleteRow(rowNumber);
      deletedRows.push({ row: rowNumber, date: date, time: time });
    });

    return {
      deletedCount: deletedRows.length,
      blockedCount: blockedRows.length,
      deletedRows: deletedRows,
      blockedRows: blockedRows
    };
  } finally {
    lock.releaseLock();
  }
}
