import { useEffect, useMemo, useState } from "react";
import SlotCreator from "./SlotCreator";
import {
  fetchAdminSummary,
  fetchAdminUsers,
  fetchAdminReservations,
  updateCastName,
} from "../services/reservationApi";
import { formatDate } from "../utils/dateUtils";
import "../styles/admin.css";

export default function AdminPanel({ user, onBack, showToast }) {
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [activeTab, setActiveTab] = useState("slots");
  const [loading, setLoading] = useState(true);

  const reservedReservations = useMemo(() => {
    return reservations.filter((reservation) => reservation.status === "reserved");
  }, [reservations]);

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    if (!user?.userId) return;

    try {
      setLoading(true);

      const [summaryResult, usersResult, reservationsResult] = await Promise.all([
        fetchAdminSummary(user.userId),
        fetchAdminUsers(user.userId),
        fetchAdminReservations(user.userId),
      ]);

      setSummary(summaryResult.summary);
      setUsers(usersResult.users || []);
      setReservations(reservationsResult.reservations || []);
    } catch (error) {
      console.error(error);
      showToast(error.message || "管理情報の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  function updateUserDraft(targetUserId, value) {
    setUsers((currentUsers) =>
      currentUsers.map((item) => {
        if (item.userId !== targetUserId) return item;

        return {
          ...item,
          castName: value,
          displayName: value || item.lineName,
        };
      })
    );
  }

  async function saveCastName(targetUser) {
    try {
      setLoading(true);

      const result = await updateCastName({
        adminUserId: user.userId,
        userId: targetUser.userId,
        castName: targetUser.castName || "",
      });

      setUsers((currentUsers) =>
        currentUsers.map((item) => {
          if (item.userId !== targetUser.userId) return item;

          return {
            ...item,
            castName: result.user?.castName || "",
            displayName: result.user?.displayName || item.lineName,
          };
        })
      );

      showToast("キャスト名を更新しました");
      await loadAdminData();
    } catch (error) {
      console.error(error);
      showToast(error.message || "キャスト名の更新に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app admin-app">
      <header className="admin-header">
        <div>
          <span className="admin-label">ADMIN</span>
          <h1>管理画面</h1>
          <p>予約枠の作成、ユーザー名管理、予約状況確認ができます。</p>
        </div>
        <button type="button" onClick={onBack}>予約画面へ</button>
      </header>

      <main className="content admin-content">
        <section className="admin-summary">
          <div>
            <strong>{summary?.userCount ?? "-"}</strong>
            <span>登録ユーザー</span>
          </div>
          <div>
            <strong>{summary?.reservedCount ?? "-"}</strong>
            <span>予約済み</span>
          </div>
          <div>
            <strong>{summary?.availableCount ?? "-"}</strong>
            <span>空き枠</span>
          </div>
          <div>
            <strong>{summary?.totalSlots ?? "-"}</strong>
            <span>総枠数</span>
          </div>
        </section>

        <div className="admin-tabs three">
          <button
            type="button"
            className={activeTab === "slots" ? "active" : ""}
            onClick={() => setActiveTab("slots")}
          >
            枠作成
          </button>
          <button
            type="button"
            className={activeTab === "users" ? "active" : ""}
            onClick={() => setActiveTab("users")}
          >
            ユーザー
          </button>
          <button
            type="button"
            className={activeTab === "reservations" ? "active" : ""}
            onClick={() => setActiveTab("reservations")}
          >
            予約一覧
          </button>
        </div>

        {activeTab === "slots" && (
          <SlotCreator
            user={user}
            onCreated={loadAdminData}
            showToast={showToast}
            setLoading={setLoading}
          />
        )}

        {activeTab === "users" && (
          <section className="admin-card">
            <div className="admin-card-head">
              <h2>ユーザー一覧</h2>
              <button type="button" onClick={loadAdminData}>更新</button>
            </div>

            {users.length === 0 ? (
              <div className="admin-empty">登録ユーザーはまだいません。</div>
            ) : (
              <div className="admin-user-list">
                {users.map((item) => (
                  <div className="admin-user-row" key={item.userId}>
                    <div className="admin-user-main">
                      <strong>{item.displayName || item.lineName || "名前未設定"}</strong>
                      <span>LINE名：{item.lineName || "-"}</span>
                      <small>{item.registeredAt || "登録日時なし"}</small>
                    </div>

                    <div className="admin-user-edit">
                      <label>キャスト名</label>
                      <input
                        value={item.castName || ""}
                        onChange={(event) => updateUserDraft(item.userId, event.target.value)}
                        placeholder="例：ひめる"
                      />
                      <button type="button" onClick={() => saveCastName(item)}>
                        保存
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "reservations" && (
          <section className="admin-card">
            <div className="admin-card-head">
              <h2>予約一覧</h2>
              <button type="button" onClick={loadAdminData}>更新</button>
            </div>

            {reservedReservations.length === 0 ? (
              <div className="admin-empty">予約済みの枠はまだありません。</div>
            ) : (
              <div className="admin-reservation-list">
                {reservedReservations.map((item) => (
                  <div className="admin-reservation-row" key={item.row}>
                    <div>
                      <strong>{formatDate(item.date)}　{item.time}</strong>
                      <span>{item.name || "名前未設定"}</span>
                    </div>
                    {item.note && <p>備考：{item.note}</p>}
                    {item.updatedAt && <small>更新：{item.updatedAt}</small>}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {loading && (
        <div className="loading-cover">
          <div className="loading-card">
            <div className="spinner" />
            管理情報を読み込み中です
          </div>
        </div>
      )}
    </div>
  );
}
