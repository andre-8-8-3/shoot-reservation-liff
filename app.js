const dates = [
  '2026/08/05',
  '2026/08/27'
];

const slotsByDate = {
  '2026/08/05': [
    { time: '15:00', status: 'available' },
    { time: '15:30', status: 'available' },
    { time: '16:00', status: 'reserved' },
    { time: '16:30', status: 'available' },
    { time: '17:00', status: 'available' }
  ],
  '2026/08/27': [
    { time: '15:00', status: 'available' },
    { time: '15:30', status: 'reserved' },
    { time: '16:00', status: 'available' },
    { time: '16:30', status: 'available' },
    { time: '17:00', status: 'available' }
  ]
};

let selectedDate = dates[0];
let selectedTime = slotsByDate[selectedDate].find(x => x.status === 'available')?.time || '';

const dateButtonsEl = document.getElementById('dateButtons');
const slotListEl = document.getElementById('slotList');
const nameInput = document.getElementById('name');
const submitButton = document.getElementById('submitButton');

function renderDates() {
  dateButtonsEl.innerHTML = '';

  dates.forEach(date => {
    const button = document.createElement('button');
    button.className = 'date-button' + (date === selectedDate ? ' active' : '');
    button.textContent = date.replace('2026/', '').replace('/', '月') + '日';

    button.addEventListener('click', () => {
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

nameInput.addEventListener('input', updateConfirm);

submitButton.addEventListener('click', () => {
  const payload = {
    date: selectedDate,
    time: selectedTime,
    name: nameInput.value.trim(),
    note: document.getElementById('note').value.trim()
  };

  if (!payload.name) {
    alert('名前を入力してください。');
    return;
  }

  console.log(payload);

  alert(
    '予約内容\n\n' +
    '日付：' + payload.date + '\n' +
    '時間：' + payload.time + '\n' +
    '名前：' + payload.name
  );
});

renderDates();
renderSlots();
updateConfirm();
