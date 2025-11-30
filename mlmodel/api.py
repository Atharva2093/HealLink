from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import onnxruntime as ort
import pickle
import numpy as np
import pandas as pd
from fuzzywuzzy import process, fuzz
from typing import Optional

app = FastAPI(
    title="HealLink ML API",
    description="Health risk prediction based on symptoms",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================================
#       LOAD MODEL + FILES
# ================================
session = ort.InferenceSession("heallink_model.onnx", providers=["CPUExecutionProvider"])
input_name = session.get_inputs()[0].name
output_name = session.get_outputs()[0].name

with open("symptom_encoder.pkl", "rb") as f:
    mlb = pickle.load(f)

with open("disease_encoder.pkl", "rb") as f:
    idx_to_disease = pickle.load(f)

all_symptoms = list(mlb.classes_)

# Load CSVs
desc_df = pd.read_csv("data/symptom_Description.csv")
prec_df = pd.read_csv("data/symptom_precaution.csv")
sev_df  = pd.read_csv("data/Symptom-severity.csv")

desc_df["Disease"] = desc_df["Disease"].str.lower().str.strip()
prec_df["Disease"] = prec_df["Disease"].str.lower().str.strip()

sev_map = dict(zip(sev_df["Symptom"].str.lower(), sev_df["weight"]))

class SymptomInput(BaseModel):
    """Request model for symptom prediction"""
    symptoms: list[str]

class PredictionResponse(BaseModel):
    """Response model for successful predictions"""
    input_symptoms: list[str]
    corrected_symptoms: list[str]
    top_3: list[tuple]
    predicted_disease: str
    confidence: float
    severity_score: int
    risk_level: str
    description: str
    precautions: list[str]

class ErrorResponse(BaseModel):
    """Response model for errors"""
    error: str

@app.get("/health")
def health_check():
    """Health check endpoint for service monitoring"""
    return {"status": "ok"}

# ================================
#   SYMPTOM MAPPERS & CORRECTION
# ================================
manual_map = {
    # GENERAL SYMPTOMS
    "cold": ["chills", "shivering", "continuous_sneezing"],
    "fever": ["high_fever", "chills"],
    "vomit": ["vomiting"],
    "head pain": ["headache"],
    "body pain": ["joint_pain", "muscle_pain"],
    
    # THROAT SYMPTOMS (ENT) - CRITICAL FIX
    "pain in throat": ["throat_irritation"],
    "throat pain": ["throat_irritation"],
    "throught": ["throat_irritation"],
    "sore throat": ["throat_irritation"],
    "throat hurting": ["throat_irritation"],
    "throat ache": ["throat_irritation"],
    "painful throat": ["throat_irritation"],
    
    # GI SYMPTOMS
    "stomach ache": ["stomach_pain"],
    "stomach pain": ["stomach_pain"],
    "belly pain": ["stomach_pain"],
    
    # BREATHING EMERGENCY SYMPTOMS (CRITICAL)
    "difficulty breathing": ["breathlessness"],
    "breathing difficulty": ["breathlessness"],
    "shortness of breath": ["breathlessness"],
    "severe shortness of breath": ["breathlessness"],
    "can't breathe": ["breathlessness"],
    "cannot breathe": ["breathlessness"],
    "gasping": ["breathlessness"],
    "breathless": ["breathlessness"],
    "hard to breathe": ["breathlessness"],
    "trouble breathing": ["breathlessness"],
    
    # CHEST SYMPTOMS (CARDIAC/RESPIRATORY)
    "chest tightness": ["chest_pain"],
    "tight chest": ["chest_pain"],
    "chest pressure": ["chest_pain"],
    "chest discomfort": ["chest_pain"]
}

nlp_map = {
    # GI SYMPTOMS
    "stomach ache": ["stomach_pain"],
    "stomach pain": ["stomach_pain"],
    "abdominal pain": ["stomach_pain"],
    "belly pain": ["stomach_pain"],
    "nauseous": ["nausea"],
    "loose motion": ["diarrhoea"],
    
    # RESPIRATORY SYMPTOMS
    "runny nose": ["runny_nose"],
    "stuffy nose": ["runny_nose"],
    "congestion": ["runny_nose"],
    
    # THROAT/ENT SYMPTOMS (NEVER MAP TO GI)
    "sore throat": ["throat_irritation"],
    "throat pain": ["throat_irritation"],
    "throat ache": ["throat_irritation"],
    
    # BREATHING EMERGENCIES
    "difficulty breathing": ["breathlessness"],
    "breathing problems": ["breathlessness"],
    "hard to breathe": ["breathlessness"],
    "breathing trouble": ["breathlessness"],
    "short of breath": ["breathlessness"],
    
    # CHEST SYMPTOMS
    "chest tight": ["chest_pain"],
    "chest pressure": ["chest_pain"],
    "chest discomfort": ["chest_pain"]
}

def correct_symptom(sym):
    s = sym.lower().strip()
    
    # BLOCK WRONG FUZZY MATCHES: Never map throat symptoms to GI
    blocked_mappings = [
        ("throat", "abdominal_pain"),
        ("throat", "acidity"),
        ("throat", "stomach_pain"),
        ("breathing", "abdominal_pain"),
        ("chest", "abdominal_pain")
    ]

    # Priority 1: Check nlp_map (most specific)
    for k, v in nlp_map.items():
        if k in s:
            return v[0]

    # Priority 2: Check manual_map
    for k, v in manual_map.items():
        if k in s:
            return v[0]

    # Priority 3: Exact match in all_symptoms
    if s in all_symptoms:
        return s

    # Priority 4: High-confidence fuzzy match (but block wrong mappings)
    match, score = process.extractOne(s, all_symptoms)
    if score >= 85:
        # Check if this is a blocked mapping
        for keyword, blocked_symptom in blocked_mappings:
            if keyword in s and match == blocked_symptom:
                return None  # Block wrong mapping
        return match

    # Priority 5: Partial ratio fuzzy match (even stricter blocking)
    match, score = process.extractOne(s, all_symptoms, scorer=fuzz.partial_ratio)
    if score >= 90:
        # Check if this is a blocked mapping
        for keyword, blocked_symptom in blocked_mappings:
            if keyword in s and match == blocked_symptom:
                return None  # Block wrong mapping
        return match

    return None


def expand_symptom(sym):
    s = sym.lower().strip()
    results = []

    for k, v in nlp_map.items():
        if k in s:
            results.extend(v)

    for k, v in manual_map.items():
        if k in s:
            results.extend(v)

    if not results:
        fixed = correct_symptom(s)
        if fixed:
            results.append(fixed)

    return list(set(results))

# ================================
#          MAIN PREDICTION
# ================================
@app.post("/predict")
def predict_api(data: SymptomInput):

    cleaned = []
    for s in data.symptoms:
        cleaned.extend(expand_symptom(s))

    if not cleaned:
        return {"error": "No valid symptoms found."}

    # Multi-hot encode
    X = mlb.transform([cleaned]).astype(np.float32)

    # ONNX inference
    preds = session.run([output_name], {input_name: X})[0][0]

    preds = preds / preds.sum()

    # Top-3 diseases
    top_idx = preds.argsort()[-3:][::-1]
    top3 = [(idx_to_disease[i], float(preds[i])) for i in top_idx]

    best_disease = top3[0][0].lower().strip()
    confidence = top3[0][1]

    # Description
    desc_row = desc_df[desc_df["Disease"] == best_disease]["Description"]
    description = desc_row.values[0] if len(desc_row) else "No description found."

    # Precautions
    p_row = prec_df[prec_df["Disease"] == best_disease]
    precautions = []
    if len(p_row):
        for col in ["Precaution_1", "Precaution_2", "Precaution_3", "Precaution_4"]:
            if col in p_row and not pd.isna(p_row[col].values[0]):
                precautions.append(p_row[col].values[0])

    # Severity calculation with proper bounds (0-20)
    raw_severity = sum(sev_map.get(s.lower(), 0) for s in cleaned)
    
    # Normalize severity to 0-20 scale based on number of symptoms and their weights
    max_possible_severity = len(cleaned) * 7  # Assume max weight per symptom is 7
    if max_possible_severity > 0:
        severity = min(20, int((raw_severity / max_possible_severity) * 20))
    else:
        severity = 0
    
    # MEDICAL ACCURACY: Throat-only symptoms should have lower severity (4-7)
    throat_only_symptoms = ["throat_irritation", "sore_throat"]
    is_throat_only = all(s.lower() in throat_only_symptoms for s in cleaned) and len(cleaned) <= 3
    
    if is_throat_only:
        # Simple throat issue = lower severity (4-7 range)
        severity = min(max(4, severity), 7)
    else:
        # For other cases, ensure minimum proportional severity
        symptom_count_factor = min(len(cleaned) * 2, 10)  # 2 points per symptom, max 10
        severity = max(severity, min(symptom_count_factor, 20))
    
    risk = "Low" if severity <= 6 else "Medium" if severity <= 12 else "High"

    return {
        "Input Symptoms": data.symptoms,
        "Corrected Symptoms": cleaned,
        "Top_3": top3,
        "Predicted Disease": best_disease,
        "Confidence": confidence,
        "Severity Score": severity,
        "Risk Level": risk,
        "Description": description,
        "Precautions": precautions,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)
