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

async def fix_conversation_participants():
    # Connexion à MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print("🔧 Correction des participants de conversation")
    
    # ID correct de la deuxième personne
    correct_user_id = ObjectId("68b88bc502a5cf5e59d8fa05")
    
    # Vérifier que cet utilisateur existe
    user = await db.users.find_one({"_id": correct_user_id})
    if not user:
        print(f"❌ Utilisateur {correct_user_id} non trouvé")
        client.close()
        return
    
    print(f"✅ Utilisateur trouvé: {user.get('firstName', '')} {user.get('lastName', '')}")
    
    # Trouver toutes les conversations avec des participants invalides
    conversations = await db.conversations.find({}).to_list(1000)
    
    for conv in conversations:
        print(f"\n🔄 Vérification conversation: {conv['_id']}")
        participants = conv['participants']
        print(f"   Participants actuels: {participants}")
        
        # Vérifier chaque participant
        valid_participants = []
        needs_fix = False
        
        for participant_id in participants:
            try:
                # Convertir en ObjectId si c'est une string
                if isinstance(participant_id, str):
                    obj_id = ObjectId(participant_id)
                else:
                    obj_id = participant_id
                
                # Vérifier si l'utilisateur existe
                user_exists = await db.users.find_one({"_id": obj_id})
                if user_exists:
                    valid_participants.append(obj_id)
                    print(f"   ✅ Participant valide: {obj_id}")
                else:
                    print(f"   ❌ Participant invalide: {participant_id}")
                    needs_fix = True
                    
            except Exception as e:
                print(f"   ❌ ID invalide: {participant_id} - {e}")
                needs_fix = True
        
        # Si on a besoin de corriger et qu'il n'y a qu'un participant valide
        if needs_fix and len(valid_participants) == 1:
            print(f"   🔧 Ajout du participant manquant: {correct_user_id}")
            valid_participants.append(correct_user_id)
            
            # Mettre à jour la conversation
            result = await db.conversations.update_one(
                {"_id": conv["_id"]},
                {"$set": {"participants": valid_participants}}
            )
            
            if result.modified_count > 0:
                print(f"   ✅ Conversation mise à jour")
            else:
                print(f"   ❌ Échec de la mise à jour")
        
        elif needs_fix:
            print(f"   ⚠️ Conversation nécessite une attention manuelle")
    
    print("\n🎉 Correction terminée")
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_conversation_participants())
