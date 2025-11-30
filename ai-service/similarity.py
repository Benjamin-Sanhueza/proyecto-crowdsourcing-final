from rapidfuzz import fuzz
from typing import List, Optional

def find_similar_incident(new_text: str, existing_titles: List[str], threshold: int = 80) -> dict:
    """
    Motor de deduplicación usando RapidFuzz.
    """
    max_similarity = 0
    similar_title = None
    
    # Si la lista está vacía, retornamos resultado negativo
    if not existing_titles:
        return {
            "detected": False, 
            "score": 0, 
            "similar_to": None
        }

    text_lower = new_text.lower()

    for title in existing_titles:
        ratio = fuzz.ratio(text_lower, title.lower())
        
        if ratio > max_similarity:
            max_similarity = ratio
            similar_title = title
            
    is_duplicate = max_similarity > threshold

    return {
        "detected": is_duplicate,
        "score": max_similarity,
        "similar_to": similar_title if is_duplicate else None
    }