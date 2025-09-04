import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Configuration MongoDB
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "cuisino")

async def debug_unread_messages():
    # Connexion à MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print("🔍 Debug des messages non lus")
    
    # Trouver toutes les conversations
    conversations = await db.conversations.find({}).to_list(1000)
    print(f"📋 {len(conversations)} conversations trouvées")
    
    for conv in conversations:
        print(f"\n🔄 Conversation: {conv['_id']}")
        print(f"   Participants: {conv['participants']}")
        
        # Vérifier les participants
        for participant_id in conv['participants']:
            print(f"   Participant ID: {participant_id} (type: {type(participant_id)})")
            
            # Vérifier si c'est un ObjectId valide
            try:
                if isinstance(participant_id, str):
                    obj_id = ObjectId(participant_id)
                else:
                    obj_id = participant_id
                
                user = await db.users.find_one({"_id": obj_id})
                if user:
                    print(f"     ✅ Utilisateur trouvé: {user.get('firstName', '')} {user.get('lastName', '')}")
                else:
                    print(f"     ❌ Utilisateur non trouvé pour ID: {obj_id}")
            except Exception as e:
                print(f"     ❌ ID invalide: {participant_id} - Erreur: {e}")
        
        # Compter les messages dans cette conversation
        messages = await db.messages.find({"conversationId": conv["_id"]}).to_list(1000)
        print(f"   📨 {len(messages)} messages dans cette conversation")
        
        # Compter les messages non lus pour chaque participant
        for participant_id in conv['participants']:
            try:
                if isinstance(participant_id, str):
                    user_id = ObjectId(participant_id)
                else:
                    user_id = participant_id
                
                unread_count = await db.messages.count_documents({
                    "conversationId": conv["_id"],
                    "senderId": {"$ne": str(user_id)},
                    "readAt": {"$exists": False}
                })
                print(f"   📖 Messages non lus pour {user_id}: {unread_count}")
                
                # Afficher les messages non lus
                unread_messages = await db.messages.find({
                    "conversationId": conv["_id"],
                    "senderId": {"$ne": str(user_id)},
                    "readAt": {"$exists": False}
                }).to_list(100)
                
                for msg in unread_messages:
                    print(f"     - Message non lu: '{msg['content'][:50]}...' de {msg['senderId']}")
                    
            except Exception as e:
                print(f"   ❌ Erreur pour participant {participant_id}: {e}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(debug_unread_messages())
