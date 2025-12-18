from datasets import load_dataset
import os
from PIL import Image
import numpy as np

# Create Normal directories
os.makedirs('dataset/train/Normal', exist_ok=True)
os.makedirs('dataset/test/Normal', exist_ok=True)

def stream_normal_images():
    """Stream normal day images from online datasets without full download"""
    
    print("Streaming normal scene images from online datasets...")
    
    try:
        # Try different datasets for normal scenes
        datasets_to_try = [
            ("scene_parse_150", "train"),
            ("imagenet-1k", "train"),
            ("cifar10", "train")
        ]
        
        for dataset_name, split in datasets_to_try:
            try:
                print(f"Trying dataset: {dataset_name}")
                
                # Load dataset in streaming mode
                dataset = load_dataset(dataset_name, streaming=True, split=split, trust_remote_code=True)
                
                count = 0
                train_count = 0
                test_count = 0
                
                for sample in dataset:
                    if count >= 100:  # Limit to 100 images
                        break
                    
                    try:
                        # Get image
                        if 'image' in sample:
                            image = sample['image']
                        elif 'img' in sample:
                            image = sample['img']
                        else:
                            continue
                        
                        # Skip if not PIL Image
                        if not hasattr(image, 'convert'):
                            continue
                            
                        # Convert to RGB and resize
                        if image.mode != 'RGB':
                            image = image.convert('RGB')
                        image = image.resize((128, 128))
                        
                        # Check if it looks like a normal scene (not too dark/bright)
                        img_array = np.array(image)
                        mean_brightness = np.mean(img_array)
                        
                        if 30 < mean_brightness < 220:  # Filter out too dark/bright images
                            # Save to train (80%) or test (20%)
                            if train_count < 80:
                                filepath = f'dataset/train/Normal/real_{train_count + 1}.jpg'
                                train_count += 1
                            else:
                                filepath = f'dataset/test/Normal/real_{test_count + 1}.jpg'
                                test_count += 1
                            
                            image.save(filepath)
                            print(f"Saved: {filepath}")
                            count += 1
                        
                    except Exception as e:
                        print(f"Error processing image: {e}")
                        continue
                
                if count > 0:
                    print(f"Successfully got {count} images from {dataset_name}")
                    return True
                    
            except Exception as e:
                print(f"Failed to load {dataset_name}: {e}")
                continue
        
        print("All datasets failed, creating synthetic normal images...")
        return False
        
    except Exception as e:
        print(f"Error in streaming: {e}")
        return False

def create_realistic_normal_images():
    """Create more realistic normal images with patterns"""
    
    print("Creating realistic normal day images...")
    
    # Create varied realistic patterns
    for i in range(80):  # Training images
        img = Image.new('RGB', (128, 128))
        pixels = []
        
        for y in range(128):
            for x in range(128):
                if i % 5 == 0:  # Sky gradient
                    r = min(135 + y//4, 255)
                    g = min(206 + y//6, 255) 
                    b = 235
                elif i % 5 == 1:  # Grass texture
                    r = 34 + (x + y) % 20
                    g = 139 + (x + y) % 15
                    b = 34 + (x + y) % 10
                elif i % 5 == 2:  # Building pattern
                    r = 128 + (x//16) * 10
                    g = 128 + (y//16) * 10
                    b = 128 + ((x+y)//16) * 5
                elif i % 5 == 3:  # Road pattern
                    r = 80 + (y//8) * 5
                    g = 80 + (y//8) * 5
                    b = 80 + (y//8) * 5
                else:  # Mixed scene
                    r = 100 + (x*y) % 100
                    g = 150 + (x+y) % 80
                    b = 200 + (x-y) % 55
                
                pixels.append((min(r,255), min(g,255), min(b,255)))
        
        img.putdata(pixels)
        filepath = f'dataset/train/Normal/synthetic_{i + 1}.jpg'
        img.save(filepath)
    
    # Test images
    for i in range(20):
        img = Image.new('RGB', (128, 128))
        pixels = []
        
        for y in range(128):
            for x in range(128):
                # Create varied patterns
                r = (100 + i*5 + x//4) % 255
                g = (150 + i*3 + y//4) % 255
                b = (200 + i*2 + (x+y)//8) % 255
                pixels.append((r, g, b))
        
        img.putdata(pixels)
        filepath = f'dataset/test/Normal/synthetic_{i + 1}.jpg'
        img.save(filepath)
    
    print("Created 100 synthetic normal images with realistic patterns")

if __name__ == "__main__":
    print("Setting up normal day images for disaster classification...")
    
    # Try to stream real images first
    success = stream_normal_images()
    
    # If streaming failed, create synthetic ones
    if not success:
        create_realistic_normal_images()
    
    train_files = len(os.listdir('dataset/train/Normal'))
    test_files = len(os.listdir('dataset/test/Normal'))
    
    print(f"\nSetup complete!")
    print(f"Train images: {train_files}")
    print(f"Test images: {test_files}")
    print("\nNow run: python train_model.py")