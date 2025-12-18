from datasets import load_dataset
import os
from PIL import Image
import requests
from io import BytesIO

# Create Normal directories
os.makedirs('dataset/train/Normal', exist_ok=True)
os.makedirs('dataset/test/Normal', exist_ok=True)

def download_normal_images():
    """Download normal day images from Places365 dataset"""
    
    print("Loading Places365 dataset...")
    
    try:
        # Load Places365 dataset (contains normal scenes)
        dataset = load_dataset("huggingface/places365", streaming=True, split="train")
        
        # Categories for normal scenes (no disasters)
        normal_categories = [
            "street", "building", "park", "office", "house", "road", 
            "city", "garden", "plaza", "courtyard", "campus", "market"
        ]
        
        count = 0
        train_count = 0
        test_count = 0
        
        print("Downloading normal scene images...")
        
        for sample in dataset:
            if count >= 100:  # Limit to 100 images
                break
                
            try:
                # Get image and label
                image = sample["image"]
                label = sample.get("label", "")
                
                # Check if it's a normal scene (not disaster-related)
                if any(cat in str(label).lower() for cat in normal_categories):
                    # Convert PIL image to RGB if needed
                    if image.mode != 'RGB':
                        image = image.convert('RGB')
                    
                    # Resize to model input size
                    image = image.resize((128, 128))
                    
                    # Save to train (80%) or test (20%)
                    if train_count < 80:
                        filepath = f'dataset/train/Normal/normal_{train_count + 1}.jpg'
                        train_count += 1
                    else:
                        filepath = f'dataset/test/Normal/normal_{test_count + 1}.jpg'
                        test_count += 1
                    
                    image.save(filepath)
                    print(f"Saved: {filepath}")
                    count += 1
                    
            except Exception as e:
                print(f"Error processing image: {e}")
                continue
                
    except Exception as e:
        print(f"Error loading dataset: {e}")
        print("Falling back to alternative method...")
        create_simple_normal_images()

def create_simple_normal_images():
    """Create simple normal images as fallback"""
    
    print("Creating simple normal day images...")
    
    # Create varied normal images
    for i in range(80):  # 80 for training
        # Create images with different colors/patterns for normal scenes
        if i % 4 == 0:  # Blue sky
            color = (135, 206, 235)
        elif i % 4 == 1:  # Green grass/trees
            color = (34, 139, 34)
        elif i % 4 == 2:  # Gray buildings
            color = (128, 128, 128)
        else:  # Brown/tan roads
            color = (210, 180, 140)
            
        img = Image.new('RGB', (128, 128), color=color)
        filepath = f'dataset/train/Normal/normal_{i + 1}.jpg'
        img.save(filepath)
    
    for i in range(20):  # 20 for testing
        color = (100 + i*5, 150 + i*3, 200 + i*2)
        img = Image.new('RGB', (128, 128), color=color)
        filepath = f'dataset/test/Normal/normal_{i + 1}.jpg'
        img.save(filepath)
    
    print("Created 100 normal day images (80 train, 20 test)")

if __name__ == "__main__":
    print("Downloading normal day images for disaster classification...")
    download_normal_images()
    
    train_files = len(os.listdir('dataset/train/Normal'))
    test_files = len(os.listdir('dataset/test/Normal'))
    
    print(f"\nSetup complete!")
    print(f"Train images: {train_files}")
    print(f"Test images: {test_files}")
    print("\nNow run: python train_model.py")