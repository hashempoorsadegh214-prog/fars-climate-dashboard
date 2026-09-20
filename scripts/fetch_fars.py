import os
import json
import cdsapi
import xarray as xr
import numpy as np

# ۱. دریافت کلید از Secrets گیت‌هاب
cds_key = os.environ.get("CDSAPI_KEY")
if cds_key:
    with open(os.path.expanduser("~/.cdsapirc"), "w") as f:
        f.write(f"url: https://cds.climate.copernicus.eu/api/v2\nkey: {cds_key}\n")

c = cdsapi.Client()

# ۲. دانلود داده‌های CMIP6 برای محدوده جغرافیایی استان فارس
# Bounding box استان فارس: شمال: 31.7, غرب: 50.5, جنوب: 29.0, شرق: 55.8
print("در حال دریافت داده‌های اقلیمی استان فارس از کوپرنیک...")

# دانلود داده
c.retrieve(
    'projections-cmip6',
    {
        'format': 'zip',
        'temporal_resolution': 'monthly',
        'experiment': ['historical', 'ssp2_4_5'],
        'variable': 'near_surface_air_temperature',
        'model': 'ec_earth3',
        'area': [31.7, 50.5, 29.0, 55.8],
    },
    'fars_cmip6.zip'
)

# ۳. استخراج و تبدیل به JSON
import zipfile
with zipfile.ZipFile('fars_cmip6.zip', 'r') as zip_ref:
    zip_ref.extractall('fars_data')

# یافتن فایل netcdf خروجی
nc_files = [os.path.join('fars_data', f) for f in os.listdir('fars_data') if f.endswith('.nc')]

if nc_files:
    ds = xr.open_mfdataset(nc_files)
    # میانگین فضایی روی کل استان فارس و تبدیل کلوین به سانتی‌گراد
    temp_series = ds['tas'].mean(dim=['lat', 'lon']) - 273.15
    
    # میانگین‌گیری سالانه
    annual_temp = temp_series.groupby('time.year').mean()
    
    years = [int(y) for y in annual_temp.year.values]
    temps = [round(float(t), 2) for t in annual_temp.values]
    
    # جداسازی تاریخی (تا ۲۰۲۰) و پیش‌بینی (۲۰۲۱ به بعد)
    out_data = {
        "years": years,
        "temperatures": temps,
        "region": "Fars Province, Iran",
        "scenario": "SSP2-4.5"
    }
    
    os.makedirs('data', exist_ok=True)
    with open('data/fars_temp.json', 'w', encoding='utf-8') as f:
        json.dump(out_data, f, ensure_ascii=False, indent=2)
    print("داده‌ها با موفقیت در data/fars_temp.json ذخیره شدند.")
