// API Module for Car Manager App

// Global variables
let vehicles = [];
let expenses = [];
let fuelLogs = [];
let maintenanceRecords = [];
let services = [];
let trips = [];

// API Base URL
const API_BASE = '';

// Load data from API
async function loadDataFromAPI() {
    try {
        const [vehiclesRes, expensesRes, fuelLogsRes, maintenanceRes, servicesRes, tripsRes] = await Promise.all([
            fetch(`${API_BASE}/api/vehicles`),
            fetch(`${API_BASE}/api/expenses`),
            fetch(`${API_BASE}/api/fuel-logs`),
            fetch(`${API_BASE}/api/maintenance`),
            fetch(`${API_BASE}/api/services`),
            fetch(`${API_BASE}/api/trips`)
        ]);

        vehicles = await vehiclesRes.json();
        expenses = await expensesRes.json();
        fuelLogs = await fuelLogsRes.json();
        maintenanceRecords = await maintenanceRes.json();
        services = await servicesRes.json();
        trips = await tripsRes.json();

        // Populate vehicle selects
        populateVehicleSelects();
        
        return {
            vehicles,
            expenses,
            fuelLogs,
            maintenanceRecords,
            services,
            trips
        };
    } catch (error) {
        console.error('Error loading data from API:', error);
        showNotification('Помилка завантаження даних', 'danger');
        return null;
    }
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

// Vehicle API functions
async function addVehicle(vehicleData) {
    try {
        const response = await fetch(`${API_BASE}/api/vehicles`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(vehicleData)
        });
        
        if (response.ok) {
            await loadDataFromAPI();
            return { success: true };
        } else {
            const error = await response.json();
            return { success: false, error: error.error || 'Помилка додавання автомобіля' };
        }
    } catch (error) {
        console.error('Error adding vehicle:', error);
        return { success: false, error: 'Помилка додавання автомобіля' };
    }
}

async function updateVehicle(id, vehicleData) {
    try {
        const response = await fetch(`${API_BASE}/api/vehicles/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(vehicleData)
        });
        
        if (response.ok) {
            await loadDataFromAPI();
            return { success: true };
        } else {
            const error = await response.json();
            return { success: false, error: error.error || 'Помилка оновлення автомобіля' };
        }
    } catch (error) {
        console.error('Error updating vehicle:', error);
        return { success: false, error: 'Помилка оновлення автомобіля' };
    }
}

async function deleteVehicle(id) {
    try {
        const response = await fetch(`${API_BASE}/api/vehicles/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            await loadDataFromAPI();
            return { success: true };
        } else {
            return { success: false, error: 'Помилка видалення автомобіля' };
        }
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        return { success: false, error: 'Помилка видалення автомобіля' };
    }
}

// Fuel Log API functions
async function addFuelLog(fuelLogData) {
    try {
        const response = await fetch(`${API_BASE}/api/fuel-logs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(fuelLogData)
        });
        
        if (response.ok) {
            await loadDataFromAPI();
            return { success: true };
        } else {
            return { success: false, error: 'Помилка додавання заправки' };
        }
    } catch (error) {
        console.error('Error adding fuel log:', error);
        return { success: false, error: 'Помилка додавання заправки' };
    }
}

// Maintenance API functions
async function addMaintenance(maintenanceData) {
    try {
        const response = await fetch(`${API_BASE}/api/maintenance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(maintenanceData)
        });
        
        if (response.ok) {
            await loadDataFromAPI();
            return { success: true };
        } else {
            return { success: false, error: 'Помилка додавання ТО' };
        }
    } catch (error) {
        console.error('Error adding maintenance:', error);
        return { success: false, error: 'Помилка додавання ТО' };
    }
}

// Expense API functions
async function addExpense(expenseData) {
    try {
        const response = await fetch(`${API_BASE}/api/expenses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(expenseData)
        });
        
        if (response.ok) {
            await loadDataFromAPI();
            return { success: true };
        } else {
            return { success: false, error: 'Помилка додавання витрати' };
        }
    } catch (error) {
        console.error('Error adding expense:', error);
        return { success: false, error: 'Помилка додавання витрати' };
    }
}

// Service API functions
async function addService(serviceData) {
    try {
        const response = await fetch(`${API_BASE}/api/services`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(serviceData)
        });
        
        if (response.ok) {
            await loadDataFromAPI();
            return { success: true };
        } else {
            return { success: false, error: 'Помилка додавання автосервісу' };
        }
    } catch (error) {
        console.error('Error adding service:', error);
        return { success: false, error: 'Помилка додавання автосервісу' };
    }
}

async function updateService(id, serviceData) {
    try {
        const response = await fetch(`${API_BASE}/api/services/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(serviceData)
        });
        
        if (response.ok) {
            await loadDataFromAPI();
            return { success: true };
        } else {
            return { success: false, error: 'Помилка оновлення автосервісу' };
        }
    } catch (error) {
        console.error('Error updating service:', error);
        return { success: false, error: 'Помилка оновлення автосервісу' };
    }
}

async function deleteService(id) {
    try {
        const response = await fetch(`${API_BASE}/api/services/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            await loadDataFromAPI();
            return { success: true };
        } else {
            return { success: false, error: 'Помилка видалення автосервісу' };
        }
    } catch (error) {
        console.error('Error deleting service:', error);
        return { success: false, error: 'Помилка видалення автосервісу' };
    }
}

// Trip API functions
async function addTrip(tripData) {
    try {
        const response = await fetch(`${API_BASE}/api/trips`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(tripData)
        });
        
        if (response.ok) {
            await loadDataFromAPI();
            return { success: true };
        } else {
            return { success: false, error: 'Помилка додавання поїздки' };
        }
    } catch (error) {
        console.error('Error adding trip:', error);
        return { success: false, error: 'Помилка додавання поїздки' };
    }
}

// Stats API function
async function getStats() {
    try {
        const response = await fetch(`${API_BASE}/api/stats`);
        if (response.ok) {
            return await response.json();
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error getting stats:', error);
        return null;
    }
}

// Expose a namespaced API to avoid function name collisions in page scripts
window.API = {
    loadDataFromAPI,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    addFuelLog,
    addMaintenance,
    addExpense,
    addService,
    updateService,
    deleteService,
    addTrip,
    getStats
};