// Calculator functionality

document.addEventListener('DOMContentLoaded', function() {
    loadCalculatorData();
});

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
    
    document.getElementById('fuelCost').textContent = formatCurrency(fuelCost);
    document.getElementById('insuranceCost').textContent = formatCurrency(insurance);
    document.getElementById('maintenanceCost').textContent = formatCurrency(maintenance);
    document.getElementById('totalCost').textContent = formatCurrency(totalCost);
    document.getElementById('monthlyCost').textContent = formatCurrency(monthlyCost);
    document.getElementById('perKmCost').textContent = formatCurrency(perKmCost);
}
