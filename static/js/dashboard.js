// Dashboard functionality

document.addEventListener('DOMContentLoaded', async function() {
    await loadDataFromAPI();
    loadDashboardData();
});

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
    document.getElementById('monthlyExpenses').textContent = formatCurrency(monthlyExpenses);
    
    // Average fuel consumption
    const fuelConsumption = calculateAverageFuelConsumption();
    document.getElementById('avgFuelConsumption').textContent = `${fuelConsumption.toFixed(1)} л/100км`;
    
    // Reminders count
    const remindersCount = getRemindersCount();
    document.getElementById('remindersCount').textContent = remindersCount;
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
            <td>${formatDate(expense.date)}</td>
            <td><span class="badge badge-${getExpenseTypeClass(expense.type)}">${getExpenseTypeName(expense.type)}</span></td>
            <td>${formatCurrency(expense.amount)}</td>
            <td>${vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Невідомо'}</td>
        `;
        tbody.appendChild(row);
    });
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
            const vehicle = vehicles.find(v => v.id === record.vehicle_id);
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
    
    const result = await addVehicle({
        brand,
        model,
        year,
        plate,
        mileage
    });
    
    if (result.success) {
        loadDashboardData();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addVehicleModal'));
        modal.hide();
        
        // Reset form
        document.getElementById('addVehicleForm').reset();
        
        showNotification('Автомобіль успішно додано', 'success');
    } else {
        showNotification(result.error, 'danger');
    }
}
