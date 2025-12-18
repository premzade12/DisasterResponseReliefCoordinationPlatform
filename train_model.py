import os
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout
from PIL import Image, ImageFile

# FIX: Some downloaded images might be corrupt/truncated. This setting fixes that error.
ImageFile.LOAD_TRUNCATED_IMAGES = True

# --- SETTINGS ---
IMG_WIDTH, IMG_HEIGHT = 128, 128
BATCH_SIZE = 32
EPOCHS = 20                 # We will run 20 rounds of training for better accuracy
DATASET_PATH = 'dataset'    # This matches your folder name

# --- STEP 1: LOAD AND PROCESS IMAGES ---
print("Initializing Data Generators...")

# Training Data: We add "Augmentation" (zooms/flips) to make the AI smarter
train_datagen = ImageDataGenerator(
    rescale=1./255,         # Normalize colors to 0-1
    shear_range=0.2,        # Random slant
    zoom_range=0.2,         # Random zoom
    horizontal_flip=True    # Flip left/right
)

# Test Data: Only rescale, no random changes
test_datagen = ImageDataGenerator(rescale=1./255)

# Load Train Set
print("\n--- Loading Training Data ---")
train_set = train_datagen.flow_from_directory(
    directory=os.path.join(DATASET_PATH, 'train'),
    target_size=(IMG_WIDTH, IMG_HEIGHT),
    batch_size=BATCH_SIZE,
    class_mode='categorical' # 'categorical' because we have multiple classes including Normal
)

# Load Test Set
print("\n--- Loading Test Data ---")
test_set = test_datagen.flow_from_directory(
    directory=os.path.join(DATASET_PATH, 'test'),
    target_size=(IMG_WIDTH, IMG_HEIGHT),
    batch_size=BATCH_SIZE,
    class_mode='categorical'
)

# Identify the classes
class_names = list(train_set.class_indices.keys())
print(f"\nSUCCESS: Found {len(class_names)} classes: {class_names}")

# --- STEP 2: BUILD THE CNN (The Brain) ---
model = Sequential()

# Layer 1: Convolution
model.add(Conv2D(32, (3, 3), input_shape=(IMG_WIDTH, IMG_HEIGHT, 3), activation='relu'))
model.add(MaxPooling2D(pool_size=(2, 2)))

# Layer 2: Convolution
model.add(Conv2D(64, (3, 3), activation='relu'))
model.add(MaxPooling2D(pool_size=(2, 2)))

# Layer 3: Convolution
model.add(Conv2D(128, (3, 3), activation='relu'))
model.add(MaxPooling2D(pool_size=(2, 2)))

# Flatten to 1D
model.add(Flatten())

# Dense Layers (Reasoning)
model.add(Dense(units=128, activation='relu'))
model.add(Dropout(0.5)) # Prevents memorization

# Output Layer
model.add(Dense(units=len(class_names), activation='softmax'))

# --- STEP 3: COMPILE AND TRAIN ---
model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

print("\n--- Starting Training (This may take 5-10 mins) ---")
history = model.fit(
    x=train_set,
    validation_data=test_set,
    epochs=EPOCHS
)

# --- STEP 4: SAVE THE MODEL ---
model.save('final_disaster_model.h5')
print("\n--------------------------------------")
print("TRAINING COMPLETE!")
print("Model saved as: final_disaster_model.h5")
print("--------------------------------------")

# Save class indices for later use
import json
with open('class_indices.json', 'w') as f:
    json.dump(train_set.class_indices, f)