// Fuel Log functionality

document.addEventListener('DOMContentLoaded', async function() {
    await API.loadDataFromAPI();
    loadFuelLogData();
});

function loadFuelLogData() {
    const tbody = document.querySelector('#fuelLogTable tbody');
    tbody.innerHTML = '';
    
    fuelLogs.forEach(log => {
        const vehicle = vehicles.find(v => v.id === log.vehicle_id);
        const consumption = calculateFuelConsumption(log);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(log.date)}</td>
            <td>${vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Невідомо'}</td>
            <td>${parseFloat(log.amount).toFixed(2)}</td>
            <td>${parseFloat(log.price_per_liter).toFixed(2)}</td>
            <td>${formatCurrency(parseFloat(log.amount) * parseFloat(log.price_per_liter))}</td>
            <td>${parseInt(log.mileage).toLocaleString()}</td>
            <td>${consumption.toFixed(1)}</td>
        `;
        tbody.appendChild(row);
    });
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
    
    const result = await API.addFuelLog({
        vehicle_id: vehicleId,
        date,
        amount,
        price_per_liter: pricePerLiter,
        mileage
    });
    
    if (result.success) {
        await API.loadDataFromAPI();
        loadFuelLogData();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addFuelLogModal'));
        modal.hide();
        
        // Reset form
        document.getElementById('addFuelLogForm').reset();
        
        showNotification('Заправку успішно додано', 'success');
    } else {
        showNotification(result.error, 'danger');
    }
}
