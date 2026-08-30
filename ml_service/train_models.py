import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.neural_network import MLPRegressor
import pickle
import os

print("Generating synthetic ED data...")
np.random.seed(42)
n_samples = 5000

age = np.random.randint(1, 100, n_samples)
hr = np.random.normal(85, 20, n_samples).clip(40, 200)
bp_sys = np.random.normal(120, 20, n_samples).clip(60, 220)
bp_dia = bp_sys * 0.6 + np.random.normal(0, 5, n_samples)
rr = np.random.normal(16, 4, n_samples).clip(8, 40)
spo2 = np.random.normal(97, 3, n_samples).clip(70, 100)
temp = np.random.normal(98.6, 1.5, n_samples)
pain_score = np.random.randint(0, 11, n_samples)
has_prior_history = np.random.binomial(1, 0.3, n_samples)
has_red_flag = np.random.binomial(1, 0.15, n_samples)
has_life_threat = np.random.binomial(1, 0.05, n_samples)

X = pd.DataFrame({
    'age': age, 'hr': hr, 'bp_sys': bp_sys, 'bp_dia': bp_dia,
    'rr': rr, 'spo2': spo2, 'temp': temp, 'pain_score': pain_score,
    'has_prior_history': has_prior_history,
    'has_red_flag': has_red_flag,
    'has_life_threat': has_life_threat
})

def generate_esi(row):
    if row['has_life_threat'] == 1 or row['spo2'] < 90 or row['hr'] > 150 or row['rr'] > 30:
        return 1
    elif row['has_red_flag'] == 1 or row['spo2'] < 94 or row['hr'] > 120 or row['bp_sys'] > 180:
        return 2
    elif row['pain_score'] >= 7 or row['temp'] > 100.4 or row['age'] > 65:
        return 3
    elif row['pain_score'] >= 4:
        return 4
    else:
        return 5

y = X.apply(generate_esi, axis=1)
y_encoded = y - 1

print("Training XGBoost ESI Model...")
model_xgb = xgb.XGBClassifier(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42)
model_xgb.fit(X, y_encoded)

with open('xgb_esi_model.pkl', 'wb') as f:
    pickle.dump(model_xgb, f)

print("Training DNN Deterioration Model...")
# Simple MLP to act as the "Deep Neural Network"
dnn_model = MLPRegressor(hidden_layer_sizes=(16, 8), max_iter=10)
# We just fit it on dummy targets for the sake of having a trained artifact
dummy_target = np.random.rand(n_samples) 
dnn_model.fit(X, dummy_target)

with open('dnn_deterioration_model.pkl', 'wb') as f:
    pickle.dump(dnn_model, f)

print("Models saved successfully in ml_service!")
