// Trips functionality

document.addEventListener('DOMContentLoaded', async function() {
    await API.loadDataFromAPI();
    loadTripsData();
});

function loadTripsData() {
    const tbody = document.querySelector('#tripsTable tbody');
    tbody.innerHTML = '';
    
    trips.forEach(trip => {
        const vehicle = vehicles.find(v => v.id === trip.vehicle_id);
        const cost = calculateTripCost(trip.distance, trip.fuel_price, vehicle);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(trip.date)}</td>
            <td>${trip.from_location} → ${trip.to_location}</td>
            <td>${parseFloat(trip.distance)} км</td>
            <td>${formatCurrency(cost)}</td>
            <td>${vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Невідомо'}</td>
        `;
        tbody.appendChild(row);
    });
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
    
    const result = await API.addTrip({
        vehicle_id: vehicleId,
        date,
        from_location: from,
        to_location: to,
        distance,
        fuel_price: fuelPrice
    });
    
    if (result.success) {
        loadTripsData();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addTripModal'));
        modal.hide();
        
        // Reset form
        document.getElementById('addTripForm').reset();
        
        showNotification('Поїздку успішно додано', 'success');
    } else {
        showNotification(result.error, 'danger');
    }
}

function calculateTripCost() {
    const distance = parseFloat(document.getElementById('tripDistance').value) || 0;
    const fuelPrice = parseFloat(document.getElementById('tripFuelPrice').value) || 0;
    const fuelConsumption = parseFloat(document.getElementById('tripFuelConsumption').value) || 0;
    
    const fuelNeeded = (distance / 100) * fuelConsumption;
    const cost = fuelNeeded * fuelPrice;
    
    document.getElementById('tripCost').textContent = formatCurrency(cost);
}
