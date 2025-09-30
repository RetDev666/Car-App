// Vehicles functionality

document.addEventListener('DOMContentLoaded', async function() {
    await API.loadDataFromAPI();
    loadVehiclesData();
});

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
    
    const result = await API.addVehicle({
        brand,
        model,
        year,
        plate,
        mileage
    });
    
    if (result.success) {
        loadVehiclesData();
        
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
    
    const result = await API.updateVehicle(id, {
        brand,
        model,
        year,
        plate,
        mileage
    });
    
    if (result.success) {
        loadVehiclesData();
        
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
        showNotification(result.error, 'danger');
    }
}

async function deleteVehicle(id) {
    if (!confirm('Ви впевнені, що хочете видалити цей автомобіль?')) return;
    
    const result = await API.deleteVehicle(id);
    
    if (result.success) {
        loadVehiclesData();
        showNotification('Автомобіль успішно видалено', 'success');
    } else {
        showNotification(result.error, 'danger');
    }
}
