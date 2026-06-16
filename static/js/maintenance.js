// Maintenance functionality

document.addEventListener('DOMContentLoaded', async function() {
    await API.loadDataFromAPI();
    loadMaintenanceData();
});

function loadMaintenanceData() {
    const tbody = document.querySelector('#maintenanceTable tbody');
    tbody.innerHTML = '';
    
    maintenanceRecords.forEach(record => {
        const vehicle = vehicles.find(v => v.id === record.vehicle_id);
        const nextMaintenance = new Date(record.date);
        nextMaintenance.setMonth(nextMaintenance.getMonth() + 6);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(record.date)}</td>
            <td>${vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Невідомо'}</td>
            <td>${getMaintenanceTypeName(record.type)}</td>
            <td>${parseInt(record.mileage).toLocaleString()}</td>
            <td>${formatCurrency(record.cost)}</td>
            <td>${nextMaintenance.toLocaleDateString('uk-UA')}</td>
        `;
        tbody.appendChild(row);
    });
    
    loadMaintenanceReminders();
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
    
    const result = await API.addMaintenance({
        vehicle_id: vehicleId,
        date,
        type,
        mileage,
        cost,
        description
    });
    
    if (result.success) {
        await API.loadDataFromAPI();
        loadMaintenanceData();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addMaintenanceModal'));
        modal.hide();
        
        // Reset form
        document.getElementById('addMaintenanceForm').reset();
        
        showNotification('ТО успішно додано', 'success');
    } else {
        showNotification(result.error, 'danger');
    }
}
