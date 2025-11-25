from rapidfuzz import fuzz
from typing import List, Optional

def find_similar_incident(new_text: str, existing_titles: List[str], threshold: int = 80) -> dict:
    """
    Motor de deduplicación usando RapidFuzz.
    Busca si el nuevo reporte se parece a títulos existentes.
    """
    max_similarity = 0
    similar_title = None
    
    if not existing_titles:
        return {"detected": False, "score": 0, "similar_to": None}

    # Normalizamos texto entrante
    text_lower = new_text.lower()

    for title in existing_titles:
        # fuzz.ratio compara la similitud total (0 a 100)
        ratio = fuzz.ratio(text_lower, title.lower())
        
        if ratio > max_similarity:
            max_similarity = ratio
            similar_title = title
            
    # Si supera el umbral (ej. 80%), es duplicado
    is_duplicate = max_similarity > threshold

    return {
        "detected": is_duplicate,
        "score": max_similarity,
        "similar_to": similar_title if is_duplicate else None
    }