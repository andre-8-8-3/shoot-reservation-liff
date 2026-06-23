function getReservations_(userId) {
  const sheet = getReservationSheet_();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return [];
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 6).getDisplayValues();

  return values
    .filter(function(row) {
      return row[COL_DATE - 1] && row[COL_TIME - 1];
    })
    .map(function(row, index) {
      const name = row[COL_NAME - 1];
      const note = row[COL_NOTE - 1];
      const reservedUserId = row[COL_USER_ID - 1];

      const isReserved = Boolean(name);
      const isMine = isReserved && reservedUserId === userId;

      return {
        row: index + 2,
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

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const currentName = sheet.getRange(row, COL_NAME).getDisplayValue();

    if (currentName) {
      throw new Error("この枠はすでに予約済みです");
    }

    sheet.getRange(row, COL_NAME).setValue(body.name || "");
    sheet.getRange(row, COL_NOTE).setValue(body.note || "");
    sheet.getRange(row, COL_USER_ID).setValue(body.userId || "");
    sheet.getRange(row, COL_UPDATED_AT).setValue(getNowText_());

    return true;
  } finally {
    lock.releaseLock();
  }
}

function updateSlot_(body) {
  const sheet = getReservationSheet_();
  const row = Number(body.row);

  validateRow_(row);

  const reservedUserId = sheet.getRange(row, COL_USER_ID).getDisplayValue();

  if (reservedUserId !== body.userId) {
    throw new Error("自分の予約のみ変更できます");
  }

  sheet.getRange(row, COL_NOTE).setValue(body.note || "");
  sheet.getRange(row, COL_UPDATED_AT).setValue(getNowText_());

  return true;
}

function cancelSlot_(body) {
  const sheet = getReservationSheet_();
  const row = Number(body.row);

  validateRow_(row);

  const reservedUserId = sheet.getRange(row, COL_USER_ID).getDisplayValue();

  if (reservedUserId !== body.userId) {
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
}