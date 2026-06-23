function getReservations_(userId) {
  const sheet = getReservationSheet_();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return [];
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 6).getDisplayValues();

  return values
    .map(function(row, index) {
      return {
        rowNumber: index + 2,
        row: index + 2,
        values: row
      };
    })
    .filter(function(item) {
      const row = item.values;
      return row[COL_DATE - 1] && row[COL_TIME - 1];
    })
    .map(function(item) {
      const row = item.values;

      const name = String(row[COL_NAME - 1] || "").trim();
      const note = String(row[COL_NOTE - 1] || "").trim();
      const reservedUserId = String(row[COL_USER_ID - 1] || "").trim();

      const isReserved = Boolean(name);
      const isMine = isReserved && reservedUserId === userId;

      return {
        row: item.row,
        date: row[COL_DATE - 1],
        time: row[COL_TIME - 1],
        status: !isReserved ? "available" : isMine ? "mine" : "reserved",
        note: isMine ? note : ""
      };
    });
}

function reserveSlot_(body) {
  const sheet = getReservationSheet_();
  const row = Number(body.row);

  validateRow_(row);

  const userId = String(body.userId || "").trim();
  const name = String(body.name || "").trim();
  const note = String(body.note || "").trim();

  if (!userId) {
    throw new Error("LINEユーザーIDが取得できません");
  }

  if (!name) {
    throw new Error("名前が取得できません");
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const currentName = String(sheet.getRange(row, COL_NAME).getDisplayValue() || "").trim();

    if (currentName) {
      throw new Error("この枠はすでに予約済みです");
    }

    sheet.getRange(row, COL_NAME).setValue(name);
    sheet.getRange(row, COL_NOTE).setValue(note);
    sheet.getRange(row, COL_USER_ID).setValue(userId);
    sheet.getRange(row, COL_UPDATED_AT).setValue(getNowText_());

    return true;
  } finally {
    lock.releaseLock();
  }
}

function updateSlot_(body) {
  const sheet = getReservationSheet_();
  const row = Number(body.row);
  const targetRow = Number(body.targetRow || body.row);

  validateRow_(row);
  validateRow_(targetRow);

  const userId = String(body.userId || "").trim();
  const note = String(body.note || "").trim();

  if (!userId) {
    throw new Error("LINEユーザーIDが取得できません");
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const reservedUserId = String(sheet.getRange(row, COL_USER_ID).getDisplayValue() || "").trim();

    if (reservedUserId !== userId) {
      throw new Error("自分の予約のみ変更できます");
    }

    const currentName = String(sheet.getRange(row, COL_NAME).getDisplayValue() || "").trim();

    if (!currentName) {
      throw new Error("変更元の予約が見つかりません");
    }

    if (row === targetRow) {
      sheet.getRange(row, COL_NOTE).setValue(note);
      sheet.getRange(row, COL_UPDATED_AT).setValue(getNowText_());
      return true;
    }

    const targetName = String(sheet.getRange(targetRow, COL_NAME).getDisplayValue() || "").trim();

    if (targetName) {
      throw new Error("変更先の枠はすでに予約済みです");
    }

    sheet.getRange(targetRow, COL_NAME).setValue(currentName);
    sheet.getRange(targetRow, COL_NOTE).setValue(note);
    sheet.getRange(targetRow, COL_USER_ID).setValue(userId);
    sheet.getRange(targetRow, COL_UPDATED_AT).setValue(getNowText_());

    sheet.getRange(row, COL_NAME).clearContent();
    sheet.getRange(row, COL_NOTE).clearContent();
    sheet.getRange(row, COL_USER_ID).clearContent();
    sheet.getRange(row, COL_UPDATED_AT).setValue(getNowText_());

    return true;
  } finally {
    lock.releaseLock();
  }
}

function cancelSlot_(body) {
  const sheet = getReservationSheet_();
  const row = Number(body.row);

  validateRow_(row);

  const userId = String(body.userId || "").trim();

  if (!userId) {
    throw new Error("LINEユーザーIDが取得できません");
  }

  const reservedUserId = String(sheet.getRange(row, COL_USER_ID).getDisplayValue() || "").trim();

  if (reservedUserId !== userId) {
    throw new Error("自分の予約のみキャンセルできます");
  }

  sheet.getRange(row, COL_NAME).clearContent();
  sheet.getRange(row, COL_NOTE).clearContent();
  sheet.getRange(row, COL_USER_ID).clearContent();
  sheet.getRange(row, COL_UPDATED_AT).setValue(getNowText_());

  return true;
}

function validateRow_(row) {
  if (!row || row < 2) {
    throw new Error("不正な行番号です");
  }

  const sheet = getReservationSheet_();
  const lastRow = sheet.getLastRow();

  if (row > lastRow) {
    throw new Error("存在しない予約枠です");
  }
}
