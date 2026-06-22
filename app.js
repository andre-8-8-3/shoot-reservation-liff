const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyXo3HGrvTK01pvGT8qui2J4iiFbotEw6Vr3lzhJ2QRxF6p2SUWkT8Os-7dmoosY9g2_A/exec';

const dates = [
  '2026/08/05',
  '2026/08/27'
];

const slotTimes = [
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

let slotsByDate = createDefaultSlotsByDate();
let selectedDate = dates[0];
let selectedTime = findFirstAvailableTime(selectedDate);
let isSubmitting = false;
let isLoadingSlots = false;

const dateButtonsEl = document.getElementById('dateButtons');
const slotListEl = document.getElementById('slotList');
const nameInput = document.getElementById('name');
const noteInput = document.getElementById('note');
const submitButton = document.getElementById('submitButton');

function createAvailableSlots() {
  return slotTimes.map(time => ({
    time,
    status: 'available'
  }));
}

function createDefaultSlotsByDate() {
  return dates.reduce((map, date) => {
    map[date] = createAvailableSlots();
    return map;
  }, {});
}

function findFirstAvailableTime(date) {
  const firstAvailable = (slotsByDate[date] || []).find(slot => slot.status === 'available');
  return firstAvailable ? firstAvailable.time : '';
}

function renderDates() {
  dateButtonsEl.innerHTML = '';

  dates.forEach(date => {
    const button = document.createElement('button');
    button.className = 'date-button' + (date === selectedDate ? ' active' : '');
    button.textContent = date.replace('2026/', '').replace('/', '月') + '日';

    button.addEventListener('click', () => {
      if (isSubmitting || isLoadingSlots) return;

      selectedDate = date;

      const selectedSlot = (slotsByDate[selectedDate] || []).find(slot => slot.time === selectedTime);
      if (!selectedSlot || selectedSlot.status !== 'available') {
        selectedTime = findFirstAvailableTime(selectedDate);
      }

      renderDates();
      renderSlots();
      updateConfirm();
    });

    dateButtonsEl.appendChild(button);
  });
}

function renderSlots() {
  slotListEl.innerHTML = '';

  if (isLoadingSlots) {
    const loading = document.createElement('div');
    loading.className = 'slot reserved';
    loading.innerHTML = `
      <div class="slot-time">読込中</div>
      <div class="slot-status">少々お待ちください</div>
    `;
    slotListEl.appendChild(loading);
    return;
  }

  const slots = slotsByDate[selectedDate] || [];

  if (!slots.length) {
    const empty = document.createElement('div');
    empty.className = 'slot reserved';
    empty.innerHTML = `
      <div class="slot-time">枠なし</div>
      <div class="slot-status">予約枠がありません</div>
    `;
    slotListEl.appendChild(empty);
    return;
  }

  slots.forEach(slot => {
    const div = document.createElement('div');

    if (slot.status === 'reserved') {
      div.className = 'slot reserved';
      div.innerHTML = `
        <div class="slot-time">${slot.time}</div>
        <div class="slot-status">予約済み</div>
      `;
    } else {
      div.className = 'slot' + (slot.time === selectedTime ? ' active' : '');
      div.innerHTML = `
        <div class="slot-time">${slot.time}</div>
        <div class="slot-status">空き</div>
      `;

      div.addEventListener('click', () => {
        if (isSubmitting || isLoadingSlots) return;

        selectedTime = slot.time;
        renderSlots();
        updateConfirm();
      });
    }

    slotListEl.appendChild(div);
  });
}

function updateConfirm() {
  document.getElementById('confirmDate').textContent = selectedDate;
  document.getElementById('confirmTime').textContent = selectedTime || '未選択';
  document.getElementById('confirmName').textContent = nameInput.value || '未入力';
}

function setSubmitting(submitting) {
  isSubmitting = submitting;
  submitButton.disabled = submitting || isLoadingSlots;
  submitButton.textContent = submitting ? '送信中...' : 'この内容で予約する';
}

function createTimeout(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('通信がタイムアウトしました。')), ms);
  });
}

function buildApiUrl(paramsObject) {
  const params = new URLSearchParams({
    ...paramsObject,
    ts: String(Date.now())
  });

  return `${GAS_WEB_APP_URL}?${params.toString()}`;
}

function buildReservationUrl(payload) {
  return buildApiUrl({
    action: 'create',
    date: payload.date,
    time: payload.time,
    name: payload.name,
    note: payload.note
  });
}

function buildSlotsUrl() {
  return buildApiUrl({
    action: 'slots'
  });
}

async function fetchJsonWithTimeout(url) {
  const request = fetch(url, {
    method: 'GET',
    cache: 'no-store',
    redirect: 'follow'
  }).then(response => response.json());

  return Promise.race([
    request,
    createTimeout(10000)
  ]);
}

async function loadSlots() {
  isLoadingSlots = true;
  renderSlots();
  setSubmitting(false);

  try {
    const data = await fetchJsonWithTimeout(buildSlotsUrl());

    if (!data || !data.ok) {
      throw new Error(data && data.message ? data.message : '予約枠の取得に失敗しました。');
    }

    const nextSlotsByDate = createDefaultSlotsByDate();

    data.result.forEach(dateGroup => {
      nextSlotsByDate[dateGroup.date] = dateGroup.slots.map(slot => ({
        time: slot.time,
        status: slot.status
      }));
    });

    slotsByDate = nextSlotsByDate;

    const selectedSlot = (slotsByDate[selectedDate] || []).find(slot => slot.time === selectedTime);
    if (!selectedSlot || selectedSlot.status !== 'available') {
      selectedTime = findFirstAvailableTime(selectedDate);
    }

  } catch (error) {
    console.error('[reservation] slots error', error);
    alert('予約枠の取得に失敗しました。GASの?action=initが完了しているか確認してください。');
  } finally {
    isLoadingSlots = false;
    renderDates();
    renderSlots();
    updateConfirm();
    setSubmitting(false);
  }
}

async function submitReservation(payload) {
  const url = buildReservationUrl(payload);
  console.log('[reservation] submit GET', url);

  const data = await fetchJsonWithTimeout(url);

  if (!data || !data.ok) {
    throw new Error(data && data.message ? data.message : '予約に失敗しました。');
  }

  console.log('[reservation] submit finished', data);
  return data.result;
}

nameInput.addEventListener('input', updateConfirm);

submitButton.addEventListener('click', async () => {
  const payload = {
    date: selectedDate,
    time: selectedTime,
    name: nameInput.value.trim(),
    note: noteInput.value.trim()
  };

  if (!payload.time) {
    alert('時間を選択してください。');
    return;
  }

  if (!payload.name) {
    alert('名前を入力してください。');
    return;
  }

  try {
    setSubmitting(true);
    const result = await submitReservation(payload);

    alert(
      '予約が完了しました。\n\n' +
      '日付：' + result.date + '\n' +
      '時間：' + result.time + '\n' +
      '名前：' + result.name
    );

    nameInput.value = '';
    noteInput.value = '';

    await loadSlots();
  } catch (error) {
    console.error('[reservation] submit error', error);
    alert(error.message || '送信に失敗しました。もう一度お試しください。');
  } finally {
    setSubmitting(false);
  }
});

renderDates();
renderSlots();
updateConfirm();
loadSlots();
