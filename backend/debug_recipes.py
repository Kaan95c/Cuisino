#!/usr/bin/env python3
"""
Script de debug pour vérifier les recettes dans la base de données
"""
import requests
import json

API_BASE_URL = "http://localhost:8000/api"

def debug_recipes():
    print("🔍 Debug des recettes dans la base de données")
    print("=" * 50)
    
    try:
        # Récupérer toutes les recettes
        response = requests.get(f"{API_BASE_URL}/recipes")
        
        if response.status_code == 200:
            recipes = response.json()
            print(f"✅ {len(recipes)} recettes trouvées")
            
            for i, recipe in enumerate(recipes):
                print(f"\n📝 Recette {i+1}:")
                print(f"   ID: {recipe.get('id', 'N/A')}")
                print(f"   Titre: {recipe.get('title', 'N/A')}")
                print(f"   Auteur: {recipe.get('author', {}).get('name', 'N/A')}")
                print(f"   Créée: {recipe.get('createdAt', 'N/A')}")
                
                # Tester l'accès à cette recette
                recipe_id = recipe.get('id')
                if recipe_id:
                    detail_response = requests.get(f"{API_BASE_URL}/recipes/{recipe_id}")
                    if detail_response.status_code == 200:
                        print(f"   ✅ Accessible via /recipes/{recipe_id}")
                    else:
                        print(f"   ❌ Non accessible via /recipes/{recipe_id} (status: {detail_response.status_code})")
        else:
            print(f"❌ Erreur lors de la récupération des recettes: {response.status_code}")
            print(f"Réponse: {response.text}")
            
    except Exception as e:
        print(f"❌ Erreur: {e}")

if __name__ == "__main__":
    debug_recipes()
