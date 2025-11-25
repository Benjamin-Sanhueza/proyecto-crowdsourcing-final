from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List

# Importamos los 3 motores
try:
    from analyzer import analyze_report       # Motor 1: Reglas
    from classifier import predict_toxicity   # Motor 2: ML
    from similarity import find_similar_incident # Motor 3: Deduplicación
except ImportError as e:
    # Fallback de seguridad
    print(f"Error importando módulos: {e}")
    def analyze_report(text): return {"flag": False, "reasons": [], "severity": "leve"}
    def predict_toxicity(text): return {"flag": False, "confidence": 0.0, "severity": "leve"}
    def find_similar_incident(text, titles): return {"detected": False, "score": 0}

app = FastAPI()

class ModerationRequest(BaseModel):
    text: str
    existing_titles: List[str] = []

@app.get("/")
def read_root():
    return {"status": "AI Module Online", "version": "Final"}

@app.post("/moderate")
def moderate_text(payload: ModerationRequest):
    try:
        # 1. Ejecutar Analyzer (Regex)
        regex_result = analyze_report(payload.text)
        
        # 2. Ejecutar Classifier (ML)
        ml_result = predict_toxicity(payload.text)

        # 3. Ejecutar Similarity (Deduplicación)
        dedup_result = find_similar_incident(payload.text, payload.existing_titles)

        # Lógica de Fusión
        is_toxic = regex_result["flag"] or ml_result["flag"]
        
        # Calcular severidad máxima
        severity = "leve"
        if regex_result["severity"] == "grave" or ml_result["severity"] == "grave":
            severity = "grave"
        elif regex_result["severity"] == "media" or ml_result["severity"] == "media":
            severity = "media"

        return {
            "is_toxic": is_toxic,
            "moderation_flag": is_toxic,
            "reasons": regex_result.get("reasons", []),
            "severity": severity,
            "duplicate_detected": dedup_result["detected"],     # Viene de similarity.py
            "similarity_score": dedup_result["score"],          # Viene de similarity.py
            "similar_to": dedup_result["similar_to"]            # Viene de similarity.py
        }

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))