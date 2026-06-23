import { useEffect, useMemo, useState } from "react";
import { initLiffProfile } from "./services/liffService";
import {
  fetchReservations,
  reserveSlot,
  updateSlot,
  cancelSlot,
} from "./services/reservationApi";
import { formatDate, groupByDate } from "./utils/dateUtils";
import { filterSlots } from "./utils/reservationUtils";

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

  const mySlots = useMemo(() => {
    return slots.filter((slot) => slot.status === "mine");
  }, [slots]);

  const availableSlots = useMemo(() => {
    return slots.filter((slot) => slot.status === "available");
  }, [slots]);

  const filteredAvailableSlots = useMemo(() => {
    return filterSlots(availableSlots, filter);
  }, [availableSlots, filter]);

  const groupedSlots = useMemo(() => {
    return groupByDate(filteredAvailableSlots);
  }, [filteredAvailableSlots]);

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

  function openReserveModal(slot) {
    setSelectedSlot(slot);
    setNote(slot.note || "");
    setMoveRow(String(slot.row));
    setModalMode("reserve");
  }

  function openEditModal(slot) {
    setSelectedSlot(slot);
    setNote(slot.note || "");
    setMoveRow(String(slot.row));
    setModalMode("edit");
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
        <section className="summary compact">
          <div>
            <strong>{availableSlots.length}</strong>
            <span>空き枠</span>
          </div>
          <div>
            <strong>{mySlots.length}</strong>
            <span>あなたの予約</span>
          </div>
        </section>

        <section className="notice">
          <strong>予約ルール</strong>
          <p>
            表示される一覧は予約可能な空き枠のみです。自分の予約は上部の「あなたの予約」から変更・キャンセルできます。
          </p>
        </section>

        {mySlots.length > 0 && (
          <section className="my-box">
            <div className="my-box-title">
              <span>あなたの予約</span>
              <span>{mySlots.length}件</span>
            </div>

            <div className="my-box-body">
              {mySlots.map((slot) => (
                <div key={slot.row} className="my-reservation-item with-action">
                  <div>
                    <strong>{formatDate(slot.date)}　{slot.time}</strong>
                    {slot.note && <div className="note">備考：{slot.note}</div>}
                  </div>
                  <button type="button" onClick={() => openEditModal(slot)}>
                    変更
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="tabs">
          <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
            すべて
          </button>
          <button className={filter === "july" ? "active" : ""} onClick={() => setFilter("july")}>
            7月
          </button>
          <button className={filter === "august" ? "active" : ""} onClick={() => setFilter("august")}>
            8月
          </button>
        </div>

        {filteredAvailableSlots.length === 0 ? (
          <div className="empty">
            予約できる空き枠がありません。<br />
            条件を変更して確認してください。
          </div>
        ) : (
          Object.keys(groupedSlots).map((date) => {
            const dateSlots = groupedSlots[date];

            return (
              <section className="date-section" key={date}>
                <div className="date-head">
                  <h2>{formatDate(date)}</h2>
                  <span>{dateSlots.length}枠空き</span>
                </div>

                <div className="slot-list">
                  {dateSlots.map((slot) => (
                    <div className="slot-card available" key={slot.row}>
                      <div>
                        <strong>{slot.time}</strong>
                        <p>予約できます</p>
                      </div>

                      <button type="button" onClick={() => openReserveModal(slot)}>
                        予約
                      </button>
                    </div>
                  ))}
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
