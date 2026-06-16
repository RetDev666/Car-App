// Car Manager App — Static version (localStorage)
// All data is stored in the browser's localStorage

// ─── State ───────────────────────────────────────────────────────────────────
let vehicles = [];
let expenses = [];
let fuelLogs = [];
let maintenanceRecords = [];
let services = [];
let trips = [];

// Track which vehicle/service is being edited
let editingVehicleId = null;
let editingServiceId = null;

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    loadData();
    initializeApp();
    setupEventListeners();
    loadDashboardData();
});

function loadData() {
    vehicles          = JSON.parse(localStorage.getItem('cm_vehicles')          || '[]');
    expenses          = JSON.parse(localStorage.getItem('cm_expenses')          || '[]');
    fuelLogs          = JSON.parse(localStorage.getItem('cm_fuelLogs')          || '[]');
    maintenanceRecords= JSON.parse(localStorage.getItem('cm_maintenanceRecords')|| '[]');
    services          = JSON.parse(localStorage.getItem('cm_services')          || '[]');
    trips             = JSON.parse(localStorage.getItem('cm_trips')             || '[]');
    populateVehicleSelects();
}

function saveData() {
    localStorage.setItem('cm_vehicles',           JSON.stringify(vehicles));
    localStorage.setItem('cm_expenses',           JSON.stringify(expenses));
    localStorage.setItem('cm_fuelLogs',           JSON.stringify(fuelLogs));
    localStorage.setItem('cm_maintenanceRecords', JSON.stringify(maintenanceRecords));
    localStorage.setItem('cm_services',           JSON.stringify(services));
    localStorage.setItem('cm_trips',              JSON.stringify(trips));
}

function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

function initializeApp() {
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(input => {
        if (!input.value) input.value = today;
    });
    initializeCharts();
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function setupEventListeners() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const target = this.getAttribute('href').replace('#', '');
            showSection(target);
            updateActiveNavLink(this);
        });
    });
}

function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
    const target = document.getElementById(sectionId);
    if (target) {
        target.style.display = 'block';
        target.classList.add('fade-in');
    }
    loadSectionData(sectionId);
}

function updateActiveNavLink(activeLink) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    activeLink.classList.add('active');
}

function loadSectionData(sectionId) {
    switch (sectionId) {
        case 'dashboard':   loadDashboardData();   break;
        case 'vehicles':    loadVehiclesData();    break;
        case 'fuel-log':    loadFuelLogData();     break;
        case 'maintenance': loadMaintenanceData(); break;
        case 'expenses':    loadExpensesData();    break;
        case 'services':    loadServicesData();    break;
        case 'trips':       loadTripsData();       break;
        case 'calculator':  loadCalculatorData();  break;
    }
}

// ─── Vehicle selects ──────────────────────────────────────────────────────────
function populateVehicleSelects() {
    const selects = document.querySelectorAll('select[id$="Vehicle"]');
    selects.forEach(select => {
        const currentVal = select.value;
        select.innerHTML = '<option value="">Оберіть авто</option>';
        vehicles.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.id;
            opt.textContent = `${v.brand} ${v.model} (${v.plate})`;
            select.appendChild(opt);
        });
        if (currentVal) select.value = currentVal;
    });
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function loadDashboardData() {
    updateDashboardStats();
    loadRecentExpenses();
    loadReminders();
}

function updateDashboardStats() {
    const totalMileage = vehicles.reduce((s, v) => s + (parseInt(v.mileage) || 0), 0);
    document.getElementById('totalMileage').textContent = `${totalMileage.toLocaleString()} км`;

    const now = new Date();
    const monthlyExpenses = expenses
        .filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((s, e) => s + parseFloat(e.amount), 0);
    document.getElementById('monthlyExpenses').textContent = `${monthlyExpenses.toLocaleString()} ₴`;

    document.getElementById('avgFuelConsumption').textContent = `${calculateAverageFuelConsumption().toFixed(1)} л/100км`;
    document.getElementById('remindersCount').textContent = getRemindersCount();
}

function calculateAverageFuelConsumption() {
    if (fuelLogs.length < 2) return 0;
    let total = 0, count = 0;
    for (let i = 1; i < fuelLogs.length; i++) {
        const cur = fuelLogs[i], prev = fuelLogs[i - 1];
        if (cur.vehicle_id === prev.vehicle_id) {
            const dist = cur.mileage - prev.mileage;
            if (dist > 0 && cur.amount > 0) { total += (cur.amount / dist) * 100; count++; }
        }
    }
    return count > 0 ? total / count : 0;
}

function getRemindersCount() {
    return maintenanceRecords.filter(r => {
        const next = new Date(r.date);
        next.setMonth(next.getMonth() + 6);
        return next <= new Date();
    }).length;
}

function loadRecentExpenses() {
    const tbody = document.querySelector('#recentExpensesTable tbody');
    tbody.innerHTML = '';
    expenses.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5).forEach(expense => {
        const vehicle = vehicles.find(v => v.id == expense.vehicle_id);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(expense.date).toLocaleDateString('uk-UA')}</td>
            <td><span class="badge badge-${getExpenseTypeClass(expense.type)}">${getExpenseTypeName(expense.type)}</span></td>
            <td>${parseFloat(expense.amount).toLocaleString()} ₴</td>
            <td>${vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Невідомо'}</td>
        `;
        tbody.appendChild(row);
    });
}

function loadReminders() {
    const container = document.getElementById('remindersList');
    container.innerHTML = '';
    const reminders = getReminders();
    if (!reminders.length) { container.innerHTML = '<p class="text-muted">Немає нагадувань</p>'; return; }
    reminders.forEach(r => {
        const div = document.createElement('div');
        div.className = `reminder-item ${r.urgent ? 'reminder-urgent' : ''}`;
        div.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div><strong>${r.title}</strong><br><small class="text-muted">${r.description}</small></div>
                <small class="text-muted">${r.date}</small>
            </div>
        `;
        container.appendChild(div);
    });
}

function getReminders() {
    return maintenanceRecords.filter(r => {
        const next = new Date(r.date);
        next.setMonth(next.getMonth() + 6);
        return next <= new Date();
    }).map(r => {
        const vehicle = vehicles.find(v => v.id == r.vehicle_id);
        const next = new Date(r.date); next.setMonth(next.getMonth() + 6);
        return {
            title: 'ТО',
            description: `${vehicle ? vehicle.brand + ' ' + vehicle.model : 'Авто'} потребує технічного обслуговування`,
            date: next.toLocaleDateString('uk-UA'),
            urgent: true
        };
    });
}

// ─── Vehicles ─────────────────────────────────────────────────────────────────
function loadVehiclesData() {
    const container = document.getElementById('vehiclesList');
    container.innerHTML = '';
    if (!vehicles.length) {
        container.innerHTML = `
            <div class="col-12">
                <div class="card text-center py-5">
                    <div class="card-body">
                        <i class="fas fa-car fa-3x text-muted mb-3"></i>
                        <h5 class="card-title">Немає автомобілів</h5>
                        <p class="card-text">Додайте свій перший автомобіль для початку роботи</p>
                        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addVehicleModal">
                            <i class="fas fa-plus me-2"></i>Додати авто
                        </button>
                    </div>
                </div>
            </div>`;
        return;
    }
    vehicles.forEach(v => {
        const col = document.createElement('div');
        col.className = 'col-lg-4 col-md-6 mb-4';
        col.innerHTML = `
            <div class="card vehicle-card h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <h5 class="card-title">${v.brand} ${v.model}</h5>
                        <span class="badge badge-info">${v.year}</span>
                    </div>
                    <p class="card-text text-muted mb-2">Номер: ${v.plate}</p>
                    <p class="card-text mb-3">Пробіг: ${parseInt(v.mileage).toLocaleString()} км</p>
                    <div class="d-flex justify-content-between">
                        <button class="btn btn-sm btn-outline-primary" onclick="editVehicle(${v.id})">
                            <i class="fas fa-edit me-1"></i>Редагувати
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteVehicle(${v.id})">
                            <i class="fas fa-trash me-1"></i>Видалити
                        </button>
                    </div>
                </div>
            </div>`;
        container.appendChild(col);
    });
}

function submitVehicleForm() {
    if (editingVehicleId !== null) {
        updateVehicle(editingVehicleId);
    } else {
        addVehicle();
    }
}

function addVehicle() {
    const brand   = document.getElementById('vehicleBrand').value.trim();
    const model   = document.getElementById('vehicleModel').value.trim();
    const year    = parseInt(document.getElementById('vehicleYear').value);
    const plate   = document.getElementById('vehiclePlate').value.trim();
    const mileage = parseInt(document.getElementById('vehicleMileage').value);

    if (!brand || !model || !year || !plate || isNaN(mileage)) {
        showNotification('Будь ласка, заповніть всі поля', 'warning'); return;
    }
    if (vehicles.some(v => v.plate === plate)) {
        showNotification('Автомобіль з таким номерним знаком вже існує', 'danger'); return;
    }

    vehicles.push({ id: generateId(), brand, model, year, plate, mileage, created_at: new Date().toISOString() });
    saveData();
    populateVehicleSelects();
    loadVehiclesData();
    updateDashboardStats();
    closeModal('addVehicleModal');
    document.getElementById('addVehicleForm').reset();
    showNotification('Автомобіль успішно додано', 'success');
}

function editVehicle(id) {
    const v = vehicles.find(v => v.id == id);
    if (!v) return;
    editingVehicleId = id;
    document.getElementById('vehicleBrand').value   = v.brand;
    document.getElementById('vehicleModel').value   = v.model;
    document.getElementById('vehicleYear').value    = v.year;
    document.getElementById('vehiclePlate').value   = v.plate;
    document.getElementById('vehicleMileage').value = v.mileage;
    document.querySelector('#addVehicleModal .modal-title').textContent = 'Редагувати авто';
    document.getElementById('vehicleSubmitBtn').textContent = 'Зберегти';
    new bootstrap.Modal(document.getElementById('addVehicleModal')).show();
}

function updateVehicle(id) {
    const brand   = document.getElementById('vehicleBrand').value.trim();
    const model   = document.getElementById('vehicleModel').value.trim();
    const year    = parseInt(document.getElementById('vehicleYear').value);
    const plate   = document.getElementById('vehiclePlate').value.trim();
    const mileage = parseInt(document.getElementById('vehicleMileage').value);

    if (vehicles.some(v => v.plate === plate && v.id != id)) {
        showNotification('Автомобіль з таким номерним знаком вже існує', 'danger'); return;
    }

    const idx = vehicles.findIndex(v => v.id == id);
    if (idx > -1) Object.assign(vehicles[idx], { brand, model, year, plate, mileage });
    saveData();
    populateVehicleSelects();
    loadVehiclesData();
    updateDashboardStats();
    closeModal('addVehicleModal');
    resetVehicleModal();
    showNotification('Автомобіль успішно оновлено', 'success');
}

function deleteVehicle(id) {
    if (!confirm('Ви впевнені, що хочете видалити цей автомобіль?')) return;
    vehicles = vehicles.filter(v => v.id != id);
    saveData();
    populateVehicleSelects();
    loadVehiclesData();
    updateDashboardStats();
    showNotification('Автомобіль успішно видалено', 'success');
}

function resetVehicleModal() {
    editingVehicleId = null;
    document.getElementById('addVehicleForm').reset();
    document.querySelector('#addVehicleModal .modal-title').textContent = 'Додати нове авто';
    document.getElementById('vehicleSubmitBtn').textContent = 'Додати';
}

// ─── Fuel Log ─────────────────────────────────────────────────────────────────
function loadFuelLogData() {
    const tbody = document.querySelector('#fuelLogTable tbody');
    tbody.innerHTML = '';
    fuelLogs.forEach(log => {
        const vehicle = vehicles.find(v => v.id == log.vehicle_id);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(log.date).toLocaleDateString('uk-UA')}</td>
            <td>${vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Невідомо'}</td>
            <td>${parseFloat(log.amount).toFixed(2)}</td>
            <td>${parseFloat(log.price_per_liter).toFixed(2)}</td>
            <td>${(parseFloat(log.amount) * parseFloat(log.price_per_liter)).toFixed(2)} ₴</td>
            <td>${parseInt(log.mileage).toLocaleString()}</td>
            <td>${calculateFuelConsumptionForLog(log).toFixed(1)}</td>
        `;
        tbody.appendChild(row);
    });
}

function calculateFuelConsumptionForLog(log) {
    const prev = fuelLogs
        .filter(l => l.vehicle_id == log.vehicle_id && new Date(l.date) < new Date(log.date))
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    if (!prev) return 0;
    const dist = log.mileage - prev.mileage;
    return dist > 0 ? (log.amount / dist) * 100 : 0;
}

function addFuelLog() {
    const vehicleId    = document.getElementById('fuelVehicle').value;
    const date         = document.getElementById('fuelDate').value;
    const amount       = parseFloat(document.getElementById('fuelAmount').value);
    const pricePerLiter= parseFloat(document.getElementById('fuelPrice').value);
    const mileage      = parseInt(document.getElementById('fuelMileage').value);

    if (!vehicleId || !date || isNaN(amount) || isNaN(pricePerLiter) || isNaN(mileage)) {
        showNotification('Будь ласка, заповніть всі поля', 'warning'); return;
    }

    fuelLogs.push({ id: generateId(), vehicle_id: parseInt(vehicleId), date, amount, price_per_liter: pricePerLiter, mileage, created_at: new Date().toISOString() });
    saveData();
    loadFuelLogData();
    updateDashboardStats();
    closeModal('addFuelLogModal');
    document.getElementById('addFuelLogForm').reset();
    showNotification('Заправку успішно додано', 'success');
}

// ─── Maintenance ──────────────────────────────────────────────────────────────
function loadMaintenanceData() {
    const tbody = document.querySelector('#maintenanceTable tbody');
    tbody.innerHTML = '';
    maintenanceRecords.forEach(r => {
        const vehicle = vehicles.find(v => v.id == r.vehicle_id);
        const next = new Date(r.date); next.setMonth(next.getMonth() + 6);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(r.date).toLocaleDateString('uk-UA')}</td>
            <td>${vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Невідомо'}</td>
            <td>${getMaintenanceTypeName(r.type)}</td>
            <td>${parseInt(r.mileage).toLocaleString()}</td>
            <td>${parseFloat(r.cost).toFixed(2)} ₴</td>
            <td>${next.toLocaleDateString('uk-UA')}</td>
        `;
        tbody.appendChild(row);
    });
    loadMaintenanceReminders();
}

function getMaintenanceTypeName(type) {
    return { oil_change: 'Заміна мастила', filter_change: 'Заміна фільтрів', brake_service: 'Обслуговування гальм', engine_service: 'Обслуговування двигуна', other: 'Інше' }[type] || 'Інше';
}

function loadMaintenanceReminders() {
    const container = document.getElementById('maintenanceReminders');
    container.innerHTML = '';
    const reminders = maintenanceRecords.filter(r => {
        const next = new Date(r.date); next.setMonth(next.getMonth() + 6);
        return next <= new Date();
    });
    if (!reminders.length) { container.innerHTML = '<p class="text-muted">Немає нагадувань</p>'; return; }
    reminders.forEach(r => {
        const vehicle = vehicles.find(v => v.id == r.vehicle_id);
        const next = new Date(r.date); next.setMonth(next.getMonth() + 6);
        const div = document.createElement('div');
        div.className = 'reminder-item reminder-urgent';
        div.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Невідомо'}</strong><br>
                    <small class="text-muted">${getMaintenanceTypeName(r.type)}</small>
                </div>
                <small class="text-muted">${next.toLocaleDateString('uk-UA')}</small>
            </div>`;
        container.appendChild(div);
    });
}

function addMaintenance() {
    const vehicleId   = document.getElementById('maintenanceVehicle').value;
    const date        = document.getElementById('maintenanceDate').value;
    const type        = document.getElementById('maintenanceType').value;
    const mileage     = parseInt(document.getElementById('maintenanceMileage').value);
    const cost        = parseFloat(document.getElementById('maintenanceCost').value);
    const description = document.getElementById('maintenanceDescription').value;

    if (!vehicleId || !date || !type || isNaN(mileage) || isNaN(cost)) {
        showNotification('Будь ласка, заповніть всі обов\'язкові поля', 'warning'); return;
    }

    maintenanceRecords.push({ id: generateId(), vehicle_id: parseInt(vehicleId), date, type, mileage, cost, description, created_at: new Date().toISOString() });
    saveData();
    loadMaintenanceData();
    updateDashboardStats();
    closeModal('addMaintenanceModal');
    document.getElementById('addMaintenanceForm').reset();
    showNotification('ТО успішно додано', 'success');
}

// ─── Expenses ─────────────────────────────────────────────────────────────────
function loadExpensesData() {
    const tbody = document.querySelector('#expensesTable tbody');
    tbody.innerHTML = '';
    expenses.forEach(e => {
        const vehicle = vehicles.find(v => v.id == e.vehicle_id);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(e.date).toLocaleDateString('uk-UA')}</td>
            <td><span class="badge badge-${getExpenseTypeClass(e.type)}">${getExpenseTypeName(e.type)}</span></td>
            <td>${e.description}</td>
            <td>${parseFloat(e.amount).toFixed(2)} ₴</td>
            <td>${vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Невідомо'}</td>
        `;
        tbody.appendChild(row);
    });
    updateExpensesChart();
}

function getExpenseTypeClass(type) {
    return { fuel: 'info', maintenance: 'warning', insurance: 'success', repair: 'danger', other: 'secondary' }[type] || 'secondary';
}

function getExpenseTypeName(type) {
    return { fuel: 'Паливо', maintenance: 'ТО', insurance: 'Страховка', repair: 'Ремонт', other: 'Інше' }[type] || 'Інше';
}

function addExpense() {
    const vehicleId   = document.getElementById('expenseVehicle').value;
    const date        = document.getElementById('expenseDate').value;
    const type        = document.getElementById('expenseType').value;
    const description = document.getElementById('expenseDescription').value.trim();
    const amount      = parseFloat(document.getElementById('expenseAmount').value);

    if (!vehicleId || !date || !type || !description || isNaN(amount)) {
        showNotification('Будь ласка, заповніть всі поля', 'warning'); return;
    }

    expenses.push({ id: generateId(), vehicle_id: parseInt(vehicleId), date, type, description, amount, created_at: new Date().toISOString() });
    saveData();
    loadExpensesData();
    updateDashboardStats();
    closeModal('addExpenseModal');
    document.getElementById('addExpenseForm').reset();
    showNotification('Витрату успішно додано', 'success');
}

// ─── Services ─────────────────────────────────────────────────────────────────
function loadServicesData() {
    const container = document.getElementById('servicesList');
    container.innerHTML = '';
    if (!services.length) {
        container.innerHTML = `
            <div class="col-12">
                <div class="card text-center py-5">
                    <div class="card-body">
                        <i class="fas fa-map-marker-alt fa-3x text-muted mb-3"></i>
                        <h5 class="card-title">Немає автосервісів</h5>
                        <p class="card-text">Додайте автосервіси для зручного доступу</p>
                        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addServiceModal">
                            <i class="fas fa-plus me-2"></i>Додати сервіс
                        </button>
                    </div>
                </div>
            </div>`;
        return;
    }
    services.forEach(s => {
        const col = document.createElement('div');
        col.className = 'col-lg-4 col-md-6 mb-4';
        col.innerHTML = `
            <div class="card service-card h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <h5 class="card-title">${s.name}</h5>
                        <div class="service-rating">${'★'.repeat(s.rating)}${'☆'.repeat(5 - s.rating)}</div>
                    </div>
                    <p class="card-text text-muted mb-2"><i class="fas fa-map-marker-alt me-1"></i>${s.address}</p>
                    <p class="card-text text-muted mb-2"><i class="fas fa-phone me-1"></i>${s.phone}</p>
                    <p class="card-text mb-3">${s.description || ''}</p>
                    <div class="d-flex justify-content-between">
                        <button class="btn btn-sm btn-outline-primary" onclick="editService(${s.id})">
                            <i class="fas fa-edit me-1"></i>Редагувати
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteService(${s.id})">
                            <i class="fas fa-trash me-1"></i>Видалити
                        </button>
                    </div>
                </div>
            </div>`;
        container.appendChild(col);
    });
}

function submitServiceForm() {
    if (editingServiceId !== null) {
        updateService(editingServiceId);
    } else {
        addService();
    }
}

function addService() {
    const name        = document.getElementById('serviceName').value.trim();
    const address     = document.getElementById('serviceAddress').value.trim();
    const phone       = document.getElementById('servicePhone').value.trim();
    const rating      = parseInt(document.getElementById('serviceRating').value);
    const description = document.getElementById('serviceDescription').value.trim();

    if (!name || !address || !phone || isNaN(rating)) {
        showNotification('Будь ласка, заповніть всі обов\'язкові поля', 'warning'); return;
    }

    services.push({ id: generateId(), name, address, phone, rating, description, created_at: new Date().toISOString() });
    saveData();
    loadServicesData();
    closeModal('addServiceModal');
    resetServiceModal();
    showNotification('Автосервіс успішно додано', 'success');
}

function editService(id) {
    const s = services.find(s => s.id == id);
    if (!s) return;
    editingServiceId = id;
    document.getElementById('serviceName').value        = s.name;
    document.getElementById('serviceAddress').value     = s.address;
    document.getElementById('servicePhone').value       = s.phone;
    document.getElementById('serviceRating').value      = s.rating;
    document.getElementById('serviceDescription').value = s.description || '';
    document.querySelector('#addServiceModal .modal-title').textContent = 'Редагувати сервіс';
    document.getElementById('serviceSubmitBtn').textContent = 'Зберегти';
    new bootstrap.Modal(document.getElementById('addServiceModal')).show();
}

function updateService(id) {
    const name        = document.getElementById('serviceName').value.trim();
    const address     = document.getElementById('serviceAddress').value.trim();
    const phone       = document.getElementById('servicePhone').value.trim();
    const rating      = parseInt(document.getElementById('serviceRating').value);
    const description = document.getElementById('serviceDescription').value.trim();

    const idx = services.findIndex(s => s.id == id);
    if (idx > -1) Object.assign(services[idx], { name, address, phone, rating, description });
    saveData();
    loadServicesData();
    closeModal('addServiceModal');
    resetServiceModal();
    showNotification('Автосервіс успішно оновлено', 'success');
}

function deleteService(id) {
    if (!confirm('Ви впевнені, що хочете видалити цей автосервіс?')) return;
    services = services.filter(s => s.id != id);
    saveData();
    loadServicesData();
    showNotification('Автосервіс успішно видалено', 'success');
}

function resetServiceModal() {
    editingServiceId = null;
    document.getElementById('addServiceForm').reset();
    document.querySelector('#addServiceModal .modal-title').textContent = 'Додати автосервіс';
    document.getElementById('serviceSubmitBtn').textContent = 'Додати';
}

// ─── Trips ────────────────────────────────────────────────────────────────────
function loadTripsData() {
    const tbody = document.querySelector('#tripsTable tbody');
    tbody.innerHTML = '';
    trips.forEach(t => {
        const vehicle = vehicles.find(v => v.id == t.vehicle_id);
        const cost = calcTripCostFromData(t.distance, t.fuel_price, vehicle);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(t.date).toLocaleDateString('uk-UA')}</td>
            <td>${t.from_location} → ${t.to_location}</td>
            <td>${parseFloat(t.distance)} км</td>
            <td>${cost.toFixed(2)} ₴</td>
            <td>${vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Невідомо'}</td>
        `;
        tbody.appendChild(row);
    });
}

function calcTripCostFromData(distance, fuelPrice, vehicle) {
    if (!vehicle) return 0;
    const vehicleFuelLogs = fuelLogs.filter(l => l.vehicle_id == vehicle.id);
    let avgConsumption = 8;
    if (vehicleFuelLogs.length > 1) {
        let total = 0, count = 0;
        for (let i = 1; i < vehicleFuelLogs.length; i++) {
            const diff = vehicleFuelLogs[i].mileage - vehicleFuelLogs[i - 1].mileage;
            if (diff > 0) { total += (vehicleFuelLogs[i].amount / diff) * 100; count++; }
        }
        if (count > 0) avgConsumption = total / count;
    }
    return (distance / 100) * avgConsumption * fuelPrice;
}

function addTrip() {
    const vehicleId = document.getElementById('tripVehicle').value;
    const date      = document.getElementById('tripDate').value;
    const from      = document.getElementById('tripFrom').value.trim();
    const to        = document.getElementById('tripTo').value.trim();
    const distance  = parseFloat(document.getElementById('tripDistance').value);
    const fuelPrice = parseFloat(document.getElementById('tripFuelPrice').value);

    if (!vehicleId || !date || !from || !to || isNaN(distance) || isNaN(fuelPrice)) {
        showNotification('Будь ласка, заповніть всі поля', 'warning'); return;
    }

    trips.push({ id: generateId(), vehicle_id: parseInt(vehicleId), date, from_location: from, to_location: to, distance, fuel_price: fuelPrice, created_at: new Date().toISOString() });
    saveData();
    loadTripsData();
    closeModal('addTripModal');
    document.getElementById('addTripForm').reset();
    showNotification('Поїздку успішно додано', 'success');
}

// ─── Trip calc (in sidebar) ───────────────────────────────────────────────────
function calculateTripCostCalc() {
    const distance        = parseFloat(document.getElementById('calcTripDistance').value) || 0;
    const fuelPrice       = parseFloat(document.getElementById('calcTripFuelPrice').value) || 0;
    const fuelConsumption = parseFloat(document.getElementById('calcTripFuelConsumption').value) || 0;
    const cost = (distance / 100) * fuelConsumption * fuelPrice;
    document.getElementById('tripCost').textContent = `${cost.toFixed(2)} ₴`;
}

// ─── Calculator ───────────────────────────────────────────────────────────────
function loadCalculatorData() {
    document.getElementById('calcMileage').value        = 15000;
    document.getElementById('calcFuelConsumption').value= 8;
    document.getElementById('calcFuelPrice').value      = 50;
    document.getElementById('calcInsurance').value      = 5000;
    document.getElementById('calcMaintenance').value    = 3000;
    calculateTotalCost();
}

function calculateTotalCost() {
    const mileage     = parseFloat(document.getElementById('calcMileage').value) || 0;
    const fuelCons    = parseFloat(document.getElementById('calcFuelConsumption').value) || 0;
    const fuelPrice   = parseFloat(document.getElementById('calcFuelPrice').value) || 0;
    const insurance   = parseFloat(document.getElementById('calcInsurance').value) || 0;
    const maintenance = parseFloat(document.getElementById('calcMaintenance').value) || 0;

    const fuelCost  = (mileage / 100) * fuelCons * fuelPrice;
    const totalCost = fuelCost + insurance + maintenance;

    document.getElementById('fuelCost').textContent       = `${fuelCost.toFixed(2)} ₴`;
    document.getElementById('insuranceCost').textContent  = `${insurance.toFixed(2)} ₴`;
    document.getElementById('maintenanceCost').textContent= `${maintenance.toFixed(2)} ₴`;
    document.getElementById('totalCost').textContent      = `${totalCost.toFixed(2)} ₴`;
    document.getElementById('monthlyCost').textContent    = `${(totalCost / 12).toFixed(2)} ₴`;
    document.getElementById('perKmCost').textContent      = `${mileage ? (totalCost / mileage).toFixed(2) : 0} ₴`;
}

// ─── Charts ───────────────────────────────────────────────────────────────────
function initializeCharts() {
    const ctx = document.getElementById('expensesChart');
    if (ctx) {
        window.expensesChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Паливо', 'ТО', 'Страховка', 'Ремонт', 'Інше'],
                datasets: [{ data: [0, 0, 0, 0, 0], backgroundColor: ['#36b9cc', '#f6c23e', '#1cc88a', '#e74a3b', '#858796'] }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }
}

function updateExpensesChart() {
    if (!window.expensesChart) return;
    const types = ['fuel', 'maintenance', 'insurance', 'repair', 'other'];
    window.expensesChart.data.datasets[0].data = types.map(t =>
        expenses.filter(e => e.type === t).reduce((s, e) => s + parseFloat(e.amount), 0)
    );
    window.expensesChart.update();
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function closeModal(id) {
    const modalEl = document.getElementById(id);
    const instance = bootstrap.Modal.getInstance(modalEl);
    if (instance) instance.hide();
}

function showNotification(message, type = 'info') {
    const n = document.createElement('div');
    n.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    n.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    n.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    document.body.appendChild(n);
    setTimeout(() => { if (n.parentNode) n.parentNode.removeChild(n); }, 5000);
}

// ─── Export / Import ──────────────────────────────────────────────────────────
function exportData() {
    const data = { vehicles, expenses, fuelLogs, maintenanceRecords, services, trips, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `car-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.vehicles)           vehicles           = data.vehicles;
            if (data.expenses)           expenses           = data.expenses;
            if (data.fuelLogs)           fuelLogs           = data.fuelLogs;
            if (data.maintenanceRecords) maintenanceRecords = data.maintenanceRecords;
            if (data.services)           services           = data.services;
            if (data.trips)              trips              = data.trips;
            saveData();
            populateVehicleSelects();
            loadDashboardData();
            showNotification('Дані успішно імпортовано', 'success');
        } catch {
            showNotification('Помилка при імпорті даних', 'danger');
        }
    };
    reader.readAsText(file);
    // reset so same file can be re-imported
    event.target.value = '';
}
