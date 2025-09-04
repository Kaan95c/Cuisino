import pymongo
from bson import ObjectId

# Connexion directe
client = pymongo.MongoClient("mongodb://localhost:27017")
db = client.cuisino

print("🔍 Vérification simple des conversations")

# Trouver toutes les conversations
conversations = list(db.conversations.find({}))
print(f"📋 {len(conversations)} conversations trouvées")

for conv in conversations:
    print(f"\n🔄 Conversation: {conv['_id']}")
    print(f"   Participants: {conv['participants']}")
    
    for participant_id in conv['participants']:
        print(f"   Participant: {participant_id} (type: {type(participant_id)})")
        
        try:
            # Chercher l'utilisateur
            user = db.users.find_one({"_id": participant_id})
            if user:
                print(f"     ✅ Utilisateur: {user.get('firstName', '')} {user.get('lastName', '')}")
            else:
                print(f"     ❌ Utilisateur non trouvé")
        except Exception as e:
            print(f"     ❌ Erreur: {e}")
    
    # Messages non lus
    unread_messages = list(db.messages.find({
        "conversationId": conv["_id"],
        "readAt": {"$exists": False}
    }))
    print(f"   📖 {len(unread_messages)} messages non lus")

client.close()
