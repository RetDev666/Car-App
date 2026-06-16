// Services functionality

document.addEventListener('DOMContentLoaded', async function() {
    await API.loadDataFromAPI();
    loadServicesData();
});

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
    
    const result = await API.addService({
        name,
        address,
        phone,
        rating,
        description
    });
    
    if (result.success) {
        await API.loadDataFromAPI();
        loadServicesData();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addServiceModal'));
        modal.hide();
        
        // Reset form
        document.getElementById('addServiceForm').reset();
        
        showNotification('Автосервіс успішно додано', 'success');
    } else {
        showNotification(result.error, 'danger');
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
    
    const result = await API.updateService(id, {
        name,
        address,
        phone,
        rating,
        description
    });
    
    if (result.success) {
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
        showNotification(result.error, 'danger');
    }
}

async function deleteService(id) {
    if (!confirm('Ви впевнені, що хочете видалити цей автосервіс?')) return;
    
    const result = await API.deleteService(id);
    
    if (result.success) {
        loadServicesData();
        showNotification('Автосервіс успішно видалено', 'success');
    } else {
        showNotification(result.error, 'danger');
    }
}
