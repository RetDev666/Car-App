// Expenses functionality

document.addEventListener('DOMContentLoaded', async function() {
    await API.loadDataFromAPI();
    loadExpensesData();
    if (typeof initializeCharts === 'function') initializeCharts();
});

function loadExpensesData() {
    const tbody = document.querySelector('#expensesTable tbody');
    tbody.innerHTML = '';
    
    expenses.forEach(expense => {
        const vehicle = vehicles.find(v => v.id === expense.vehicle_id);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(expense.date)}</td>
            <td><span class="badge badge-${getExpenseTypeClass(expense.type)}">${getExpenseTypeName(expense.type)}</span></td>
            <td>${expense.description}</td>
            <td>${formatCurrency(expense.amount)}</td>
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
    
    const result = await API.addExpense({
        vehicle_id: vehicleId,
        date,
        type,
        description,
        amount
    });
    
    if (result.success) {
        await API.loadDataFromAPI();
        loadExpensesData();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addExpenseModal'));
        modal.hide();
        
        // Reset form
        document.getElementById('addExpenseForm').reset();
        
        showNotification('Витрату успішно додано', 'success');
    } else {
        showNotification(result.error, 'danger');
    }
}
