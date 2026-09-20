// ================== نقشه ==================
const map = L.map('map').setView([29.59, 52.58], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

// ================== المان‌ها ==================
const modelSelect    = document.getElementById('model-select');
const scenarioSelect = document.getElementById('scenario-select');
const statusBox      = document.getElementById('status');
let chartInstance = null;
let climateData = null;

function setStatus(msg, isError = true) {
    statusBox.textContent = msg || '';
    statusBox.style.color = isError ? '#b00' : '#060';
}

// ================== لود داده‌ها ==================
fetch('data/fars_temp.json', { cache: 'no-store' })
    .then(response => {
        if (!response.ok) {
            throw new Error('فایل داده پیدا نشد (خطای ' + response.status + '). مطمئن شوید data/fars_temp.json در مخزن آپلود شده است.');
        }
        return response.json();
    })
    .then(dataتبارسنج // اعتبارسنجی ساختار
        if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
            throw new Error('فایل داده خالی است یا ساختار معتبر ندارد.');
        }

        const firstModel = Object.keys(data)[0];
        if (!data[firstModel] || Object.keys(data[firstModel]).length === 0) {
            throw new Error('داده‌های مدل اول خالی است.');
        }

        climateData = data;
        setStatus('داده‌ها با موفقیت بارگذاری شد ✔', false);

        // پر کردن لیست مدل‌ها
        Object.keys(data).forEach(m => modelSelect.add(new Option(m, m)));

        updateScenarioOptions();

        modelSelect.addEventListener('change', () => {
            updateScenarioOptions();
        });
        scenarioSelect.addEventListener('change', drawChart);
    })
    .catch(err => {
        setStatus('❌ ' + err.message);
        console.error('خطا در لود داده:', err);
    });

// ================== به‌روزرسانی سناریوها ==================
function updateScenarioOptions() {
    scenarioSelect.innerHTML = '';
    const scenarios = Object.keys(climateData[modelSelect.value] || {});
    if (scenarios.length === 0) {
        setStatus('❌ سناریویی برای مدل «' + modelSelect.value + '» یافت نشد.');
        return;
    }
    scenarios.forEach(s => scenarioSelect.add(new Option(s, s)));
    drawChart();
}

// ================== رسم نمودار ==================
function drawChart() {
    if (!climateData || !modelSelect.value || !scenarioSelect.value) return;

    const data = climateData[modelSelect.value][scenarioSelect.value];
    if (!data || Object.keys(data).length === 0) {
        setStatus('❌ داده‌ای برای این ترکیب مدل/سناریو وجود ندارد.');
        return;
    }
    setStatus('', false);

    const ctx = document.getElementById('tempChart').getContext('2d');

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(data),          // سال‌ها
            datasets: [{
                label: `میانگین دما — مدل: ${modelSelect.value} | سناریو: ${scenarioSelect.value}`,
                data: Object.values(data),      // دماها
                borderColor,235,3eb',
                backgroundColor: 'rgba(37,99,235,0.15)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { title: { display: true, text: 'دما (°C)' } },
                x: { title: { display: true, text: 'سال' } }
            }
        }
    });
}
