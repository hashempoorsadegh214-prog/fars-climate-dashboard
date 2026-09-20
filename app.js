// ================== تنظیمات نقشه ==================
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
            throw new Error('فایل داده پیدا نشد (404). مطمئن شوید data/fars_temp.json وجود دارد.');
        }
        return response.json();
    })
    .then(data => {
        // اعتبارسنجی ساختار داده
        if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
            throw new Error('فایل داده خالی است یا ساختار معتبر ندارد.');
        }

        climateData = data;
        setStatus('داده‌ها با موفقیت بارگذاری شد ✔', false);

        // پر کردن لیست مدل‌ها
        modelSelect.innerHTML = '';
        Object.keys(data).forEach(m => modelSelect.add(new Option(m, m)));

        updateScenarioOptions();

        modelSelect.addEventListener('change', updateScenarioOptions);
        scenarioSelect.addEventListener('change', drawChart);
    })
    .catch(err => {
        setStatus('❌ ' + err.message);
        console.error('خطا در لود داده:', err);
    });

// ================== به‌روزرسانی سناریوها ==================
function updateScenarioOptions() {
    scenarioSelect.innerHTML = '';
    const selectedModel = modelSelect.value;
    const scenarios = Object.keys(climateData[selectedModel] || {});
    
    scenarios.forEach(s => scenarioSelect.add(new Option(s, s)));
    drawChart();
}

// ================== رسم نمودار ==================
function drawChart() {
    if (!climateData || !modelSelect.value || !scenarioSelect.value) return;

    const data = climateData[modelSelect.value][scenarioSelect.value];
    
    if (!data) {
        setStatus('❌ داده‌ای برای این ترکیب یافت نشد.');
        return;
    }
    
    setStatus('', false);
    const ctx = document.getElementById('tempChart').getContext('2d');

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: `دما (°C) - ${modelSelect.value} | ${scenarioSelect.value}`,
                data: Object.values(data),
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37,99,235,0.15)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}
// کد عیب‌یاب - پس از لود داده‌ها اجرا می‌شود
function debugData() {
    if (climateData) {
        console.log("مدل‌های موجود در فایل:", Object.keys(climateData));
        const selectedM = modelSelect.value;
        const selectedS = scenarioSelect.value;
        console.log("مدل انتخاب شده:", selectedM, "| سناریوی انتخاب شده:", selectedS);
        
        if (climateData[selectedM]) {
            console.log("سناریوهای این مدل:", Object.keys(climateData[selectedM]));
            console.log("مقدار خام داده:", climateData[selectedM][selectedS]);
        }
    }
}
// این تابع را بعد از تابع drawChart صدا بزنید یا در کنسول مرورگر تایپ کنید: debugData()
