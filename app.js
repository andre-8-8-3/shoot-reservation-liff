const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbw2qsN4iWzHVsMzbamLMM6JQo9h639qBZ4HOk22OWSiU5dSXr50oboK-OiSXvu7ODL29A/exec';

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

const slotsByDate = {
  '2026/08/05': createAvailableSlots(),
  '2026/08/27': createAvailableSlots()
};

let selectedDate = dates[0];
let selectedTime = slotsByDate[selectedDate].find(x => x.status === 'available')?.time || '';
let isSubmitting = false;

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

function renderDates() {
  dateButtonsEl.innerHTML = '';

  dates.forEach(date => {
    const button = document.createElement('button');
    button.className = 'date-button' + (date === selectedDate ? ' active' : '');
    button.textContent = date.replace('2026/', '').replace('/', '月') + '日';

    button.addEventListener('click', () => {
      if (isSubmitting) return;

      selectedDate = date;

      const firstAvailable = slotsByDate[selectedDate].find(x => x.status === 'available');
      selectedTime = firstAvailable ? firstAvailable.time : '';

      renderDates();
      renderSlots();
      updateConfirm();
    });

    dateButtonsEl.appendChild(button);
  });
}

function renderSlots() {
  slotListEl.innerHTML = '';

  slotsByDate[selectedDate].forEach(slot => {
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
        if (isSubmitting) return;

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
  submitButton.disabled = submitting;
  submitButton.textContent = submitting ? '送信中...' : 'この内容で予約する';
}

async function submitReservation(payload) {
  // GAS Webアプリは通常のCORSレスポンスヘッダーを返せないため、
  // まずは no-cors で送信優先にしています。
  // 成功/失敗の詳細表示は、次フェーズでJSONPまたはGAS側設計を調整します。
  await fetch(GAS_WEB_APP_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify(payload)
  });
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
    await submitReservation(payload);

    alert(
      '予約を送信しました。\n\n' +
      '日付：' + payload.date + '\n' +
      '時間：' + payload.time + '\n' +
      '名前：' + payload.name + '\n\n' +
      'スプレッドシートに反映されているか確認してください。'
    );
  } catch (error) {
    console.error(error);
    alert('送信に失敗しました。通信環境を確認して、もう一度お試しください。');
  } finally {
    setSubmitting(false);
  }
});

renderDates();
renderSlots();
updateConfirm();
