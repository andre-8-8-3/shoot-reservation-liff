function syncUser_(body) {
  const userId = String(body.userId || "").trim();
  const lineName = String(body.lineName || body.displayName || "").trim();

  if (!userId) {
    throw new Error("LINEユーザーIDが取得できません");
  }

  const sheet = getUserSheet_();
  const rowNumber = findUserRow_(userId);

  if (!rowNumber) {
    const nextRow = Math.max(sheet.getLastRow() + 1, 2);

    sheet.getRange(nextRow, USER_COL_ID).setValue(userId);
    sheet.getRange(nextRow, USER_COL_LINE_NAME).setValue(lineName);
    sheet.getRange(nextRow, USER_COL_CAST_NAME).setValue("");
    sheet.getRange(nextRow, USER_COL_REGISTERED_AT).setValue(getNowText_());

    return getUserProfile_(userId);
  }

  if (lineName) {
    sheet.getRange(rowNumber, USER_COL_LINE_NAME).setValue(lineName);
  }

  return getUserProfile_(userId);
}

function getUserProfile_(userId) {
  const normalizedUserId = String(userId || "").trim();

  if (!normalizedUserId) {
    return {
      userId: "",
      lineName: "",
      castName: "",
      displayName: ""
    };
  }

  const sheet = getUserSheet_();
  const rowNumber = findUserRow_(normalizedUserId);

  if (!rowNumber) {
    return {
      userId: normalizedUserId,
      lineName: "",
      castName: "",
      displayName: ""
    };
  }

  const row = sheet.getRange(rowNumber, 1, 1, 5).getDisplayValues()[0];
  const lineName = String(row[USER_COL_LINE_NAME - 1] || "").trim();
  const castName = String(row[USER_COL_CAST_NAME - 1] || "").trim();

  return {
    userId: normalizedUserId,
    lineName: lineName,
    castName: castName,
    displayName: castName || lineName
  };
}

function getCastName_(userId) {
  return getUserProfile_(userId).castName;
}

function getDisplayNameForReservation_(userId, fallbackName) {
  const profile = getUserProfile_(userId);
  const displayName = String(profile.displayName || "").trim();

  if (displayName) {
    return displayName;
  }

  return String(fallbackName || "").trim();
}

function findUserRow_(userId) {
  const normalizedUserId = String(userId || "").trim();

  if (!normalizedUserId) {
    return null;
  }

  const sheet = getUserSheet_();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return null;
  }

  const userIds = sheet.getRange(2, USER_COL_ID, lastRow - 1, 1).getDisplayValues();

  for (var i = 0; i < userIds.length; i++) {
    if (String(userIds[i][0] || "").trim() === normalizedUserId) {
      return i + 2;
    }
  }

  return null;
}
