// Global variables for chart and map
let temperatureChart;
let map;
let currentData = null; // To store currently displayed data

// Leaflet Map Initialization
const mapBounds = [
    [29.0, 50.5], // South-West corner
    [31.7, 55.8]  // North-East corner
];
const mapOptions = {
    center: [30.5, 53.0], // Approximate center of Fars province
    zoom: 8,
    maxBounds: mapBounds,
    maxBoundsViscosity: 1.0
};
map = L.map('mapid', mapOptions).fitBounds(mapBounds);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Add a rectangle to visualize the Fars province bounds
L.rectangle(mapBounds, {color: "#ff7800", weight: 1}).addTo(map);

// Chart Initialization
const ctx = document.getElementById('temperatureChart').getContext('2d');
temperatureChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [], // Years will be populated here
        datasets: [{
            label: 'میانگین دمای سالانه',
            data: [], // Temperature data will be populated here
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: false // Temperature doesn't always start at 0
            }
        },
        plugins: {
            title: {
                display: true,
                text: 'روند تغییرات دمای سالانه'
            }
        }
    }
});

// Function to populate dropdowns
function populateDropdowns(data) {
    const modelSelect = document.getElementById('model-select');
    const scenarioSelect = document.getElementById('scenario-select');

    // Clear existing options
    modelSelect.innerHTML = '';
    scenarioSelect.innerHTML = '';

    // Populate model dropdown
    Object.keys(data).forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model.replace('_', ' ').toUpperCase(); // Nicer display
        modelSelect.appendChild(option);
    });

    // Populate scenario dropdown (using the first model's scenarios)
    if (Object.keys(data).length > 0) {
        const firstModel = Object.keys(data)[0];
        Object.keys(data[firstModel]).forEach(scenario => {
            const option = document.createElement('option');
            option.value = scenario;
            // Map scenario codes to more readable names
            let scenarioName = scenario.toUpperCase();
            if (scenario === 'ssp1_2_6') scenarioName = 'خوشبینانه (SSP1-2.6)';
            else if (scenario === 'ssp2_4_5') scenarioName = 'میانه (SSP2-4.5)';
            else if (scenario === 'ssp5_8_5') scenarioName = 'شدید (SSP5-8.5)';
            option.textContent = scenarioName;
            scenarioSelect.appendChild(option);
        });
    }
}

// Function to update chart data
function updateChart(selectedModel, selectedScenario) {
    if (!currentData) {
        console.error("No data loaded yet.");
        return;
    }

    const scenarioData = currentData[selectedModel]?.[selectedScenario];
    
    if (!scenarioData) {
        console.warn(`Data not found for model: ${selectedModel}, scenario: ${selectedScenario}`);
        temperatureChart.data.labels = [];
        temperatureChart.data.datasets[0].data = [];
        temperatureChart.options.plugins.title.text = 'داده‌ای برای این ترکیب یافت نشد';
        temperatureChart.update();
        return;
    }

    // Assuming the data returned is [year1_temp, year2_temp, ...]
    // We need to generate corresponding years. The Python script saves only values.
    // Let's assume the years start from the earliest possible year based on CMIP6 data range,
    // or we can infer them if the Python script provided them.
    // For simplicity, let's assume the years are sequential starting from a reasonable year.
    // A better approach would be to store years along with data in JSON.
    // For now, let's try to infer years, assuming data starts around 2000s for SSPs.
    // IMPORTANT: The Python script needs to be updated to include years!
    // For this example, let's assume we have years from 2021 to 2021 + data.length - 1
    
    // Let's refine this: The Python script IS saving only values.
    // A better JSON structure would include years.
    // For now, we'll generate placeholder years.
    
    // If the python script was modified to include years:
    // const years = scenarioData.years; // Assuming scenarioData is { years: [...], values: [...] }
    // const temps = scenarioData.values;
    
    // Since Python script only saved values, we simulate years.
    // A robust solution requires the Python script to save years too.
    // Let's assume data represents years starting from 2021 for SSPs.
    const firstYear = 2021; // Adjust if your data starts earlier/later
    const years = Array.from({ length: scenarioData.length }, (_, i) => firstYear + i);

    temperatureChart.data.labels = years;
    temperatureChart.data.datasets[0].data = scenarioData;
    
    const modelDisplayName = selectedModel.replace('_', ' ').toUpperCase();
    let scenarioDisplayName = selectedScenario.toUpperCase();
    if (selectedScenario === 'ssp1_2_6') scenarioDisplayName = 'خوشبینانه (SSP1-2.6)';
    else if (selectedScenario === 'ssp2_4_5') scenarioDisplayName = 'میانه (SSP2-4.5)';
    else if (selectedScenario === 'ssp5_8_5') scenarioDisplayName = 'شدید (SSP5-8.5)';

    temperatureChart.options.plugins.title.text = `روند تغییرات دمای سالانه - مدل: ${modelDisplayName} | سناریو: ${scenarioDisplayName}`;
    temperatureChart.update();
}

// Fetch data and initialize dropdowns and chart
fetch('data/fars_temp.json')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        currentData = data; // Store loaded data
        populateDropdowns(data);
        
        // Set default selection (e.g., first model, first scenario)
        const modelSelect = document.getElementById('model-select');
        const scenarioSelect = document.getElementById('scenario-select');
        
        if (modelSelect.options.length > 0) {
            modelSelect.selectedIndex = 0;
            const initialModel = modelSelect.value;
            
            if (scenarioSelect.options.length > 0) {
                scenarioSelect.selectedIndex = 0;
                const initialScenario = scenarioSelect.value;
                updateChart(initialModel, initialScenario);
            } else {
                 temperatureChart.options.plugins.title.text = 'لطفاً یک سناریو انتخاب کنید.';
                 temperatureChart.update();
            }
        } else {
             temperatureChart.options.plugins.title.text = 'هیچ مدلی یافت نشد.';
             temperatureChart.update();
        }

        // Event listeners for dropdown changes
        modelSelect.addEventListener('change', () => {
            const selectedModel = modelSelect.value;
            const selectedScenario = scenarioSelect.value;
            updateChart(selectedModel, selectedScenario);
        });

        scenarioSelect.addEventListener('change', () => {
            const selectedModel = modelSelect.value;
            const selectedScenario = scenarioSelect.value;
            updateChart(selectedModel, selectedScenario);
        });
    })
    .catch(error => {
        console.error('Error loading data:', error);
        temperatureChart.options.plugins.title.text = 'خطا در بارگیری داده‌ها';
        temperatureChart.update();
    });
