#!/usr/bin/env python3
"""
Script pour initialiser les nouvelles collections MongoDB pour Cuisino
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

# Charger les variables d'environnement
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def init_database():
    """Initialise les nouvelles collections et met à jour les recettes existantes"""
    
    # Connexion MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🔧 Initialisation de la base de données Cuisino...")
    
    # 1. Créer les nouvelles collections si elles n'existent pas
    collections = await db.list_collection_names()
    
    if 'reactions' not in collections:
        await db.create_collection('reactions')
        print("✅ Collection 'reactions' créée")
    
    if 'mentions' not in collections:
        await db.create_collection('mentions')
        print("✅ Collection 'mentions' créée")
    
    # 2. Mettre à jour les recettes existantes pour ajouter le champ reactions
    recipes_count = await db.recipes.count_documents({})
    print(f"📊 {recipes_count} recettes trouvées")
    
    if recipes_count > 0:
        # Ajouter le champ reactions aux recettes qui ne l'ont pas
        result = await db.recipes.update_many(
            {"reactions": {"$exists": False}},
            {"$set": {
                "reactions": {
                    "😍": 0,
                    "🤤": 0,
                    "🔥": 0,
                    "👏": 0
                }
            }}
        )
        print(f"✅ {result.modified_count} recettes mises à jour avec le système de réactions")
    
    # 3. Créer les index pour optimiser les performances
    print("🔍 Création des index pour les performances...")
    
    # Index pour reactions
    await db.reactions.create_index([("userId", 1), ("recipeId", 1)], unique=True)
    await db.reactions.create_index([("recipeId", 1), ("createdAt", -1)])
    await db.reactions.create_index([("emoji", 1), ("createdAt", -1)])
    print("✅ Index créés pour la collection 'reactions'")
    
    # Index pour mentions
    await db.mentions.create_index([("commentId", 1)])
    await db.mentions.create_index([("mentionedUserId", 1), ("createdAt", -1)])
    await db.mentions.create_index([("mentionedByUserId", 1), ("createdAt", -1)])
    print("✅ Index créés pour la collection 'mentions'")
    
    # Index pour recipes (si pas déjà créés)
    await db.recipes.create_index([("createdAt", -1)])
    await db.recipes.create_index([("author.id", 1), ("createdAt", -1)])
    print("✅ Index créés pour la collection 'recipes'")
    
    # Index pour users
    await db.users.create_index([("email", 1)], unique=True)
    await db.users.create_index([("username", 1)], unique=True)
    print("✅ Index créés pour la collection 'users'")
    
    # Index pour user_likes et user_saves
    await db.user_likes.create_index([("userId", 1), ("recipeId", 1)], unique=True)
    await db.user_saves.create_index([("userId", 1), ("recipeId", 1)], unique=True)
    print("✅ Index créés pour les collections 'user_likes' et 'user_saves'")
    
    # Index pour comments
    await db.comments.create_index([("recipeId", 1), ("createdAt", -1)])
    await db.comments.create_index([("authorId", 1), ("createdAt", -1)])
    print("✅ Index créés pour la collection 'comments'")
    
    print("🎉 Initialisation terminée avec succès!")
    print("\n📋 Résumé des modifications:")
    print("- ✅ Collections 'reactions' et 'mentions' créées")
    print("- ✅ Champ 'reactions' ajouté aux recettes existantes")
    print("- ✅ Index de performance créés")
    print("- ✅ Votre application est prête pour les nouvelles fonctionnalités!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(init_database())
