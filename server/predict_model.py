import os
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing import image

# --- SETTINGS ---
MODEL_PATH = 'final_disaster_model.h5'
JSON_PATH = 'class_indices.json'
IMG_WIDTH, IMG_HEIGHT = 128, 128

# 1. Load the Trained Model
if not os.path.exists(MODEL_PATH):
    print("ERROR: Model file not found. Did you run train_model.py?")
    exit()

print("Loading model...")
model = tf.keras.models.load_model(MODEL_PATH)

# 2. Load the Class Names (So we know 0=Cyclone, 1=Earthquake, etc.)
if os.path.exists(JSON_PATH):
    with open(JSON_PATH, 'r') as f:
        class_indices = json.load(f)
    # Flip the dictionary so numbers point to names: {0: 'Cyclone', 1: 'Earthquake'...}
    class_names = {v: k for k, v in class_indices.items()}
else:
    print("Warning: class_indices.json not found. Guessing based on folder order...")
    # Fallback if you didn't save the JSON
    class_names = {0: 'Cyclone', 1: 'Earthquake', 2: 'Flood', 3: 'Wildfire'}

def predict_disaster(image_path):
    if not os.path.exists(image_path):
        print(f"ERROR: Image {image_path} not found!")
        return

    # Load the image and resize it to match the training size
    img = image.load_img(image_path, target_size=(IMG_WIDTH, IMG_HEIGHT))
    
    # Convert to array and normalize (0-1)
    img_array = image.img_to_array(img)
    img_array = img_array / 255.0
    
    # Add an extra dimension because the model expects a batch of images (1, 128, 128, 3)
    img_array = np.expand_dims(img_array, axis=0)

    # Ask the Model to Predict
    predictions = model.predict(img_array)
    
    # The result is a list of probabilities, e.g., [0.1, 0.8, 0.05, 0.05]
    predicted_index = np.argmax(predictions) # Find the highest number
    predicted_label = class_names[predicted_index]
    confidence = predictions[0][predicted_index] * 100

    print(f"\n--------------------------------")
    print(f"I am {confidence:.2f}% sure this is: {predicted_label.upper()}")
    print(f"--------------------------------")

# --- RUN THE PREDICTION ---
# Change this filename if your image is named something else!
image_filename = 'test_image.jpg' 
predict_disaster(image_filename)