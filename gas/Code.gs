function doGet(e) {
  try {
    const action = e.parameter.action;

    if (action === "list") {
      const userId = e.parameter.userId || "";

      return jsonOutput_({
        ok: true,
        slots: getReservations_(userId),
        user: getUserProfile_(userId)
      });
    }

    if (action === "profile") {
      const userId = e.parameter.userId || "";

      return jsonOutput_({
        ok: true,
        user: getUserProfile_(userId),
        isAdmin: isAdmin_(userId)
      });
    }

    if (action === "adminSummary") {
      const userId = e.parameter.userId || "";

      return jsonOutput_({
        ok: true,
        summary: getAdminSummary_(userId)
      });
    }

    if (action === "adminUsers") {
      const userId = e.parameter.userId || "";

      return jsonOutput_({
        ok: true,
        users: getAdminUsers_(userId)
      });
    }

    if (action === "adminReservations") {
      const userId = e.parameter.userId || "";

      return jsonOutput_({
        ok: true,
        reservations: getAdminReservations_(userId)
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

    if (action === "syncUser") {
      const user = syncUser_(body);

      return jsonOutput_({
        ok: true,
        user: user,
        isAdmin: isAdmin_(user.userId)
      });
    }

    if (action === "updateCastName") {
      const user = updateCastName_(body);

      return jsonOutput_({
        ok: true,
        user: user
      });
    }

    if (action === "createSlots") {
      const result = createReservationSlots_(body);

      return jsonOutput_({
        ok: true,
        result: result
      });
    }

    if (action === "deleteSlots") {
      const result = deleteReservationSlots_(body);

      return jsonOutput_({
        ok: true,
        result: result
      });
    }

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
