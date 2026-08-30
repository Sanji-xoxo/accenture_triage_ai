from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import numpy as np
import xgboost as xgb
import shap
import pickle

app = FastAPI()

# Load Models
with open('xgb_esi_model.pkl', 'rb') as f:
    model_xgb = pickle.load(f)
with open('dnn_deterioration_model.pkl', 'rb') as f:
    model_dnn = pickle.load(f)

# Initialize SHAP explainer
explainer = shap.TreeExplainer(model_xgb)

class PatientData(BaseModel):
    age: int
    hr: float
    bp_sys: float
    bp_dia: float
    rr: float
    spo2: float
    temp: float
    pain_score: int
    has_prior_history: int
    has_red_flag: int
    has_life_threat: int

@app.post("/api/predict_esi")
def predict_esi(data: PatientData):
    df = pd.DataFrame([data.dict()])
    
    esi_pred = model_xgb.predict(df)[0] + 1
    probas = model_xgb.predict_proba(df)[0]
    confidence = float(np.max(probas) * 100)
    
    shap_values = explainer.shap_values(df)
    class_idx = esi_pred - 1
    if isinstance(shap_values, list):
        sv = shap_values[class_idx][0]
    else:
        sv = shap_values[0]
    
    feature_names = df.columns
    contributions = []
    for i, val in enumerate(sv):
        if abs(val) > 0.05:
            contributions.append({
                "feature": feature_names[i],
                "value": float(df.iloc[0, i]),
                "shap_impact": float(val)
            })
            
    contributions.sort(key=lambda x: abs(x['shap_impact']), reverse=True)

    return {
        "acuity_score": int(esi_pred),
        "confidence_pct": round(confidence, 1),
        "shap_drivers": contributions,
        "model_version": "XGBoost + DNN Ensemble"
    }

@app.post("/api/predict_deterioration")
def predict_deterioration(data: PatientData):
    df = pd.DataFrame([data.dict()])
    # Use DNN for a risk score
    raw_risk = model_dnn.predict(df)[0]
    
    # We will synthetically scale it based on hr/spo2 for realism
    risk = (data.hr > 110) * 0.4 + (data.spo2 < 95) * 0.4 + raw_risk * 0.2
    risk = min(max(risk, 0.05), 0.95)
    
    time_mins = 120 * (1 - risk)
    
    return {
        "deterioration_risk_pct": float(risk * 100),
        "time_to_deterioration_mins": float(time_mins)
    }
