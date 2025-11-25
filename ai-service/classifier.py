import joblib
import os
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

# Rutas donde se guardará el modelo entrenado y el vectorizador
MODEL_PATH = os.path.join(os.path.dirname(__file__), "moderation_model.pkl")
VECTORIZER_PATH = os.path.join(os.path.dirname(__file__), "vectorizer.pkl")

def train_model(dataset_path: str):
    """
    (Esto se ejecuta 1 vez fuera de línea)
    Entrena un clasificador de toxicidad basado en TF-IDF + regresión logística.
    """
    # Carga el dataset (ej: un CSV con columnas "text" y "label")
    df = pd.read_csv(dataset_path)

    # Convierte el texto en vectores numéricos (TF-IDF)
    vectorizer = TfidfVectorizer(max_features=5000)
    X = vectorizer.fit_transform(df["text"])
    y = df["label"] # 0 = normal, 1 = tóxico

    # Entrena el modelo
    clf = LogisticRegression(max_iter=1000)
    clf.fit(X, y)

    # Guarda el modelo y el vectorizador en disco
    joblib.dump(clf, MODEL_PATH)
    joblib.dump(vectorizer, VECTORIZER_PATH)
    print("Modelo entrenado y guardado correctamente.")

def predict_toxicity(text: str) -> dict:
    """
    (Esto se ejecuta en tiempo real)
    Predice si un texto es tóxico usando el modelo entrenado.
    """
    # Si el modelo no ha sido entrenado, no hace nada
    if not os.path.exists(MODEL_PATH):
        return {"flag": False, "confidence": 0.0, "severity": "leve"}

    # Carga el modelo y el vectorizador desde el disco
    clf = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECTORIZER_PATH)

    # Convierte el nuevo texto usando el MISMO vectorizador
    X = vectorizer.transform([text])
    
    # Predice la probabilidad de que sea tóxico (label=1)
    proba = clf.predict_proba(X)[0][1] 
    flag = proba > 0.5 # Umbral de decisión

    # Asigna severidad basada en la confianza del modelo
    severity = "grave" if proba > 0.8 else "media" if proba > 0.5 else "leve"

    return {"flag": flag, "confidence": float(proba), "severity": severity}