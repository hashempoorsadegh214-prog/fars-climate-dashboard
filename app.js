// ۱. مقداردهی اولیه نقشه
const map = L.map('map').setView([29.59, 52.58], 7); // مرکز استان فارس
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

// ۲. متغیرهای نمودار
let tempChart = null;
const ctx = document.getElementById('chartCanvas').getContext('2d');

// ۳. لود کردن داده‌ها
fetch('data/fars_temp.json')
    .then(response => response.json())
    .then(data => {
        window.climateData = data;
        const models = Object.keys(data);
        const modelSelect = document.getElementById('model-select');
        const scenarioSelect = document.getElementById('scenario-select');

        // پر کردن منوهای مدل
        models.forEach(m => modelSelect.add(new Option(m, m)));
        
        // پر کردن سناریوها (بر اساس مدل اول)
        const scenarios = Object.keys(data[models[0]]);
        scenarios.forEach(s => scenarioSelect.add(new Option(s, s)));

        // تابع به‌روزرسانی
        function updateUI() {
            const m = modelSelect.value;
            const s = scenarioSelect.value;
            const values = data[m][s]; // فرض بر این است که داده‌ها به شکل {سال: دما} هستند
            
            const labels = Object.keys(values);
            const dataset = Object.values(values);

            if (tempChart) tempChart.destroy();
            
            tempChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{ label: `دما در مدل ${m} و سناریو ${s}`, data: dataset, borderColor: 'blue' }]
                }
            });
        }

        // گوش دادن به تغییرات
        modelSelect.addEventListener('change', updateUI);
        scenarioSelect.addEventListener('change', updateUI);

        // اجرای اولیه
        updateUI();
    })
    .catch(err => console.error("خطا در لود داده:", err));
