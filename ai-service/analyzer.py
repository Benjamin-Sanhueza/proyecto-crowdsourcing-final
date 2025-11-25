import re
import os
from typing import List, Dict

def _load_patterns() -> List[tuple]:
    """Carga los patrones de texto y categorías desde patterns_es.txt"""
    patterns = []
    # Construye la ruta al archivo de patrones de forma segura
    path = os.path.join(os.path.dirname(__file__), "patterns_es.txt")

    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            # Ignora comentarios y líneas vacías
            if not line or line.startswith("#"):
                continue
            
            # Busca el formato {categoria} y lo separa de la regex
            cat_match = re.match(r"\{(.*?)\}", line)
            if cat_match:
                cat = cat_match.group(1)
                patt = line[cat_match.end():].strip()
                # Compila la regex ignorando mayúsculas/minúsculas
                compiled = re.compile(patt, re.IGNORECASE) 
                patterns.append((compiled, cat))
    return patterns

def analyze_report(text: str) -> Dict:
    """Analiza un texto para detectar contenido basado en reglas."""
    text = text.lower()
    patterns = _load_patterns()
    reasons = set() #un 'set' para evitar razones duplicadas

    for patt, cat in patterns:
        if patt.search(text):
            reasons.add(cat)

    # Si no se encontró nada, es un reporte limpio
    if not reasons:
        return {"flag": False, "reasons": [], "severity": "leve"}

    # Variable de entorno para "modo estricto"
    strict = os.getenv("MOD_STRICT", "false").lower() == "true"

    # Definir severidad basada en las categorías encontradas
    if "amenaza" in reasons or "violencia" in reasons:
        sev = "grave"
    elif "insulto" in reasons:
        # En modo estricto, un insulto se considera grave
        sev = "media" if not strict else "grave"
    else:
        sev = "leve" # Para otras categorías como 'spam'

    return {
        "flag": True,
        "reasons": sorted(list(reasons)),
        "severity": sev,
    }