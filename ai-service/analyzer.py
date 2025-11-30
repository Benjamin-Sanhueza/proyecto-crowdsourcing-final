import re
import os
from typing import List, Dict, Tuple, Pattern

def _load_patterns() -> List[Tuple[Pattern, str]]:
    """
    Carga y compila los patrones de expresiones regulares desde patterns_es.txt.
    Incluye manejo de errores para evitar fallos por líneas vacías o mal formateadas.
    """
    patterns = []
    # Construcción segura de la ruta al archivo, independiente del sistema operativo
    path = os.path.join(os.path.dirname(__file__), "patterns_es.txt")

    if not os.path.exists(path):
        print(f"⚠️ Advertencia: No se encontró el archivo de reglas en {path}")
        return []

    try:
        with open(path, encoding="utf-8") as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                
                # 1. Ignorar líneas vacías o comentarios
                if not line or line.startswith("#"):
                    continue
                
                # 2. Ignorar líneas sospechosamente cortas (evita falsos positivos masivos)
                if len(line) < 3: 
                    continue

                # 3. Extraer formato {CATEGORIA} EXPRESION
                # Ejemplo: {insulto} (tonto|idiota)
                cat_match = re.match(r"\{(.*?)\}", line)
                if cat_match:
                    category = cat_match.group(1)
                    # Extraemos la regex que está después de la categoría
                    regex_str = line[cat_match.end():].strip()
                    
                    try:
                        # Compilamos la regex ignorando mayúsculas/minúsculas para optimizar rendimiento
                        compiled_regex = re.compile(regex_str, re.IGNORECASE) 
                        patterns.append((compiled_regex, category))
                    except re.error as e:
                        print(f"❌ Error de sintaxis Regex en línea {line_num}: {regex_str} -> {e}")

    except Exception as e:
        print(f"❌ Error crítico leyendo patterns_es.txt: {e}")
                    
    return patterns

def analyze_report(text: str) -> Dict:
    """
    Motor Determinista (Nivel 1):
    Analiza el texto buscando coincidencias exactas con la base de conocimiento.
    
    Args:
        text (str): El contenido combinado (título + descripción) del reporte.
        
    Returns:
        Dict: Estructura con bandera de detección, razones y severidad calculada.
    """
    # Si el texto viene vacío, retornamos limpio inmediatamente
    if not text:
        return {"flag": False, "reasons": [], "severity": "leve"}

    text_lower = text.lower()
    patterns = _load_patterns()
    detected_reasons = set()

    # Barrido de patrones
    for pattern, category in patterns:
        if pattern.search(text_lower):
            detected_reasons.add(category)

    # Si no se encontró nada, reporte limpio
    if not detected_reasons:
        return {"flag": False, "reasons": [], "severity": "leve"}

    # Lógica de Severidad
    # - Amenazas o Violencia -> GRAVE (Prioridad Alta)
    # - Insultos -> MEDIA (Prioridad Media)
    # - Spam -> LEVE (Prioridad Baja)
    severity = "leve"
    if "amenaza" in detected_reasons or "violencia" in detected_reasons:
        severity = "grave"
    elif "insulto" in detected_reasons:
        severity = "media"

    return {
        "flag": True,
        "reasons": sorted(list(detected_reasons)),
        "severity": severity,
    }