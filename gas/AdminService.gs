function isAdmin_(userId) {
  const normalizedUserId = String(userId || "").trim();

  if (!normalizedUserId) {
    return false;
  }

  const sheet = getAdminSheet_();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return false;
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 4).getDisplayValues();

  return values.some(function(row) {
    const adminUserId = String(row[ADMIN_COL_USER_ID - 1] || "").trim();
    const role = String(row[ADMIN_COL_ROLE - 1] || "").trim().toLowerCase();

    return adminUserId === normalizedUserId && role === "admin";
  });
}

function assertAdmin_(userId) {
  if (!isAdmin_(userId)) {
    throw new Error("管理者権限がありません");
  }
}

function getAdminSummary_(userId) {
  assertAdmin_(userId);

  const reservations = getAdminReservations_(userId);
  const users = getAdminUsers_(userId);

  const reservedCount = reservations.filter(function(slot) {
    return slot.status === "reserved";
  }).length;

  const availableCount = reservations.filter(function(slot) {
    return slot.status === "available";
  }).length;

  return {
    userCount: users.length,
    reservedCount: reservedCount,
    availableCount: availableCount,
    totalSlots: reservations.length
  };
}

function getAdminUsers_(userId) {
  assertAdmin_(userId);

  const sheet = getUserSheet_();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return [];
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 5).getDisplayValues();

  return values
    .map(function(row, index) {
      const lineUserId = String(row[USER_COL_ID - 1] || "").trim();
      const lineName = String(row[USER_COL_LINE_NAME - 1] || "").trim();
      const castName = String(row[USER_COL_CAST_NAME - 1] || "").trim();

      return {
        row: index + 2,
        userId: lineUserId,
        lineName: lineName,
        castName: castName,
        displayName: castName || lineName,
        registeredAt: String(row[USER_COL_REGISTERED_AT - 1] || "").trim(),
        memo: String(row[USER_COL_MEMO - 1] || "").trim()
      };
    })
    .filter(function(user) {
      return user.userId;
    });
}

function updateCastName_(body) {
  const adminUserId = String(body.adminUserId || "").trim();
  const targetUserId = String(body.userId || "").trim();
  const castName = String(body.castName || "").trim();

  assertAdmin_(adminUserId);

  if (!targetUserId) {
    throw new Error("更新対象のLINEユーザーIDがありません");
  }

  const rowNumber = findUserRow_(targetUserId);

  if (!rowNumber) {
    throw new Error("対象ユーザーが見つかりません");
  }

  const sheet = getUserSheet_();
  sheet.getRange(rowNumber, USER_COL_CAST_NAME).setValue(castName);

  return getUserProfile_(targetUserId);
}

function getAdminReservations_(userId) {
  assertAdmin_(userId);

  const sheet = getReservationSheet_();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return [];
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 6).getDisplayValues();

  return values
    .map(function(row, index) {
      const name = String(row[COL_NAME - 1] || "").trim();
      const reservedUserId = String(row[COL_USER_ID - 1] || "").trim();
      const userProfile = reservedUserId ? getUserProfile_(reservedUserId) : null;
      const displayName = userProfile && userProfile.displayName ? userProfile.displayName : name;

      return {
        row: index + 2,
        date: row[COL_DATE - 1],
        time: row[COL_TIME - 1],
        name: displayName,
        originalName: name,
        note: row[COL_NOTE - 1],
        userId: reservedUserId,
        updatedAt: row[COL_UPDATED_AT - 1],
        status: name ? "reserved" : "available"
      };
    })
    .filter(function(slot) {
      return slot.date && slot.time;
    });
}

function createReservationSlots_(body) {
  const adminUserId = String(body.adminUserId || "").trim();
  const date = normalizeDateText_(body.date);
  const startTime = normalizeTimeText_(body.startTime || "13:00");
  const endTime = normalizeTimeText_(body.endTime || "17:00");
  const intervalMinutes = Number(body.intervalMinutes || 30);

  assertAdmin_(adminUserId);

  if (!date) {
    throw new Error("日付を入力してください");
  }

  if (!startTime || !endTime) {
    throw new Error("開始時間と終了時間を入力してください");
  }

  if (!intervalMinutes || intervalMinutes < 5 || intervalMinutes > 180) {
    throw new Error("間隔は5分以上180分以下で指定してください");
  }

  const startMinutes = timeToMinutes_(startTime);
  const endMinutes = timeToMinutes_(endTime);

  if (startMinutes > endMinutes) {
    throw new Error("開始時間は終了時間より前にしてください");
  }

  const sheet = getReservationSheet_();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const lastRow = sheet.getLastRow();
    const existingKeys = {};

    if (lastRow >= 2) {
      const existingValues = sheet.getRange(2, 1, lastRow - 1, 2).getDisplayValues();
      existingValues.forEach(function(row) {
        const existingDate = String(row[0] || "").trim();
        const existingTime = normalizeTimeText_(row[1]);

        if (existingDate && existingTime) {
          existingKeys[existingDate + "__" + existingTime] = true;
        }
      });
    }

    const rowsToAppend = [];
    const skippedSlots = [];

    for (var minutes = startMinutes; minutes <= endMinutes; minutes += intervalMinutes) {
      const time = minutesToTimeText_(minutes);
      const key = date + "__" + time;

      if (existingKeys[key]) {
        skippedSlots.push({ date: date, time: time });
        continue;
      }

      rowsToAppend.push([date, time, "", "", "", ""]);
    }

    if (rowsToAppend.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAppend.length, 6).setValues(rowsToAppend);
    }

    return {
      createdCount: rowsToAppend.length,
      skippedCount: skippedSlots.length,
      createdSlots: rowsToAppend.map(function(row) {
        return { date: row[0], time: row[1] };
      }),
      skippedSlots: skippedSlots
    };
  } finally {
    lock.releaseLock();
  }
}

function normalizeDateText_(value) {
  const text = String(value || "").trim();

  if (!text) {
    return "";
  }

  const normalized = text.replace(/-/g, "/");
  const parts = normalized.split("/");

  if (parts.length !== 3) {
    throw new Error("日付は yyyy/MM/dd 形式で入力してください");
  }

  const year = parts[0];
  const month = ("0" + Number(parts[1])).slice(-2);
  const day = ("0" + Number(parts[2])).slice(-2);

  if (!year || month === "00" || day === "00") {
    throw new Error("日付の形式が正しくありません");
  }

  return year + "/" + month + "/" + day;
}

function normalizeTimeText_(value) {
  const text = String(value || "").trim();

  if (!text) {
    return "";
  }

  const parts = text.split(":");

  if (parts.length < 2) {
    throw new Error("時間は HH:mm 形式で入力してください");
  }

  const hour = Number(parts[0]);
  const minute = Number(parts[1]);

  if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error("時間の形式が正しくありません");
  }

  return ("0" + hour).slice(-2) + ":" + ("0" + minute).slice(-2);
}

function timeToMinutes_(timeText) {
  const normalized = normalizeTimeText_(timeText);
  const parts = normalized.split(":");
  return Number(parts[0]) * 60 + Number(parts[1]);
}

function minutesToTimeText_(minutes) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return ("0" + hour).slice(-2) + ":" + ("0" + minute).slice(-2);
}
