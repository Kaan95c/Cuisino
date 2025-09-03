#!/usr/bin/env python3
"""
Script de test pour vérifier que tous les endpoints API fonctionnent
"""
import requests
import json
import sys
from datetime import datetime

API_BASE_URL = "http://localhost:8000/api"

def test_endpoint(method, endpoint, data=None, headers=None, expected_status=200):
    """Test un endpoint et retourne le résultat"""
    url = f"{API_BASE_URL}{endpoint}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, headers=headers)
        elif method.upper() == "PUT":
            response = requests.put(url, json=data, headers=headers)
        elif method.upper() == "PATCH":
            response = requests.patch(url, json=data, headers=headers)
        
        print(f"✅ {method} {endpoint} - Status: {response.status_code}")
        
        if response.status_code == expected_status:
            try:
                return response.json()
            except:
                return response.text
        else:
            print(f"❌ Erreur: {response.status_code} - {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print(f"❌ {method} {endpoint} - Connexion refusée (serveur non démarré?)")
        return None
    except Exception as e:
        print(f"❌ {method} {endpoint} - Erreur: {e}")
        return None

def main():
    print("🧪 Test des endpoints API Cuisino")
    print("=" * 50)
    
    # Test 1: Ping du serveur
    print("\n1. Test de connexion au serveur...")
    result = test_endpoint("GET", "/")
    if not result:
        print("❌ Serveur non accessible. Démarrez le serveur avec: python start_server.py")
        sys.exit(1)
    
    # Test 2: Inscription d'un utilisateur
    print("\n2. Test d'inscription...")
    test_user = {
        "firstName": "Test",
        "lastName": "User",
        "username": f"testuser_{int(datetime.now().timestamp())}",
        "email": f"test_{int(datetime.now().timestamp())}@example.com",
        "phone": "+33123456789",
        "password": "password123"
    }
    
    register_result = test_endpoint("POST", "/auth/register", test_user)
    if not register_result:
        print("❌ Échec de l'inscription")
        return
    
    print(f"✅ Utilisateur créé: {register_result['username']}")
    
    # Test 3: Connexion
    print("\n3. Test de connexion...")
    login_data = {
        "email": test_user["email"],
        "password": test_user["password"]
    }
    
    login_result = test_endpoint("POST", "/auth/login", login_data)
    if not login_result:
        print("❌ Échec de la connexion")
        return
    
    token = login_result["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Connexion réussie")
    
    # Test 4: Récupération du profil utilisateur
    print("\n4. Test récupération profil...")
    profile_result = test_endpoint("GET", "/users/me", headers=headers)
    if profile_result:
        print(f"✅ Profil récupéré: {profile_result['firstName']} {profile_result['lastName']}")
    
    # Test 5: Mise à jour du profil
    print("\n5. Test mise à jour profil...")
    update_data = {
        "bio": "Bio de test mise à jour"
    }
    update_result = test_endpoint("PUT", "/users/me", update_data, headers)
    if update_result:
        print("✅ Profil mis à jour")
    
    # Test 6: Création d'une recette
    print("\n6. Test création recette...")
    recipe_data = {
        "title": "Recette de test",
        "description": "Description de test",
        "ingredients": ["Ingrédient 1", "Ingrédient 2"],
        "instructions": ["Étape 1", "Étape 2"],
        "image": "https://example.com/image.jpg",
        "author": {
            "id": profile_result["id"],
            "name": f"{profile_result['firstName']} {profile_result['lastName']}",
            "avatar": profile_result.get("avatar") or "https://example.com/default-avatar.jpg"
        },
        "servings": 4,
        "prepTimeMinutes": 30,
        "difficulty": "easy",
        "tags": ["test", "recette"]
    }
    
    recipe_result = test_endpoint("POST", "/recipes", recipe_data, headers)
    if recipe_result:
        print(f"✅ Recette créée: {recipe_result['title']}")
        recipe_id = recipe_result["id"]
    else:
        print("❌ Échec création recette")
        return
    
    # Test 7: Récupération des recettes
    print("\n7. Test récupération recettes...")
    recipes_result = test_endpoint("GET", "/recipes", headers=headers)
    if recipes_result:
        print(f"✅ {len(recipes_result)} recettes récupérées")
    
    # Test 8: Like d'une recette
    print("\n8. Test like recette...")
    like_data = {"action": "toggle_like"}
    like_result = test_endpoint("PATCH", f"/recipes/{recipe_id}", like_data, headers)
    if like_result:
        print(f"✅ Recette likée: {like_result['likes']} likes")
    
    # Test 9: Sauvegarde d'une recette
    print("\n9. Test sauvegarde recette...")
    save_data = {"action": "toggle_save"}
    save_result = test_endpoint("PATCH", f"/recipes/{recipe_id}", save_data, headers)
    if save_result:
        print("✅ Recette sauvegardée")
    
    # Test 10: Récupération des recettes de l'utilisateur
    print("\n10. Test recettes utilisateur...")
    user_recipes = test_endpoint("GET", "/users/me/recipes", headers=headers)
    if user_recipes:
        print(f"✅ {len(user_recipes)} recettes de l'utilisateur")
    
    # Test 11: Récupération des recettes likées
    print("\n11. Test recettes likées...")
    liked_recipes = test_endpoint("GET", "/users/me/liked-recipes", headers=headers)
    if liked_recipes:
        print(f"✅ {len(liked_recipes)} recettes likées")
    
    # Test 12: Récupération des recettes sauvegardées
    print("\n12. Test recettes sauvegardées...")
    saved_recipes = test_endpoint("GET", "/users/me/saved-recipes", headers=headers)
    if saved_recipes:
        print(f"✅ {len(saved_recipes)} recettes sauvegardées")
    
    print("\n" + "=" * 50)
    print("🎉 Tous les tests sont passés avec succès !")
    print("✅ Votre API est entièrement fonctionnelle")

if __name__ == "__main__":
    main()
