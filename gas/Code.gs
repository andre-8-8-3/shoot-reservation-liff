function doGet(e) {
  try {
    const action = e.parameter.action;

    if (action === "list") {
      const userId = e.parameter.userId || "";

      return jsonOutput_({
        ok: true,
        slots: getReservations_(userId)
      });
    }

    return jsonOutput_({
      ok: false,
      message: "未対応のactionです"
    });
  } catch (error) {
    return jsonOutput_({
      ok: false,
      message: error.message
    });
  }
}

function doPost(e) {
  try {
    const action = e.parameter.action;
    const body = JSON.parse(e.postData.contents || "{}");

    if (action === "reserve") {
      reserveSlot_(body);

      return jsonOutput_({
        ok: true
      });
    }

    if (action === "update") {
      updateSlot_(body);

      return jsonOutput_({
        ok: true
      });
    }

    if (action === "cancel") {
      cancelSlot_(body);

      return jsonOutput_({
        ok: true
      });
    }

    return jsonOutput_({
      ok: false,
      message: "未対応のactionです"
    });
  } catch (error) {
    return jsonOutput_({
      ok: false,
      message: error.message
    });
  }
}

function jsonOutput_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}