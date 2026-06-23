function getReservationSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error("予約一覧シートが見つかりません");
  }

  return sheet;
}

function getUserSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(USER_SHEET_NAME);

  if (!sheet) {
    throw new Error("ユーザー一覧シートが見つかりません");
  }

  return sheet;
}

function getAdminSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(ADMIN_SHEET_NAME);

  if (!sheet) {
    throw new Error("管理者一覧シートが見つかりません");
  }

  return sheet;
}

function getNowText_() {
  return Utilities.formatDate(
    new Date(),
    "Asia/Tokyo",
    "yyyy/MM/dd HH:mm:ss"
  );
}
