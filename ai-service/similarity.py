from rapidfuzz import fuzz
from typing import List, Optional

# CAMBIO: Bajamos el umbral de 80 a 70 para detectar más duplicados
def find_similar_incident(new_text: str, existing_titles: List[str], threshold: int = 70) -> dict:
    """
    Motor de deduplicación usando RapidFuzz.
    """
    max_similarity = 0
    similar_title = None
    
    if not existing_titles:
        return {
            "detected": False, 
            "score": 0, 
            "similar_to": None
        }

    text_lower = new_text.lower()

    for title in existing_titles:
        # Usamos token_set_ratio que es mejor para palabras desordenadas
        # Ej: "Fuga de agua" vs "Agua con fuga" lo detecta bien.
        ratio = fuzz.token_set_ratio(text_lower, title.lower())
        
        if ratio > max_similarity:
            max_similarity = ratio
            similar_title = title
            
    is_duplicate = max_similarity > threshold

    return {
        "detected": is_duplicate,
        "score": max_similarity,
        "similar_to": similar_title if is_duplicate else None
    }