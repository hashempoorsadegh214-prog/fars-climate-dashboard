import cdsapi
import xarray as xr
import json
import os

c = cdsapi.Client()

# تنظیمات مدل‌ها و سناریوها
models = ['ec_earth3', 'mpi_esm1_2_hr', 'mri_esm2_0']
scenarios = ['ssp1_2_6', 'ssp2_4_5', 'ssp5_8_5']

all_data = {}

for model in models:
    all_data[model] = {}
    for scenario in scenarios:
        print(f"Downloading {model} - {scenario}...")
        
        # نام فایل موقت
        file_name = f"{model}_{scenario}.nc"
        
        # درخواست داده
        c.retrieve(
            'projections-cmip6',
            {
                'format': 'zip',
                'temporal_resolution': 'monthly',
                'experiment': scenario,
                'variable': 'near_surface_air_temperature',
                'model': model,
                'area': [31.7, 50.5, 29.0, 55.8], # محدوده استان فارس
            },
            file_name)
        
        # خواندن و پردازش داده
        ds = xr.open_dataset(file_name)
        # محاسبه میانگین سالانه دمای فارس
        yearly_temp = ds['tas'].groupby('time.year').mean(dim=['lat', 'lon']).values.tolist()
        
        all_data[model][scenario] = yearly_temp
        ds.close()
        os.remove(file_name) # حذف فایل پس از پردازش

# ذخیره در فایل نهایی
with open('data/fars_temp.json', 'w') as f:
    json.dump(all_data, f)

print("All data processed successfully.")
