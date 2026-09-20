// تنظیم نقشه
const map = L.map('map').setView([29.59, 52.58], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

const modelSelect = document.getElementById('model-select');
const scenarioSelect = document.getElementById('scenario-select');
let chartInstance = null;

// لود داده‌ها
fetch('data/fars_temp.json')
    .then(response => response.json())
    .then(data => {
        window.climateData = data;
        
        // پر کردن لیست مدل‌ها
        Object.keys(data).forEach(m => modelSelect.add(new Option(m, m)));
        
        // تنظیم سناریوها
        updateScenarioOptions();
        
        modelSelect.addEventListener('change', updateScenarioOptions);
        scenarioSelect.addEventListener('change', drawChart);
        
        drawChart();
    })
    .catch(err => console.error("خطا در خواندن فایل داده:", err));

function updateScenarioOptions() {
    scenarioSelect.innerHTML = '';
    const scenarios = Object.keys(window.climateData[modelSelect.value]);
    scenarios.forEach(s => scenarioSelect.add(new Option(s, s)));
    drawChart();
}

function drawChart() {
    const ctx = document.getElementById('tempChart').getContext('2d');
    const data = window.climateData[modelSelect.value][scenarioSelect.value];
    
    if (chartInstance) chartInstance.destroy();
    
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(data), // سال‌ها در محور X
            datasets: [{
                label: 'دما (سانتی‌گراد)',
                data: Object.values(data),
                borderColor: '#2563eb',
                fill: false
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}
