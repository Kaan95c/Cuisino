#!/usr/bin/env python3
"""
Script pour mettre à jour la base de données avec les corrections de messagerie
"""

import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "cuisino")

async def main():
    print("🔧 Mise à jour de la base de données pour la messagerie...")
    
    # Connexion à MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    try:
        # 1. Nettoyer les collections de réactions (plus utilisées)
        print("🧹 Nettoyage des collections de réactions...")
        reactions_count = await db.reactions.count_documents({})
        if reactions_count > 0:
            await db.reactions.drop()
            print(f"✅ Collection 'reactions' supprimée ({reactions_count} documents)")
        
        # 2. Nettoyer le champ reactions des recettes
        print("🧹 Nettoyage du champ 'reactions' dans les recettes...")
        result = await db.recipes.update_many(
            {"reactions": {"$exists": True}},
            {"$unset": {"reactions": ""}}
        )
        print(f"✅ Champ 'reactions' supprimé de {result.modified_count} recettes")
        
        # 3. Vérifier et corriger la structure des conversations
        print("📋 Vérification des conversations...")
        conversations = await db.conversations.find({}).to_list(1000)
        
        for conv in conversations:
            needs_update = False
            update_doc = {}
            
            # Vérifier si lastMessage existe et a la bonne structure
            if "lastMessage" in conv and conv["lastMessage"]:
                last_msg = conv["lastMessage"]
                # Si lastMessage contient conversationId, le supprimer pour éviter la référence circulaire
                if "conversationId" in last_msg:
                    last_msg_clean = {k: v for k, v in last_msg.items() if k != "conversationId"}
                    update_doc["lastMessage"] = last_msg_clean
                    needs_update = True
            
            # Vérifier les timestamps
            if "updatedAt" not in conv:
                update_doc["updatedAt"] = conv.get("createdAt", datetime.now())
                needs_update = True
            
            if needs_update:
                await db.conversations.update_one(
                    {"_id": conv["_id"]},
                    {"$set": update_doc}
                )
        
        print(f"✅ {len(conversations)} conversations vérifiées")
        
        # 4. Vérifier et corriger la structure des messages
        print("💬 Vérification des messages...")
        messages = await db.messages.find({}).to_list(1000)
        
        for msg in messages:
            needs_update = False
            update_doc = {}
            
            # Vérifier les timestamps
            if "updatedAt" not in msg:
                update_doc["updatedAt"] = msg.get("createdAt", datetime.now())
                needs_update = True
            
            # Vérifier la structure du sender
            if "sender" in msg and isinstance(msg["sender"], dict):
                sender = msg["sender"]
                if "avatar" not in sender:
                    sender["avatar"] = "https://example.com/default-avatar.jpg"
                    update_doc["sender"] = sender
                    needs_update = True
            
            if needs_update:
                await db.messages.update_one(
                    {"_id": msg["_id"]},
                    {"$set": update_doc}
                )
        
        print(f"✅ {len(messages)} messages vérifiés")
        
        # 5. Créer les index nécessaires pour la messagerie
        print("🔍 Création des index pour la messagerie...")
        
        # Index pour conversations
        await db.conversations.create_index([("participants", 1), ("updatedAt", -1)])
        await db.conversations.create_index([("updatedAt", -1)])
        print("✅ Index créés pour 'conversations'")
        
        # Index pour messages
        await db.messages.create_index([("conversationId", 1), ("createdAt", 1)])
        await db.messages.create_index([("senderId", 1)])
        print("✅ Index créés pour 'messages'")
        
        # 6. Supprimer les index de réactions (plus nécessaires)
        try:
            await db.reactions.drop_indexes()
        except:
            pass  # Collection n'existe plus
        
        print("🎉 Mise à jour terminée avec succès!")
        
        print("\n📋 Résumé des modifications:")
        print("- ✅ Collections et champs de réactions supprimés")
        print("- ✅ Structure des conversations corrigée")
        print("- ✅ Structure des messages corrigée")
        print("- ✅ Index de messagerie créés")
        print("- ✅ Timestamps corrigés pour utiliser datetime.now()")
        
    except Exception as e:
        print(f"❌ Erreur lors de la mise à jour: {e}")
        raise
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())
