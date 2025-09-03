#!/usr/bin/env python3
"""
Script pour tester la connexion MongoDB
"""
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

# Charger les variables d'environnement
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def test_mongo_connection():
    print("🔍 Test de connexion MongoDB")
    print("=" * 50)
    
    # Configuration
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'cuisino')
    
    print(f"📡 URL MongoDB: {mongo_url}")
    print(f"📊 Base de données: {db_name}")
    
    try:
        # Connexion
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        # Test de connexion
        await client.admin.command('ping')
        print("✅ Connexion MongoDB réussie")
        
        # Lister les collections
        collections = await db.list_collection_names()
        print(f"📁 Collections trouvées: {collections}")
        
        # Compter les recettes
        recipes_count = await db.recipes.count_documents({})
        print(f"📝 Nombre de recettes: {recipes_count}")
        
        # Compter les utilisateurs
        users_count = await db.users.count_documents({})
        print(f"👥 Nombre d'utilisateurs: {users_count}")
        
        # Afficher quelques recettes si elles existent
        if recipes_count > 0:
            print("\n📋 Premières recettes:")
            recipes = await db.recipes.find({}).limit(3).to_list(3)
            for i, recipe in enumerate(recipes):
                print(f"  {i+1}. {recipe.get('title', 'Sans titre')} (ID: {recipe.get('_id')})")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Erreur de connexion: {e}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_mongo_connection())
