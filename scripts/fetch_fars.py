import cdsapi
import xarray as xr
import json
import os

# آدرس کلی فایل‌های داده
data_dir = 'data'
if not os.path.exists(data_dir):
    os.makedirs(data_dir)

c = cdsapi.Client()

# تنظیمات مدل‌ها و سناریوها
# Note: Model names need to be exact as per CDS API documentation
# Using common CMIP6 model names for the API.
# For example, 'EC-Earth3-Veg' might be registered as 'ec_earth3_veg' or similar.
# We'll use the more general names and adjust if the API rejects them.
# Let's use the names as provided in CMIP6 documentation for clarity.
# If these fail, we'll need to check the exact CDS API names.
# Based on common CMIP6 naming, let's try these:
models = ['ec_earth3', 'mpi_esm1_2_hr', 'mri_esm2_0'] 
# Let's double-check the exact scenario names for CDS API
scenarios = ['ssp1_2_6', 'ssp2_4_5', 'ssp5_8_5']

all_model_scenario_data = {}

for model in models:
    all_model_scenario_data[model] = {}
    for scenario in scenarios:
        print(f"Attempting to download data for: Model='{model}', Scenario='{scenario}'")
        
        # Define a temporary file name
        temp_file_name = f"{model}_{scenario}.nc"
        
        try:
            # Fetch data using CDS API
            # Ensure the parameters match exactly what the API expects
            # The 'area' parameter is [north, west, south, east]
            # Using the previously defined bounds for Fars province
            area_fars = [31.7, 50.5, 29.0, 55.8] 
            
            # Retrieve monthly temperature data
            c.retrieve(
                'projections-cmip6',
                {
                    'format': 'zip',
                    'temporal_resolution': 'monthly',
                    'experiment': scenario,
                    'variable': 'near_surface_air_temperature',
                    'model': model,
                    'area': area_fars,
                },
                temp_file_name)
            
            # Open the downloaded NetCDF file using xarray
            # xarray can open zip files directly if they contain a single .nc file
            ds = xr.open_dataset(temp_file_name, engine='netcdf4')

            # Calculate the mean annual temperature for the Fars region
            # 'tas' is the variable for near-surface air temperature
            # We group by year and then calculate the mean over lat and lon dimensions
            yearly_mean_temp = ds['tas'].groupby('time.year').mean(dim=['lat', 'lon']).values.tolist()
            
            all_model_scenario_data[model][scenario] = yearly_mean_temp
            
            ds.close() # Close the dataset
            os.remove(temp_file_name) # Clean up the temporary file
            print(f"Successfully downloaded and processed data for {model} - {scenario}")

        except Exception as e:
            print(f"Error downloading or processing data for {model} - {scenario}: {e}")
            # Optionally, you can store an error indicator or skip this entry
            all_model_scenario_data[model][scenario] = None # Indicate failure


# Define the final JSON output path
output_json_path = os.path.join(data_dir, 'fars_temp.json')

# Save the processed data into a JSON file
# This structure will be: {model: {scenario: [yearly_temps]}}
with open(output_json_path, 'w', encoding='utf-8') as f:
    json.dump(all_model_scenario_data, f, indent=4, ensure_ascii=False)

print(f"All data processing complete. Results saved to {output_json_path}")
