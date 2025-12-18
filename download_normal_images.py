import os
import requests
import zipfile
from PIL import Image
import shutil
import random

# Create Normal directories if they don't exist
os.makedirs('dataset/train/Normal', exist_ok=True)
os.makedirs('dataset/test/Normal', exist_ok=True)

def download_mapillary_sample():
    """Download sample images from Mapillary Vistas dataset"""
    
    # Mapillary Vistas sample images (street scenes, normal day)
    sample_urls = [
        "https://github.com/mapillary/mapillary_vistas/raw/master/demo_images/1.jpg",
        "https://github.com/mapillary/mapillary_vistas/raw/master/demo_images/2.jpg",
        "https://github.com/mapillary/mapillary_vistas/raw/master/demo_images/3.jpg",
        "https://github.com/mapillary/mapillary_vistas/raw/master/demo_images/4.jpg",
        "https://github.com/mapillary/mapillary_vistas/raw/master/demo_images/5.jpg"
    ]
    
    print("Downloading Mapillary Vistas sample images...")
    
    for i, url in enumerate(sample_urls):
        try:
            response = requests.get(url, timeout=30)
            if response.status_code == 200:
                # Save to train folder (80% of images)
                if i < 4:
                    filepath = f'dataset/train/Normal/mapillary_{i+1}.jpg'
                else:
                    filepath = f'dataset/test/Normal/mapillary_{i+1}.jpg'
                
                with open(filepath, 'wb') as f:
                    f.write(response.content)
                print(f"Downloaded: {filepath}")
            else:
                print(f"Failed to download: {url}")
        except Exception as e:
            print(f"Error downloading {url}: {e}")

def create_normal_images():
    """Create additional normal day images from common scenarios"""
    
    # Alternative: Use placeholder images for normal scenarios
    normal_scenarios = [
        "clear_sky", "normal_street", "peaceful_city", "regular_building", 
        "calm_weather", "sunny_day", "normal_traffic", "regular_landscape"
    ]
    
    print("Creating placeholder normal images...")
    
    for i, scenario in enumerate(normal_scenarios):
        # Create simple colored images as placeholders
        img = Image.new('RGB', (128, 128), color=(100 + i*10, 150 + i*5, 200 + i*3))
        
        # 80% to train, 20% to test
        if i < 6:
            filepath = f'dataset/train/Normal/{scenario}.jpg'
        else:
            filepath = f'dataset/test/Normal/{scenario}.jpg'
        
        img.save(filepath)
        print(f"Created: {filepath}")

if __name__ == "__main__":
    print("Setting up Normal day images for disaster classification...")
    
    # Try to download Mapillary samples first
    download_mapillary_sample()
    
    # Create additional normal images
    create_normal_images()
    
    print("\n✅ Normal day images setup complete!")
    print("📁 Train images:", len(os.listdir('dataset/train/Normal')))
    print("📁 Test images:", len(os.listdir('dataset/test/Normal')))
    print("\nNow run: python train_model.py")