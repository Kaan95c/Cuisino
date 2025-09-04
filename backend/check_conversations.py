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

async def check_conversations():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print("🔍 Vérification des conversations et participants")
    
    # Trouver toutes les conversations
    conversations = await db.conversations.find({}).to_list(1000)
    print(f"📋 {len(conversations)} conversations trouvées")
    
    for conv in conversations:
        print(f"\n🔄 Conversation: {conv['_id']}")
        print(f"   Participants: {conv['participants']}")
        
        for participant_id in conv['participants']:
            print(f"   Vérification participant: {participant_id} (type: {type(participant_id)})")
            
            try:
                # Vérifier si c'est déjà un ObjectId ou une string
                if isinstance(participant_id, str):
                    obj_id = ObjectId(participant_id)
                else:
                    obj_id = participant_id
                
                # Chercher l'utilisateur
                user = await db.users.find_one({"_id": obj_id})
                if user:
                    print(f"     ✅ Utilisateur: {user.get('firstName', '')} {user.get('lastName', '')}")
                else:
                    print(f"     ❌ Utilisateur non trouvé pour: {obj_id}")
                    
                    # Chercher par string si c'était un ObjectId
                    if not isinstance(participant_id, str):
                        user_by_string = await db.users.find_one({"_id": str(participant_id)})
                        if user_by_string:
                            print(f"     ⚠️ Trouvé par string: {user_by_string.get('firstName', '')}")
                    
            except Exception as e:
                print(f"     ❌ Erreur: {e}")
        
        # Vérifier les messages non lus pour cette conversation
        messages = await db.messages.find({"conversationId": conv["_id"]}).to_list(100)
        print(f"   📨 {len(messages)} messages total")
        
        unread_messages = await db.messages.find({
            "conversationId": conv["_id"],
            "readAt": {"$exists": False}
        }).to_list(100)
        print(f"   📖 {len(unread_messages)} messages non lus")
        
        for msg in unread_messages:
            print(f"     - '{msg['content'][:30]}...' de {msg['senderId']}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_conversations())
