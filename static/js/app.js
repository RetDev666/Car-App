// Car Manager App JavaScript

// Global variables
let vehicles = [];
let expenses = [];
let fuelLogs = [];
let maintenanceRecords = [];
let services = [];
let trips = [];

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadDataFromAPI(); // Load from API instead of localStorage
    setupEventListeners();
});

// Initialize app
function initializeApp() {
    // Set current date for date inputs
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(input => {
        if (!input.value) {
            input.value = today;
        }
    });
    
    // Initialize charts
    initializeCharts();
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('href').substring(1);
            showSection(target);
        });
    });
    
    // Sidebar navigation
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('href').substring(1);
            showSection(target);
            updateActiveNavLink(this);
        });
    });
}

// Show specific section
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.classList.add('fade-in');
    }
    
    // Load section-specific data
    loadSectionData(sectionId);
}

// Update active navigation link
function updateActiveNavLink(activeLink) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    activeLink.classList.add('active');
}

// Load section-specific data
function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'vehicles':
            loadVehiclesData();
            break;
        case 'fuel-log':
            loadFuelLogData();
            break;
        case 'maintenance':
            loadMaintenanceData();
            break;
        case 'expenses':
            loadExpensesData();
            break;
        case 'services':
            loadServicesData();
            break;
        case 'trips':
            loadTripsData();
            break;
        case 'calculator':
            loadCalculatorData();
            break;
    }
}

// Load data from API
async function loadDataFromAPI() {
    try {
        const [vehiclesRes, expensesRes, fuelLogsRes, maintenanceRes, servicesRes, tripsRes] = await Promise.all([
            fetch('/api/vehicles'),
            fetch('/api/expenses'),
            fetch('/api/fuel-logs'),
            fetch('/api/maintenance'),
            fetch('/api/services'),
            fetch('/api/trips')
        ]);

        vehicles = await vehiclesRes.json();
        expenses = await expensesRes.json();
        fuelLogs = await fuelLogsRes.json();
        maintenanceRecords = await maintenanceRes.json();
        services = await servicesRes.json();
        trips = await tripsRes.json();

        // Populate vehicle selects
        populateVehicleSelects();
        
        // Update dashboard if visible
        if (document.getElementById('dashboard').style.display !== 'none') {
            loadDashboardData();
        }
    } catch (error) {
        console.error('Error loading data from API:', error);
        showNotification('Помилка завантаження даних', 'danger');
    }
}

// Load all data from localStorage
function loadData() {
    vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
    expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
    fuelLogs = JSON.parse(localStorage.getItem('fuelLogs') || '[]');
    maintenanceRecords = JSON.parse(localStorage.getItem('maintenanceRecords') || '[]');
    services = JSON.parse(localStorage.getItem('services') || '[]');
    trips = JSON.parse(localStorage.getItem('trips') || '[]');
    
    // Populate vehicle selects
    populateVehicleSelects();
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('vehicles', JSON.stringify(vehicles));
    localStorage.setItem('expenses', JSON.stringify(expenses));
    localStorage.setItem('fuelLogs', JSON.stringify(fuelLogs));
    localStorage.setItem('maintenanceRecords', JSON.stringify(maintenanceRecords));
    localStorage.setItem('services', JSON.stringify(services));
    localStorage.setItem('trips', JSON.stringify(trips));
}

// Populate vehicle select elements
function populateVehicleSelects() {
    const selects = document.querySelectorAll('select[id$="Vehicle"]');
    selects.forEach(select => {
        select.innerHTML = '<option value="">Оберіть авто</option>';
        vehicles.forEach(vehicle => {
            const option = document.createElement('option');
            option.value = vehicle.id;
            option.textContent = `${vehicle.brand} ${vehicle.model} (${vehicle.plate})`;
            select.appendChild(option);
        });
    });
}

// Dashboard functions
function loadDashboardData() {
    updateDashboardStats();
    loadRecentExpenses();
    loadReminders();
}

function updateDashboardStats() {
    // Total mileage
    const totalMileage = vehicles.reduce((sum, vehicle) => sum + (parseInt(vehicle.mileage) || 0), 0);
    document.getElementById('totalMileage').textContent = `${totalMileage.toLocaleString()} км`;
    
    // Monthly expenses
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyExpenses = expenses
        .filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
        })
        .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    document.getElementById('monthlyExpenses').textContent = `${monthlyExpenses.toLocaleString()} ₴`;
    
    // Average fuel consumption
    const fuelConsumption = calculateAverageFuelConsumption();
    document.getElementById('avgFuelConsumption').textContent = `${fuelConsumption.toFixed(1)} л/100км`;
    
    // Reminders count
    const remindersCount = getRemindersCount();
    document.getElementById('remindersCount').textContent = remindersCount;
}

function calculateAverageFuelConsumption() {
    if (fuelLogs.length < 2) return 0;
    
    let totalConsumption = 0;
    let validEntries = 0;
    
    for (let i = 1; i < fuelLogs.length; i++) {
        const current = fuelLogs[i];
        const previous = fuelLogs[i - 1];
        
        if (current.vehicle_id === previous.vehicle_id) {
            const distance = current.mileage - previous.mileage;
            const fuelUsed = current.amount;
            
            if (distance > 0 && fuelUsed > 0) {
                const consumption = (fuelUsed / distance) * 100;
                totalConsumption += consumption;
                validEntries++;
            }
        }
    }
    
    return validEntries > 0 ? totalConsumption / validEntries : 0;
}

function getRemindersCount() {
    let count = 0;
    
    // Check maintenance reminders
    maintenanceRecords.forEach(record => {
        const nextMaintenance = new Date(record.date);
        nextMaintenance.setMonth(nextMaintenance.getMonth() + 6); // Next maintenance in 6 months
        
        if (nextMaintenance <= new Date()) {
            count++;
        }
    });
    
    return count;
}

function loadRecentExpenses() {
    const tbody = document.querySelector('#recentExpensesTable tbody');
    tbody.innerHTML = '';
    
    const recentExpenses = expenses
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    recentExpenses.forEach(expense => {
        const vehicle = vehicles.find(v => v.id === expense.vehicle_id);
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

function getExpenseTypeClass(type) {
    const classes = {
        'fuel': 'info',
        'maintenance': 'warning',
        'insurance': 'success',
        'repair': 'danger',
        'other': 'secondary'
    };
    return classes[type] || 'secondary';
}

function getExpenseTypeName(type) {
    const names = {
        'fuel': 'Паливо',
        'maintenance': 'ТО',
        'insurance': 'Страховка',
        'repair': 'Ремонт',
        'other': 'Інше'
    };
    return names[type] || 'Інше';
}

function loadReminders() {
    const container = document.getElementById('remindersList');
    container.innerHTML = '';
    
    const reminders = getReminders();
    
    if (reminders.length === 0) {
        container.innerHTML = '<p class="text-muted">Немає нагадувань</p>';
        return;
    }
    
    reminders.forEach(reminder => {
        const div = document.createElement('div');
        div.className = `reminder-item ${reminder.urgent ? 'reminder-urgent' : ''}`;
        div.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${reminder.title}</strong>
                    <br>
                    <small class="text-muted">${reminder.description}</small>
                </div>
                <small class="text-muted">${reminder.date}</small>
            </div>
        `;
        container.appendChild(div);
    });
}

function getReminders() {
    const reminders = [];
    
    // Maintenance reminders
    maintenanceRecords.forEach(record => {
        const nextMaintenance = new Date(record.date);
        nextMaintenance.setMonth(nextMaintenance.getMonth() + 6);
        
        if (nextMaintenance <= new Date()) {
            const vehicle = vehicles.find(v => v.id === record.vehicleId);
            reminders.push({
                title: 'ТО',
                description: `${vehicle ? vehicle.brand + ' ' + vehicle.model : 'Авто'} потребує технічного обслуговування`,
                date: nextMaintenance.toLocaleDateString('uk-UA'),
                urgent: true
            });
        }
    });
    
    return reminders;
}

// Vehicle functions
function loadVehiclesData() {
    const container = document.getElementById('vehiclesList');
    container.innerHTML = '';
    
    if (vehicles.length === 0) {
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
            </div>
        `;
        return;
    }
    
    vehicles.forEach(vehicle => {
        const col = document.createElement('div');
        col.className = 'col-lg-4 col-md-6 mb-4';
        col.innerHTML = `
            <div class="card vehicle-card h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <h5 class="card-title">${vehicle.brand} ${vehicle.model}</h5>
                        <span class="badge badge-info">${vehicle.year}</span>
                    </div>
                    <p class="card-text text-muted mb-2">Номер: ${vehicle.plate}</p>
                    <p class="card-text mb-3">Пробіг: ${parseInt(vehicle.mileage).toLocaleString()} км</p>
                    <div class="d-flex justify-content-between">
                        <button class="btn btn-sm btn-outline-primary" onclick="editVehicle(${vehicle.id})">
                            <i class="fas fa-edit me-1"></i>Редагувати
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteVehicle(${vehicle.id})">
                            <i class="fas fa-trash me-1"></i>Видалити
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
}

async function addVehicle() {
    const brand = document.getElementById('vehicleBrand').value;
    const model = document.getElementById('vehicleModel').value;
    const year = parseInt(document.getElementById('vehicleYear').value);
    const plate = document.getElementById('vehiclePlate').value;
    const mileage = parseInt(document.getElementById('vehicleMileage').value);
    
    if (!brand || !model || !year || !plate || !mileage) {
        alert('Будь ласка, заповніть всі поля');
        return;
    }
    
    try {
        const response = await fetch('/api/vehicles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                brand,
                model,
                year,
                plate,
                mileage
            })
        });
        
        if (response.ok) {
            // Reload data from API
            await loadDataFromAPI();
            loadVehiclesData();
            updateDashboardStats();
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addVehicleModal'));
            modal.hide();
            
            // Reset form
            document.getElementById('addVehicleForm').reset();
            
            showNotification('Автомобіль успішно додано', 'success');
        } else {
            const error = await response.json();
            showNotification(error.error || 'Помилка додавання автомобіля', 'danger');
        }
    } catch (error) {
        console.error('Error adding vehicle:', error);
        showNotification('Помилка додавання автомобіля', 'danger');
    }
}

function editVehicle(id) {
    const vehicle = vehicles.find(v => v.id === id);
    if (!vehicle) return;
    
    // Populate form
    document.getElementById('vehicleBrand').value = vehicle.brand;
    document.getElementById('vehicleModel').value = vehicle.model;
    document.getElementById('vehicleYear').value = vehicle.year;
    document.getElementById('vehiclePlate').value = vehicle.plate;
    document.getElementById('vehicleMileage').value = vehicle.mileage;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addVehicleModal'));
    modal.show();
    
    // Update button action
    const addButton = document.querySelector('#addVehicleModal .btn-primary');
    addButton.onclick = () => updateVehicle(id);
    addButton.textContent = 'Оновити';
}

async function updateVehicle(id) {
    const brand = document.getElementById('vehicleBrand').value;
    const model = document.getElementById('vehicleModel').value;
    const year = parseInt(document.getElementById('vehicleYear').value);
    const plate = document.getElementById('vehiclePlate').value;
    const mileage = parseInt(document.getElementById('vehicleMileage').value);
    
    try {
        const response = await fetch(`/api/vehicles/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                brand,
                model,
                year,
                plate,
                mileage
            })
        });
        
        if (response.ok) {
            // Reload data from API
            await loadDataFromAPI();
            loadVehiclesData();
            updateDashboardStats();
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addVehicleModal'));
            modal.hide();
            
            // Reset form and button
            document.getElementById('addVehicleForm').reset();
            const addButton = document.querySelector('#addVehicleModal .btn-primary');
            addButton.onclick = addVehicle;
            addButton.textContent = 'Додати';
            
            showNotification('Автомобіль успішно оновлено', 'success');
        } else {
            const error = await response.json();
            showNotification(error.error || 'Помилка оновлення автомобіля', 'danger');
        }
    } catch (error) {
        console.error('Error updating vehicle:', error);
        showNotification('Помилка оновлення автомобіля', 'danger');
    }
}

async function deleteVehicle(id) {
    if (!confirm('Ви впевнені, що хочете видалити цей автомобіль?')) return;
    
    try {
        const response = await fetch(`/api/vehicles/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Reload data from API
            await loadDataFromAPI();
            loadVehiclesData();
            updateDashboardStats();
            
            showNotification('Автомобіль успішно видалено', 'success');
        } else {
            showNotification('Помилка видалення автомобіля', 'danger');
        }
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        showNotification('Помилка видалення автомобіля', 'danger');
    }
}

// Fuel log functions
function loadFuelLogData() {
    const tbody = document.querySelector('#fuelLogTable tbody');
    tbody.innerHTML = '';
    
    fuelLogs.forEach(log => {
        const vehicle = vehicles.find(v => v.id === log.vehicle_id);
        const consumption = calculateFuelConsumption(log);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(log.date).toLocaleDateString('uk-UA')}</td>
            <td>${vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Невідомо'}</td>
            <td>${parseFloat(log.amount).toFixed(2)}</td>
            <td>${parseFloat(log.price_per_liter).toFixed(2)}</td>
            <td>${(parseFloat(log.amount) * parseFloat(log.price_per_liter)).toFixed(2)} ₴</td>
            <td>${parseInt(log.mileage).toLocaleString()}</td>
            <td>${consumption.toFixed(1)}</td>
        `;
        tbody.appendChild(row);
    });
}

function calculateFuelConsumption(log) {
    const previousLog = fuelLogs
        .filter(l => l.vehicle_id === log.vehicle_id && new Date(l.date) < new Date(log.date))
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    
    if (!previousLog) return 0;
    
    const distance = log.mileage - previousLog.mileage;
    if (distance <= 0) return 0;
    
    return (log.amount / distance) * 100;
}

async function addFuelLog() {
    const vehicleId = parseInt(document.getElementById('fuelVehicle').value);
    const date = document.getElementById('fuelDate').value;
    const amount = parseFloat(document.getElementById('fuelAmount').value);
    const pricePerLiter = parseFloat(document.getElementById('fuelPrice').value);
    const mileage = parseInt(document.getElementById('fuelMileage').value);
    
    if (!vehicleId || !date || !amount || !pricePerLiter || !mileage) {
        alert('Будь ласка, заповніть всі поля');
        return;
    }
    
    try {
        const response = await fetch('/api/fuel-logs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                vehicle_id: vehicleId,
                date,
                amount,
                price_per_liter: pricePerLiter,
                mileage
            })
        });
        
        if (response.ok) {
            // Reload data from API
            await loadDataFromAPI();
            loadFuelLogData();
            updateDashboardStats();
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addFuelLogModal'));
            modal.hide();
            
            // Reset form
            document.getElementById('addFuelLogForm').reset();
            
            showNotification('Заправку успішно додано', 'success');
        } else {
            showNotification('Помилка додавання заправки', 'danger');
        }
    } catch (error) {
        console.error('Error adding fuel log:', error);
        showNotification('Помилка додавання заправки', 'danger');
    }
}

// Maintenance functions
function loadMaintenanceData() {
    const tbody = document.querySelector('#maintenanceTable tbody');
    tbody.innerHTML = '';
    
    maintenanceRecords.forEach(record => {
        const vehicle = vehicles.find(v => v.id === record.vehicle_id);
        const nextMaintenance = new Date(record.date);
        nextMaintenance.setMonth(nextMaintenance.getMonth() + 6);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(record.date).toLocaleDateString('uk-UA')}</td>
            <td>${vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Невідомо'}</td>
            <td>${getMaintenanceTypeName(record.type)}</td>
            <td>${parseInt(record.mileage).toLocaleString()}</td>
            <td>${parseFloat(record.cost).toFixed(2)} ₴</td>
            <td>${nextMaintenance.toLocaleDateString('uk-UA')}</td>
        `;
        tbody.appendChild(row);
    });
    
    loadMaintenanceReminders();
}

function getMaintenanceTypeName(type) {
    const names = {
        'oil_change': 'Заміна мастила',
        'filter_change': 'Заміна фільтрів',
        'brake_service': 'Обслуговування гальм',
        'engine_service': 'Обслуговування двигуна',
        'other': 'Інше'
    };
    return names[type] || 'Інше';
}

function loadMaintenanceReminders() {
    const container = document.getElementById('maintenanceReminders');
    container.innerHTML = '';
    
    const reminders = getMaintenanceReminders();
    
    if (reminders.length === 0) {
        container.innerHTML = '<p class="text-muted">Немає нагадувань</p>';
        return;
    }
    
    reminders.forEach(reminder => {
        const div = document.createElement('div');
        div.className = `reminder-item ${reminder.urgent ? 'reminder-urgent' : ''}`;
        div.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${reminder.vehicle}</strong>
                    <br>
                    <small class="text-muted">${reminder.type}</small>
                </div>
                <small class="text-muted">${reminder.date}</small>
            </div>
        `;
        container.appendChild(div);
    });
}

function getMaintenanceReminders() {
    const reminders = [];
    
    maintenanceRecords.forEach(record => {
        const nextMaintenance = new Date(record.date);
        nextMaintenance.setMonth(nextMaintenance.getMonth() + 6);
        
        if (nextMaintenance <= new Date()) {
            const vehicle = vehicles.find(v => v.id === record.vehicle_id);
            reminders.push({
                vehicle: vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Невідомо',
                type: getMaintenanceTypeName(record.type),
                date: nextMaintenance.toLocaleDateString('uk-UA'),
                urgent: true
            });
        }
    });
    
    return reminders;
}

async function addMaintenance() {
    const vehicleId = parseInt(document.getElementById('maintenanceVehicle').value);
    const date = document.getElementById('maintenanceDate').value;
    const type = document.getElementById('maintenanceType').value;
    const mileage = parseInt(document.getElementById('maintenanceMileage').value);
    const cost = parseFloat(document.getElementById('maintenanceCost').value);
    const description = document.getElementById('maintenanceDescription').value;
    
    if (!vehicleId || !date || !type || !mileage || !cost) {
        alert('Будь ласка, заповніть всі обов\'язкові поля');
        return;
    }
    
    try {
        const response = await fetch('/api/maintenance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                vehicle_id: vehicleId,
                date,
                type,
                mileage,
                cost,
                description
            })
        });
        
        if (response.ok) {
            // Reload data from API
            await loadDataFromAPI();
            loadMaintenanceData();
            updateDashboardStats();
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addMaintenanceModal'));
            modal.hide();
            
            // Reset form
            document.getElementById('addMaintenanceForm').reset();
            
            showNotification('ТО успішно додано', 'success');
        } else {
            showNotification('Помилка додавання ТО', 'danger');
        }
    } catch (error) {
        console.error('Error adding maintenance:', error);
        showNotification('Помилка додавання ТО', 'danger');
    }
}

// Expense functions
function loadExpensesData() {
    const tbody = document.querySelector('#expensesTable tbody');
    tbody.innerHTML = '';
    
    expenses.forEach(expense => {
        const vehicle = vehicles.find(v => v.id === expense.vehicle_id);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(expense.date).toLocaleDateString('uk-UA')}</td>
            <td><span class="badge badge-${getExpenseTypeClass(expense.type)}">${getExpenseTypeName(expense.type)}</span></td>
            <td>${expense.description}</td>
            <td>${parseFloat(expense.amount).toFixed(2)} ₴</td>
            <td>${vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Невідомо'}</td>
        `;
        tbody.appendChild(row);
    });
    
    updateExpensesChart();
}

async function addExpense() {
    const vehicleId = parseInt(document.getElementById('expenseVehicle').value);
    const date = document.getElementById('expenseDate').value;
    const type = document.getElementById('expenseType').value;
    const description = document.getElementById('expenseDescription').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    
    if (!vehicleId || !date || !type || !description || !amount) {
        alert('Будь ласка, заповніть всі поля');
        return;
    }
    
    try {
        const response = await fetch('/api/expenses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                vehicle_id: vehicleId,
                date,
                type,
                description,
                amount
            })
        });
        
        if (response.ok) {
            // Reload data from API
            await loadDataFromAPI();
            loadExpensesData();
            updateDashboardStats();
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addExpenseModal'));
            modal.hide();
            
            // Reset form
            document.getElementById('addExpenseForm').reset();
            
            showNotification('Витрату успішно додано', 'success');
        } else {
            showNotification('Помилка додавання витрати', 'danger');
        }
    } catch (error) {
        console.error('Error adding expense:', error);
        showNotification('Помилка додавання витрати', 'danger');
    }
}

// Service functions
function loadServicesData() {
    const container = document.getElementById('servicesList');
    container.innerHTML = '';
    
    if (services.length === 0) {
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
            </div>
        `;
        return;
    }
    
    services.forEach(service => {
        const col = document.createElement('div');
        col.className = 'col-lg-4 col-md-6 mb-4';
        col.innerHTML = `
            <div class="card service-card h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <h5 class="card-title">${service.name}</h5>
                        <div class="service-rating">
                            ${'★'.repeat(service.rating)}${'☆'.repeat(5 - service.rating)}
                        </div>
                    </div>
                    <p class="card-text text-muted mb-2">
                        <i class="fas fa-map-marker-alt me-1"></i>${service.address}
                    </p>
                    <p class="card-text text-muted mb-2">
                        <i class="fas fa-phone me-1"></i>${service.phone}
                    </p>
                    <p class="card-text mb-3">${service.description}</p>
                    <div class="d-flex justify-content-between">
                        <button class="btn btn-sm btn-outline-primary" onclick="editService(${service.id})">
                            <i class="fas fa-edit me-1"></i>Редагувати
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteService(${service.id})">
                            <i class="fas fa-trash me-1"></i>Видалити
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
}

async function addService() {
    const name = document.getElementById('serviceName').value;
    const address = document.getElementById('serviceAddress').value;
    const phone = document.getElementById('servicePhone').value;
    const rating = parseInt(document.getElementById('serviceRating').value);
    const description = document.getElementById('serviceDescription').value;
    
    if (!name || !address || !phone || !rating) {
        alert('Будь ласка, заповніть всі обов\'язкові поля');
        return;
    }
    
    try {
        const response = await fetch('/api/services', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                address,
                phone,
                rating,
                description
            })
        });
        
        if (response.ok) {
            // Reload data from API
            await loadDataFromAPI();
            loadServicesData();
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addServiceModal'));
            modal.hide();
            
            // Reset form
            document.getElementById('addServiceForm').reset();
            
            showNotification('Автосервіс успішно додано', 'success');
        } else {
            showNotification('Помилка додавання автосервісу', 'danger');
        }
    } catch (error) {
        console.error('Error adding service:', error);
        showNotification('Помилка додавання автосервісу', 'danger');
    }
}

function editService(id) {
    const service = services.find(s => s.id === id);
    if (!service) return;
    
    // Populate form
    document.getElementById('serviceName').value = service.name;
    document.getElementById('serviceAddress').value = service.address;
    document.getElementById('servicePhone').value = service.phone;
    document.getElementById('serviceRating').value = service.rating;
    document.getElementById('serviceDescription').value = service.description;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addServiceModal'));
    modal.show();
    
    // Update button action
    const addButton = document.querySelector('#addServiceModal .btn-primary');
    addButton.onclick = () => updateService(id);
    addButton.textContent = 'Оновити';
}

async function updateService(id) {
    const name = document.getElementById('serviceName').value;
    const address = document.getElementById('serviceAddress').value;
    const phone = document.getElementById('servicePhone').value;
    const rating = parseInt(document.getElementById('serviceRating').value);
    const description = document.getElementById('serviceDescription').value;
    
    try {
        const response = await fetch(`/api/services/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                address,
                phone,
                rating,
                description
            })
        });
        
        if (response.ok) {
            // Reload data from API
            await loadDataFromAPI();
            loadServicesData();
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addServiceModal'));
            modal.hide();
            
            // Reset form and button
            document.getElementById('addServiceForm').reset();
            const addButton = document.querySelector('#addServiceModal .btn-primary');
            addButton.onclick = addService;
            addButton.textContent = 'Додати';
            
            showNotification('Автосервіс успішно оновлено', 'success');
        } else {
            showNotification('Помилка оновлення автосервісу', 'danger');
        }
    } catch (error) {
        console.error('Error updating service:', error);
        showNotification('Помилка оновлення автосервісу', 'danger');
    }
}

async function deleteService(id) {
    if (!confirm('Ви впевнені, що хочете видалити цей автосервіс?')) return;
    
    try {
        const response = await fetch(`/api/services/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Reload data from API
            await loadDataFromAPI();
            loadServicesData();
            
            showNotification('Автосервіс успішно видалено', 'success');
        } else {
            showNotification('Помилка видалення автосервісу', 'danger');
        }
    } catch (error) {
        console.error('Error deleting service:', error);
        showNotification('Помилка видалення автосервісу', 'danger');
    }
}

// Trip functions
function loadTripsData() {
    const tbody = document.querySelector('#tripsTable tbody');
    tbody.innerHTML = '';
    
    trips.forEach(trip => {
        const vehicle = vehicles.find(v => v.id === trip.vehicle_id);
        const cost = calculateTripCost(trip.distance, trip.fuel_price, vehicle);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(trip.date).toLocaleDateString('uk-UA')}</td>
            <td>${trip.from_location} → ${trip.to_location}</td>
            <td>${parseFloat(trip.distance)} км</td>
            <td>${cost.toFixed(2)} ₴</td>
            <td>${vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Невідомо'}</td>
        `;
        tbody.appendChild(row);
    });
}

function calculateTripCost(distance, fuelPrice, vehicle) {
    if (!vehicle) return 0;
    
    // Get average fuel consumption for the vehicle
    const vehicleFuelLogs = fuelLogs.filter(log => log.vehicle_id === vehicle.id);
    let avgConsumption = 8; // Default consumption
    
    if (vehicleFuelLogs.length > 1) {
        let totalConsumption = 0;
        let validEntries = 0;
        
        for (let i = 1; i < vehicleFuelLogs.length; i++) {
            const current = vehicleFuelLogs[i];
            const previous = vehicleFuelLogs[i - 1];
            
            const distanceDiff = current.mileage - previous.mileage;
            if (distanceDiff > 0) {
                const consumption = (current.amount / distanceDiff) * 100;
                totalConsumption += consumption;
                validEntries++;
            }
        }
        
        if (validEntries > 0) {
            avgConsumption = totalConsumption / validEntries;
        }
    }
    
    const fuelNeeded = (distance / 100) * avgConsumption;
    return fuelNeeded * fuelPrice;
}

async function addTrip() {
    const vehicleId = parseInt(document.getElementById('tripVehicle').value);
    const date = document.getElementById('tripDate').value;
    const from = document.getElementById('tripFrom').value;
    const to = document.getElementById('tripTo').value;
    const distance = parseFloat(document.getElementById('tripDistance').value);
    const fuelPrice = parseFloat(document.getElementById('tripFuelPrice').value);
    
    if (!vehicleId || !date || !from || !to || !distance || !fuelPrice) {
        alert('Будь ласка, заповніть всі поля');
        return;
    }
    
    try {
        const response = await fetch('/api/trips', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                vehicle_id: vehicleId,
                date,
                from_location: from,
                to_location: to,
                distance,
                fuel_price: fuelPrice
            })
        });
        
        if (response.ok) {
            // Reload data from API
            await loadDataFromAPI();
            loadTripsData();
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addTripModal'));
            modal.hide();
            
            // Reset form
            document.getElementById('addTripForm').reset();
            
            showNotification('Поїздку успішно додано', 'success');
        } else {
            showNotification('Помилка додавання поїздки', 'danger');
        }
    } catch (error) {
        console.error('Error adding trip:', error);
        showNotification('Помилка додавання поїздки', 'danger');
    }
}

// Calculator functions
function loadCalculatorData() {
    // Set default values
    document.getElementById('calcMileage').value = 15000;
    document.getElementById('calcFuelConsumption').value = 8;
    document.getElementById('calcFuelPrice').value = 50;
    document.getElementById('calcInsurance').value = 5000;
    document.getElementById('calcMaintenance').value = 3000;
    
    calculateTotalCost();
}

function calculateTotalCost() {
    const mileage = parseFloat(document.getElementById('calcMileage').value) || 0;
    const fuelConsumption = parseFloat(document.getElementById('calcFuelConsumption').value) || 0;
    const fuelPrice = parseFloat(document.getElementById('calcFuelPrice').value) || 0;
    const insurance = parseFloat(document.getElementById('calcInsurance').value) || 0;
    const maintenance = parseFloat(document.getElementById('calcMaintenance').value) || 0;
    
    const fuelCost = (mileage / 100) * fuelConsumption * fuelPrice;
    const totalCost = fuelCost + insurance + maintenance;
    const monthlyCost = totalCost / 12;
    const perKmCost = totalCost / mileage;
    
    document.getElementById('fuelCost').textContent = `${fuelCost.toFixed(2)} ₴`;
    document.getElementById('insuranceCost').textContent = `${insurance.toFixed(2)} ₴`;
    document.getElementById('maintenanceCost').textContent = `${maintenance.toFixed(2)} ₴`;
    document.getElementById('totalCost').textContent = `${totalCost.toFixed(2)} ₴`;
    document.getElementById('monthlyCost').textContent = `${monthlyCost.toFixed(2)} ₴`;
    document.getElementById('perKmCost').textContent = `${perKmCost.toFixed(2)} ₴`;
}

function calculateTripCost() {
    const distance = parseFloat(document.getElementById('tripDistance').value) || 0;
    const fuelPrice = parseFloat(document.getElementById('tripFuelPrice').value) || 0;
    const fuelConsumption = parseFloat(document.getElementById('tripFuelConsumption').value) || 0;
    
    const fuelNeeded = (distance / 100) * fuelConsumption;
    const cost = fuelNeeded * fuelPrice;
    
    document.getElementById('tripCost').textContent = `${cost.toFixed(2)} ₴`;
}

// Chart functions
function initializeCharts() {
    // Initialize expenses chart
    const ctx = document.getElementById('expensesChart');
    if (ctx) {
        window.expensesChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Паливо', 'ТО', 'Страховка', 'Ремонт', 'Інше'],
                datasets: [{
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: [
                        '#36b9cc',
                        '#f6c23e',
                        '#1cc88a',
                        '#e74a3b',
                        '#858796'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

function updateExpensesChart() {
    if (!window.expensesChart) return;
    
    const expenseTypes = ['fuel', 'maintenance', 'insurance', 'repair', 'other'];
    const data = expenseTypes.map(type => {
        return expenses
            .filter(expense => expense.type === type)
            .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    });
    
    window.expensesChart.data.datasets[0].data = data;
    window.expensesChart.update();
}

// Utility functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

// Export data
function exportData() {
    const data = {
        vehicles,
        expenses,
        fuelLogs,
        maintenanceRecords,
        services,
        trips,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `car-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Import data
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.vehicles) vehicles = data.vehicles;
            if (data.expenses) expenses = data.expenses;
            if (data.fuelLogs) fuelLogs = data.fuelLogs;
            if (data.maintenanceRecords) maintenanceRecords = data.maintenanceRecords;
            if (data.services) services = data.services;
            if (data.trips) trips = data.trips;
            
            saveData();
            populateVehicleSelects();
            loadDashboardData();
            
            showNotification('Дані успішно імпортовано', 'success');
        } catch (error) {
            showNotification('Помилка при імпорті даних', 'danger');
        }
    };
    reader.readAsText(file);
}
