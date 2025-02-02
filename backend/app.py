import os
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"  # Disable GPU
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"  # Suppress TensorFlow info and warning messages

from flask import Flask, request, jsonify, send_from_directory
import numpy as np
import joblib
import tensorflow as tf
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__, static_folder="../frontend/dist")  # Serve React build files
CORS(app)  # Enable CORS for frontend-backend communication

# Load the trained model and preprocessors
try:
    model = tf.keras.models.load_model("backend/disease_classification_model.keras")
    scaler = joblib.load("backend/scaler.pkl")
    label_encoder = joblib.load("backend/label_encoder.pkl")
    symptom_names = joblib.load("backend/symptom_names.pkl")  # Load all 377 symptoms
    num_features = len(symptom_names)  # Ensure we match model expectations
except Exception as e:
    print(f"Error loading model or preprocessing files: {e}")
    model, scaler, label_encoder, symptom_names = None, None, None, None

# Temporary fixes for predicted diseases
temporary_fix = {
    "panic disorder": "Take slow, deep breaths. Try grounding techniques like the 5-4-3-2-1 method (name 5 things you see, 4 things you touch, etc.).",
    "vocal cord polyp": "Rest your voice as much as possible. Stay hydrated and avoid whispering, as it strains the vocal cords.",
    "turner syndrome": "Manage symptoms with hormone therapy if prescribed. Stay hydrated and eat a balanced diet to support overall health.",
    "cryptorchidism": "Keep the groin area warm, as heat may help in mild cases. Seek medical evaluation if the testicle does not descend naturally.",
    "poisoning due to ethylene glycol": "Drink water to dilute the poison if conscious. Do not induce vomiting. Seek emergency medical care immediately.",
    "atrophic vaginitis": "Use over-the-counter vaginal moisturizers. Avoid scented soaps or douches that may worsen dryness.",
    "fracture of the hand": "Immobilize the hand with a splint. Apply ice to reduce swelling and seek medical attention for proper alignment.",
    "cellulitis or abscess of mouth": "Rinse with warm salt water. Keep the area clean and avoid touching it. Seek antibiotics if swelling worsens.",
    "eye alignment disorder": "Rest the eyes frequently. Covering one eye temporarily may help reduce strain. Consult an eye specialist for further evaluation.",
    "headache after lumbar puncture": "Lie flat for some time to relieve symptoms. Stay hydrated and drink caffeine (like coffee) to help close the spinal puncture site."
}

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    """Serve React frontend"""
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")

@app.route("/predict", methods=["POST"])
def predict():
    """Handle disease prediction based on symptoms"""
    try:
        if model is None or scaler is None or label_encoder is None:
            return jsonify({"error": "Model or pre-processing files not loaded"}), 500

        # Receive JSON input from frontend
        data = request.json
        input_symptoms = data.get("symptoms", [])

        if not input_symptoms:
            return jsonify({"error": "No symptoms provided"}), 400

        # Convert symptoms into a binary input vector of length 377
        input_vector = np.zeros(num_features)

        for symptom in input_symptoms:
            if symptom in symptom_names:
                index = symptom_names.index(symptom)
                input_vector[index] = 1  # Mark symptom as present

        # Reshape input for model prediction
        input_vector = scaler.transform([input_vector])  # Normalize
        prediction = model.predict(np.array(input_vector))

        # Get predicted disease
        predicted_label = np.argmax(prediction)
        predicted_disease = label_encoder.inverse_transform([predicted_label])[0]

        # Get the temporary fix if available
        fix = temporary_fix.get(predicted_disease, "No temporary fix available. Please consult a doctor.")

        return jsonify({"predicted_disease": predicted_disease, "temporary_fix": fix})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))  # Render dynamically assigns a port
    app.run(host="0.0.0.0", port=port)
