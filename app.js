// Учебная демонстрация: данные хранятся в браузере (localStorage), сервер не требуется.
const ADMIN_EMAIL = 'admin@aeroflot.ru';
const ADMIN_PASSWORD = 'admin123';

function readUsers() {
  try { return JSON.parse(localStorage.getItem('aeroflot_users') || '[]'); }
  catch { return []; }
}
function saveUsers(users) { localStorage.setItem('aeroflot_users', JSON.stringify(users)); }

// Регистрация пассажира
const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = new FormData(registerForm);
    const fullname = String(form.get('fullname') || '').trim();
    const email = String(form.get('email') || '').trim().toLowerCase();
    const phone = String(form.get('phone') || '').trim();
    const password = String(form.get('password') || '');
    const repeat = String(form.get('passwordRepeat') || '');
    const error = document.getElementById('register-error');
    error.textContent = '';

    if (password.length < 6) { error.textContent = 'Пароль должен содержать не менее 6 символов.'; return; }
    if (password !== repeat) { error.textContent = 'Пароли не совпадают.'; return; }
    const users = readUsers();
    if (users.some(user => user.email === email)) { error.textContent = 'Пользователь с таким Email уже зарегистрирован.'; return; }

    users.push({ fullname, email, phone, password });
    saveUsers(users);
    alert('Регистрация прошла успешно. Теперь войдите в личный кабинет.');
    window.location.href = 'login.html';
  });
}

// Авторизация администратора или зарегистрированного пассажира
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = new FormData(loginForm);
    const email = String(form.get('email') || '').trim().toLowerCase();
    const password = String(form.get('password') || '');
    const error = document.getElementById('login-error');
    error.textContent = '';

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem('aeroflot_session', JSON.stringify({ role: 'admin', email }));
      window.location.href = 'admin.html';
      return;
    }
    const user = readUsers().find(item => item.email === email && item.password === password);
    if (user) {
      localStorage.setItem('aeroflot_session', JSON.stringify({ role: 'passenger', email, fullname: user.fullname }));
      alert(`Добро пожаловать, ${user.fullname}!`);
      window.location.href = 'index.html';
    } else {
      error.textContent = 'Неверный Email или пароль. Проверьте данные и попробуйте снова.';
    }
  });
}

// Поиск рейсов на главной странице
const searchForm = document.getElementById('flight-search');
if (searchForm) {
  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const from = document.getElementById('from-city').value.trim().toLocaleLowerCase('ru');
    const to = document.getElementById('to-city').value.trim().toLocaleLowerCase('ru');
    const rows = [...document.querySelectorAll('#home-flight-rows tr')];
    let visible = 0;
    rows.forEach(row => {
      const rowFrom = row.dataset.from.toLocaleLowerCase('ru');
      const rowTo = row.dataset.to.toLocaleLowerCase('ru');
      const matches = (!from || rowFrom.includes(from)) && (!to || rowTo.includes(to));
      row.classList.toggle('hidden', !matches);
      if (matches) visible++;
    });
    document.getElementById('no-flights').classList.toggle('hidden', visible !== 0);
    document.getElementById('search-message').textContent = `Найдено рейсов: ${visible}`;
    document.getElementById('flights').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

document.querySelectorAll('.buy-button').forEach(button => {
  button.addEventListener('click', () => {
    const session = localStorage.getItem('aeroflot_session');
    if (!session) {
      alert('Для покупки билета войдите или зарегистрируйтесь.');
      window.location.href = 'login.html';
    } else {
      alert('Это демонстрационный проект. Для оформления бронирования обратитесь к кассиру.');
    }
  });
});

// Панель администратора: редактирование демонстрационного списка рейсов
const flightRows = document.getElementById('admin-flight-rows');
if (flightRows) {
  flightRows.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const row = button.closest('tr');
    if (button.classList.contains('delete-flight')) {
      if (confirm(`Удалить рейс ${row.cells[0].textContent.trim()}?`)) row.remove();
    }
    if (button.classList.contains('edit-flight')) {
      const oldNumber = row.cells[0].textContent.trim();
      const newNumber = prompt('Номер рейса:', oldNumber);
      if (newNumber === null || !newNumber.trim()) return;
      row.cells[0].innerHTML = `<strong>${escapeHtml(newNumber.trim())}</strong>`;
      const oldRoute = row.cells[1].textContent.trim();
      const newRoute = prompt('Маршрут:', oldRoute);
      if (newRoute !== null && newRoute.trim()) row.cells[1].textContent = newRoute.trim();
      const oldTime = row.cells[2].textContent.trim();
      const newTime = prompt('Время вылета:', oldTime);
      if (newTime !== null && newTime.trim()) row.cells[2].textContent = newTime.trim();
    }
  });

  const addForm = document.getElementById('add-flight-form');
  addForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(addForm);
    const number = String(data.get('number')).trim();
    const from = String(data.get('from')).trim();
    const to = String(data.get('to')).trim();
    const time = String(data.get('time')).trim();
    const plane = String(data.get('plane')).trim();
    if (!number || !from || !to || !time) return;
    const row = document.createElement('tr');
    row.innerHTML = `<td><strong>${escapeHtml(number)}</strong></td><td>${escapeHtml(from)} → ${escapeHtml(to)}</td><td>${escapeHtml(time)}</td><td>${escapeHtml(plane)}</td><td>0 / 158</td><td><span class="status status-green">По расписанию</span></td><td class="actions-cell"><button class="button button-outline button-xs edit-flight">Изменить</button><button class="button button-red button-xs delete-flight">Удалить</button></td>`;
    flightRows.appendChild(row);
    addForm.reset();
  });

  // Переключение разделов бокового меню. Основной рабочий раздел — «Рейсы».
  const sectionNames = {
    flights: 'Панель администратора', planes: 'Самолёты', passengers: 'Пассажиры',
    bookings: 'Бронирования', employees: 'Сотрудники', reports: 'Отчёты'
  };
  const extraContent = {
    planes: ['Самолёты авиакомпании', 'Airbus A320 — 12 единиц; Airbus A321 — 8 единиц; Sukhoi Superjet 100 — 10 единиц.'],
    passengers: ['Зарегистрированные пассажиры', 'В системе отображаются пассажиры, создавшие личный кабинет и оформившие бронирование.'],
    bookings: ['Бронирования', 'Здесь можно просматривать коды бронирования, пассажиров, выбранные рейсы и статусы оплаты.'],
    employees: ['Сотрудники', 'Кассиры, агенты регистрации, диспетчеры, менеджеры и технические специалисты.'],
    reports: ['Отчёты', 'Сводные показатели: количество рейсов, проданных билетов, зарегистрированных пассажиров и выручка.']
  };
  document.querySelectorAll('.side-link[data-section]').forEach(link => {
    link.addEventListener('click', () => {
      const section = link.dataset.section;
      document.querySelectorAll('.side-link[data-section]').forEach(item => item.classList.toggle('active', item === link));
      document.getElementById('admin-title').textContent = sectionNames[section];
      const isFlights = section === 'flights';
      document.getElementById('admin-stats').classList.toggle('hidden', !isFlights);
      document.getElementById('flight-management').classList.toggle('hidden', !isFlights);
      document.getElementById('recent-bookings').classList.toggle('hidden', !isFlights);
      const extra = document.getElementById('admin-extra');
      if (isFlights) {
        extra.classList.add('hidden');
      } else {
        extra.classList.remove('hidden');
        const [heading, copy] = extraContent[section];
        extra.innerHTML = `<div class="admin-card-heading"><h2>${heading}</h2></div><div style="padding:18px"><h3 class="extra-heading">${heading}</h3><p class="extra-copy">${copy}</p></div>`;
      }
    });
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}
