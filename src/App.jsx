import { useEffect, useMemo, useState } from "react";
import { initLiffProfile } from "./services/liffService";
import {
  fetchReservations,
  reserveSlot,
  updateSlot,
  cancelSlot,
} from "./services/reservationApi";
import { formatDate, groupByDate } from "./utils/dateUtils";
import { filterSlots, getSlotView } from "./utils/reservationUtils";

export default function App() {
  const [user, setUser] = useState(null);
  const [slots, setSlots] = useState([]);
  const [filter, setFilter] = useState("all");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [modalMode, setModalMode] = useState("reserve");
  const [note, setNote] = useState("");
  const [moveRow, setMoveRow] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const summary = useMemo(() => {
    return {
      total: slots.length,
      available: slots.filter((slot) => slot.status === "available").length,
      mine: slots.filter((slot) => slot.status === "mine").length,
    };
  }, [slots]);

  const mySlots = useMemo(() => {
    return slots.filter((slot) => slot.status === "mine");
  }, [slots]);

  const filteredSlots = useMemo(() => {
    return filterSlots(slots, filter);
  }, [slots, filter]);

  const groupedSlots = useMemo(() => {
    return groupByDate(filteredSlots);
  }, [filteredSlots]);

  const moveCandidates = useMemo(() => {
    if (!selectedSlot) return [];

    return slots.filter((slot) => {
      return slot.status === "available" || slot.row === selectedSlot.row;
    });
  }, [selectedSlot, slots]);

  useEffect(() => {
    initialize();
  }, []);

  async function initialize() {
    try {
      setLoading(true);

      const profile = await initLiffProfile();

      if (!profile) {
        return;
      }

      setUser(profile);

      const result = await fetchReservations(profile.userId);
      setSlots(result.slots);
    } catch (error) {
      console.error(error);
      showToast(error.message || "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function reloadSlots() {
    if (!user) return;

    try {
      setLoading(true);

      const result = await fetchReservations(user.userId);
      setSlots(result.slots);

      showToast("最新の予約状況に更新しました");
    } catch (error) {
      console.error(error);
      showToast(error.message || "更新に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  function openSlot(slot) {
    if (slot.status === "reserved") {
      showToast("この枠は予約済みです");
      return;
    }

    setSelectedSlot(slot);
    setNote(slot.note || "");
    setMoveRow(String(slot.row));

    if (slot.status === "mine") {
      setModalMode("edit");
    } else {
      setModalMode("reserve");
    }
  }

  function closeModal() {
    setSelectedSlot(null);
    setNote("");
    setMoveRow("");
    setModalMode("reserve");
  }

  async function handleReserve() {
    if (!selectedSlot || !user) return;

    try {
      setLoading(true);

      await reserveSlot({
        row: selectedSlot.row,
        userId: user.userId,
        name: user.displayName,
        note: note.trim(),
      });

      await reloadSlots();
      closeModal();
      showToast("予約しました");
    } catch (error) {
      console.error(error);
      showToast(error.message || "予約に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate() {
    if (!selectedSlot || !user) return;

    try {
      setLoading(true);

      await updateSlot({
        row: selectedSlot.row,
        targetRow: Number(moveRow || selectedSlot.row),
        userId: user.userId,
        note: note.trim(),
      });

      await reloadSlots();
      closeModal();
      showToast("予約内容を変更しました");
    } catch (error) {
      console.error(error);
      showToast(error.message || "変更に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!selectedSlot || !user) return;

    const ok = window.confirm("この予約をキャンセルしますか？");

    if (!ok) return;

    try {
      setLoading(true);

      await cancelSlot({
        row: selectedSlot.row,
        userId: user.userId,
      });

      await reloadSlots();
      closeModal();
      showToast("予約をキャンセルしました");
    } catch (error) {
      console.error(error);
      showToast(error.message || "キャンセルに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  function showToast(message) {
    setToast(message);

    setTimeout(() => {
      setToast("");
    }, 2200);
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>撮影予約</h1>
          <p>
            空いている時間を選んで予約してください。<br />
            予約後はオフィスで撮影を行います。
          </p>
        </div>

        <div className="user-badge">
          {user ? `${user.displayName} さん` : "読み込み中"}
        </div>
      </header>

      <main className="content">
        <section className="summary">
          <div>
            <strong>{summary.total}</strong>
            <span>全枠</span>
          </div>
          <div>
            <strong>{summary.available}</strong>
            <span>空き枠</span>
          </div>
          <div>
            <strong>{summary.mine}</strong>
            <span>自分の予約</span>
          </div>
        </section>

        <section className="notice">
          <strong>予約ルール</strong>
          <p>
            緑の枠は予約できます。赤の枠は予約済みです。他キャスト名は表示されません。
          </p>
        </section>

        <div className="tabs">
          <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
            すべて
          </button>
          <button className={filter === "available" ? "active" : ""} onClick={() => setFilter("available")}>
            空き枠のみ
          </button>
          <button className={filter === "mine" ? "active" : ""} onClick={() => setFilter("mine")}>
            自分の予約
          </button>
          <button className={filter === "july" ? "active" : ""} onClick={() => setFilter("july")}>
            7月
          </button>
          <button className={filter === "august" ? "active" : ""} onClick={() => setFilter("august")}>
            8月
          </button>
        </div>

        {mySlots.length > 0 && (
          <section className="my-box">
            <div className="my-box-title">
              <span>あなたの予約</span>
              <span>{mySlots.length}件</span>
            </div>

            <div className="my-box-body">
              {mySlots.map((slot) => (
                <div key={slot.row} className="my-reservation-item">
                  {formatDate(slot.date)}　{slot.time}
                  {slot.note && <div className="note">備考：{slot.note}</div>}
                </div>
              ))}
            </div>
          </section>
        )}

        {filteredSlots.length === 0 ? (
          <div className="empty">
            表示できる予約枠がありません。<br />
            条件を変更して確認してください。
          </div>
        ) : (
          Object.keys(groupedSlots).map((date) => {
            const dateSlots = groupedSlots[date];
            const availableCount = dateSlots.filter((slot) => slot.status === "available").length;

            return (
              <section className="date-section" key={date}>
                <div className="date-head">
                  <h2>{formatDate(date)}</h2>
                  <span>
                    {dateSlots.length}枠中 {availableCount}枠空き
                  </span>
                </div>

                <div className="slot-list">
                  {dateSlots.map((slot) => {
                    const view = getSlotView(slot);

                    return (
                      <div className={`slot-card ${view.className}`} key={slot.row}>
                        <div>
                          <strong>{slot.time}</strong>
                          <p>{view.meta}</p>
                        </div>

                        <button disabled={view.disabled} onClick={() => openSlot(slot)}>
                          {view.button}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </main>

      <button className="refresh-button" onClick={reloadSlots}>
        最新の予約状況を更新
      </button>

      {selectedSlot && (
        <div className="modal-bg">
          <div className="modal">
            <h2>{modalMode === "edit" ? "予約内容を変更" : "この枠を予約しますか？"}</h2>
            <p>
              {modalMode === "edit"
                ? "空いている日付・時間への変更、備考変更、または予約キャンセルができます。"
                : "備考があれば入力してください。"}
            </p>

            <div className="selected-slot">
              現在：{formatDate(selectedSlot.date)}　{selectedSlot.time}
            </div>

            {modalMode === "edit" && (
              <>
                <label htmlFor="moveRow">変更後の日付・時間</label>
                <select
                  id="moveRow"
                  value={moveRow}
                  onChange={(event) => setMoveRow(event.target.value)}
                >
                  {moveCandidates.map((slot) => (
                    <option key={slot.row} value={slot.row}>
                      {formatDate(slot.date)}　{slot.time}
                      {slot.row === selectedSlot.row ? "（現在の予約）" : ""}
                    </option>
                  ))}
                </select>
              </>
            )}

            <label htmlFor="note">備考</label>
            <textarea
              id="note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="例：白衣装希望、SNS用、宣材用など"
            />

            <div className="modal-actions">
              <button className="sub" onClick={closeModal}>
                戻る
              </button>

              {modalMode === "edit" ? (
                <>
                  <button onClick={handleUpdate}>変更する</button>
                  <button className="danger" onClick={handleCancel}>
                    予約をキャンセル
                  </button>
                </>
              ) : (
                <button onClick={handleReserve}>予約する</button>
              )}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-cover">
          <div className="loading-card">
            <div className="spinner" />
            処理中です
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
