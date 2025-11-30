from rapidfuzz import fuzz
from typing import List, Optional

def find_similar_incident(new_text: str, existing_texts: List[str], threshold: int = 60) -> dict:
    """
    Motor de deduplicación MEJORADO.
    Compara el texto nuevo con los existentes usando lógica difusa (Fuzzy).
    """
    max_similarity = 0
    similar_incident = None
    
    if not existing_texts:
        return {"detected": False, "score": 0, "similar_to": None}

    # Normalizamos el texto nuevo
    text_lower = new_text.lower()

    for item in existing_texts:
        # item ahora es un string largo: "TITULO DESCRIPCION"
        # Comparamos el texto completo usando token_set_ratio
        score = fuzz.token_set_ratio(text_lower, item.lower())
        
        # Imprimimos en los logs para que tú puedas depurar en Render
        print(f"Comparando: '{new_text[:20]}...' vs '{item[:20]}...' -> Score: {score}")

        if score > max_similarity:
            max_similarity = score
            similar_incident = item
            
    # Si supera el umbral (ahora 60%), es duplicado
    is_duplicate = max_similarity > threshold

    return {
        "detected": is_duplicate,
        "score": max_similarity,
        "similar_to": similar_incident if is_duplicate else None
    }