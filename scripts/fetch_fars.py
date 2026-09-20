import os
import json
import cdsapi
import xarray as xr
import pandas as pd

# راه‌اندازی کلاینت کوپرنیک
c = cdsapi.Client()

models = ['ec_earth3', 'mpi_esm1_2_hr', 'mri_esm2_0']
scenarios = ['ssp1_2_6', 'ssp2_4_5', 'ssp5_8_5']
years = [str(y) for y in range(2025, 2036)]

all_climate_data = {}

print("شروع دریافت داده‌های واقعی اقلیمی از سرویس کوپرنیک (CMIP6)...")

for model in models:
    all_climate_data[model] = {}
    for scenario in scenarios:
        print(f"در حال دریافت مدل: {model} و سناریو: {scenario}...")
        
        output_file = f"temp_{model}_{scenario}.nc"
        
        try:
            # درخواست داده واقعی از پایگاه داده کوپرنیک
            c.retrieve(
                'projections-cmip6',
                {
                    'format': 'netcdf',
                    'class': 's1',
                    'experiment': scenario,
                    'levelist': 'single',
                    'variable': 'near_surface_air_temperature',
                    'model': model,
                    'date': [f"{y}-01-01/{y}-12-31" for y in years],
                    'area': [31.5, 50.5, 27.0, 55.5], # محدوده جغرافیایی استان فارس [North, West, South, East]
                },
                output_file
            )
            
            # خواندن فایل NetCDF با xarray و محاسبه میانگین سالانه دمای استان فارس
            ds = xr.open_dataset(output_file)
            # فرض بر این است که متغیر دما tas یا مشابه است
            var_name = 'tas' if 'tas' in ds else list(ds.data_vars)[0]
            
            # میانگین‌گیری فضایی روی استان فارس و گروه‌بندی بر اساس سال
            ds_mean = ds[var_name].mean(dim=['lat', 'lon'], skipna=True)
            df = ds_mean.to_dataframe().reset_index()
            
            # استخراج سال و تبدیل دما از کلوین به سانتی‌گراد
            df['year'] = pd.to_datetime(df['time']).dt.year
            yearly_avg = df.groupby('year')[var_name].mean() - 273.15
            
            model_scenario_data = {}
            for y in years:
                if int(y) in yearly_avg.index:
                    val = float(yearly_avg[int(y)])
                    model_scenario_data[y] = round(val, 2)
            
            all_climate_data[model][scenario] = model_scenario_data
            
            # پاک کردن فایل موقت NetCDF
            if os.path.exists(output_file):
                os.remove(output_file)
                
        except Exception as e:
            print(f"خطا در دریافت مدل {model} و سناریو {scenario}: {e}")
            # اگر در دریافت یک مورد خطا رخ داد، یک دیکشنری خالی یا خطا قرار ندهیم که برنامه کرش نکند
            all_climate_data[model][scenario] = {}

# ذخیره خروجی نهایی در فایل JSON واقعی پروژه
os.makedirs('data', exist_ok=True)
with open('data/fars_temp.json', 'w', encoding='utf-8') as f:
    json.dump(all_climate_data, f, ensure_ascii=False, indent=4)

print("✅ پردازش تمام داده‌های واقعی اقلیمی به پایان رسید و در data/fars_temp.json ذخیره شد.")
