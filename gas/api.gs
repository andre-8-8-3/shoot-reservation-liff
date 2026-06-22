const SPREADSHEET_ID = '186kZvgA83jXGzwRyxcMrQvs9g-GZocny2ftPdmALsQk';
const TASK_SHEET_NAME = 'TASK';

const LIFF_ALLOWED_DATES = ['2026/08/05', '2026/08/27'];

const LIFF_ALLOWED_TIMES = [
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00'
];

function doGet(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const action = String(params.action || '').trim();

    if (action === 'create') {
      const result = createShootReservationFromGet_(params);

      return createJsonResponse_({
        ok: true,
        result: result
      });
    }

    return createJsonResponse_({
      ok: true,
      message: 'Shoot reservation API is running.',
      usage: '?action=create&date=2026/08/05&time=13:00&name=とおる&note=テスト'
    });

  } catch (error) {
    return createJsonResponse_({
      ok: false,
      message: error.message
    });
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('送信データがありません。');
    }

    const payload = JSON.parse(e.postData.contents);
    const result = createShootReservation_(payload);

    return createJsonResponse_({
      ok: true,
      result: result
    });

  } catch (error) {
    return createJsonResponse_({
      ok: false,
      message: error.message
    });
  }
}

function createShootReservationFromGet_(params) {
  return createShootReservation_({
    date: params.date,
    time: params.time,
    name: params.name,
    note: params.note
  });
}

function createShootReservation_(payload) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    const date = String(payload.date || '').trim();
    const time = String(payload.time || '').trim();
    const name = String(payload.name || '').trim();
    const note = String(payload.note || '').trim();

    if (!date || !time || !name) {
      throw new Error('日付・時間・名前は必須です。');
    }

    if (!LIFF_ALLOWED_DATES.includes(date)) {
      throw new Error('予約対象外の日付です。');
    }

    if (!LIFF_ALLOWED_TIMES.includes(time)) {
      throw new Error('予約対象外の時間です。');
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(TASK_SHEET_NAME);

    if (!sheet) {
      throw new Error('TASKシートが見つかりません。');
    }

    const values = sheet.getDataRange().getValues();

    for (let i = 1; i < values.length; i++) {
      const rowDate = formatDateForCompare_(values[i][0]);
      const rowTime = formatTimeForCompare_(values[i][1]);
      const rowName = String(values[i][2] || '').trim();

      if (rowDate === date && rowTime === time && rowName) {
        throw new Error('この時間はすでに予約済みです。');
      }
    }

    const now = new Date();
    const reservationId = generateLiffReservationId_();

    sheet.appendRow([
      date,
      time,
      name,
      note,
      reservationId,
      '',
      '',
      now,
      now
    ]);

    return {
      reservationId: reservationId,
      date: date,
      time: time,
      name: name,
      note: note
    };

  } finally {
    lock.releaseLock();
  }
}

function createJsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function generateLiffReservationId_() {
  const now = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMddHHmmss');
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return 'L' + now + random;
}

function formatDateForCompare_(value) {
  if (!value) return '';

  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, 'Asia/Tokyo', 'yyyy/MM/dd');
  }

  return String(value).trim().replace(/-/g, '/');
}

function formatTimeForCompare_(value) {
  if (!value) return '';

  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, 'Asia/Tokyo', 'HH:mm');
  }

  return String(value).trim();
}
