import { useState } from "react";
import { createReservationSlots } from "../services/adminApi";

export default function SlotCreator({ user, onCreated, showToast, setLoading }) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("13:00");
  const [endTime, setEndTime] = useState("17:00");
  const [intervalMinutes, setIntervalMinutes] = useState(30);
  const [lastResult, setLastResult] = useState(null);

  async function handleCreateSlots() {
    if (!date) {
      showToast("日付を入力してください");
      return;
    }

    try {
      setLoading(true);

      const result = await createReservationSlots({
        adminUserId: user.userId,
        date,
        startTime,
        endTime,
        intervalMinutes: Number(intervalMinutes || 30),
      });

      setLastResult(result.result);
      showToast(`${result.result.createdCount}件の予約枠を作成しました`);
      await onCreated();
    } catch (error) {
      console.error(error);
      showToast(error.message || "予約枠の作成に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="admin-card">
      <div className="admin-card-head">
        <h2>予約枠作成</h2>
      </div>

      <div className="slot-create-form">
        <label>
          日付
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>

        <div className="slot-create-grid">
          <label>
            開始
            <input
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </label>

          <label>
            終了
            <input
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
            />
          </label>
        </div>

        <label>
          間隔（分）
          <select
            value={intervalMinutes}
            onChange={(event) => setIntervalMinutes(event.target.value)}
          >
            <option value="15">15分</option>
            <option value="20">20分</option>
            <option value="30">30分</option>
            <option value="45">45分</option>
            <option value="60">60分</option>
          </select>
        </label>

        <button type="button" className="slot-create-button" onClick={handleCreateSlots}>
          予約枠を作成
        </button>
      </div>

      {lastResult && (
        <div className="slot-create-result">
          <strong>作成結果</strong>
          <span>作成：{lastResult.createdCount}件</span>
          <span>重複スキップ：{lastResult.skippedCount}件</span>
        </div>
      )}
    </section>
  );
}
