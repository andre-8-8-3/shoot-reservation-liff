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
