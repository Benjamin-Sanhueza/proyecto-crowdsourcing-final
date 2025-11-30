import re
import os
from typing import List, Dict, Tuple, Pattern

def _load_patterns() -> List[Tuple[Pattern, str]]:
    """Carga los patrones de texto y categorías desde patterns_es.txt"""
    patterns = []
    path = os.path.join(os.path.dirname(__file__), "patterns_es.txt")

    if not os.path.exists(path):
        print("⚠️ Advertencia: No se encontró patterns_es.txt")
        return []

    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            # 1. Ignorar líneas vacías o comentarios
            if not line or line.startswith("#"):
                continue
            
            # 2. Ignorar líneas peligrosas (demasiado cortas) que marcarían todo
            if len(line) < 3: 
                continue

            # 3. Extraer {categoria} regex
            cat_match = re.match(r"\{(.*?)\}", line)
            if cat_match:
                cat = cat_match.group(1)
                patt_str = line[cat_match.end():].strip()
                
                try:
                    # Compilamos la regex
                    compiled = re.compile(patt_str, re.IGNORECASE) 
                    patterns.append((compiled, cat))
                except re.error:
                    print(f"❌ Error en regex: {patt_str}")
                    
    return patterns

def analyze_report(text: str) -> Dict:
    """Analiza un texto para detectar contenido basado en reglas."""
    if not text:
        return {"flag": False, "reasons": [], "severity": "leve"}

    text = text.lower()
    patterns = _load_patterns()
    reasons = set()

    for patt, cat in patterns:
        if patt.search(text):
            reasons.add(cat)

    # Si no se encontró nada, es un reporte limpio
    if not reasons:
        return {"flag": False, "reasons": [], "severity": "leve"}

    # Determinar severidad
    severity = "leve"
    if "amenaza" in reasons:
        severity = "grave"
    elif "insulto" in reasons:
        severity = "media"

    return {
        "flag": True,
        "reasons": sorted(list(reasons)),
        "severity": severity,
    }