// Utility functions for Car Manager App

// Show notification
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

// Format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('uk-UA');
}

// Format currency
function formatCurrency(amount) {
    return parseFloat(amount).toLocaleString() + ' ₴';
}

// Get expense type class
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

// Get expense type name
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

// Get maintenance type name
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

// Calculate fuel consumption
function calculateFuelConsumption(log) {
    const previousLog = fuelLogs
        .filter(l => l.vehicle_id === log.vehicle_id && new Date(l.date) < new Date(log.date))
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    
    if (!previousLog) return 0;
    
    const distance = log.mileage - previousLog.mileage;
    if (distance <= 0) return 0;
    
    return (log.amount / distance) * 100;
}

// Calculate average fuel consumption
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

// Calculate trip cost
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

// Initialize charts
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

// Update expenses chart
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

// Set current date for date inputs
function initializeDateInputs() {
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(input => {
        if (!input.value) {
            input.value = today;
        }
    });
}

// Initialize app
function initializeApp() {
    initializeDateInputs();
    initializeCharts();
}
