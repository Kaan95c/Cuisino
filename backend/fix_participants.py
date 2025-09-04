import pymongo
from bson import ObjectId

# Connexion directe
client = pymongo.MongoClient("mongodb://localhost:27017")
db = client.cuisino

print("🔧 Correction des participants de conversation")

# ID correct de la deuxième personne
correct_user_id = ObjectId("68b88bc502a5cf5e59d8fa05")

# Vérifier que cet utilisateur existe
user = db.users.find_one({"_id": correct_user_id})
if user:
    print(f"✅ Utilisateur trouvé: {user.get('firstName', '')} {user.get('lastName', '')}")
else:
    print(f"❌ Utilisateur {correct_user_id} non trouvé")
    client.close()
    exit()

# Trouver les conversations avec des participants corrompus
conversations = list(db.conversations.find({}))

for conv in conversations:
    print(f"\n🔄 Conversation: {conv['_id']}")
    participants = conv['participants']
    print(f"   Participants actuels: {participants}")
    
    # Nettoyer les participants
    valid_participants = []
    needs_fix = False
    
    for participant_id in participants:
        try:
            # Vérifier si l'utilisateur existe
            user_exists = db.users.find_one({"_id": participant_id})
            if user_exists:
                valid_participants.append(participant_id)
                print(f"   ✅ Participant valide: {participant_id}")
            else:
                print(f"   ❌ Participant invalide: {participant_id}")
                needs_fix = True
        except Exception as e:
            print(f"   ❌ Erreur avec participant {participant_id}: {e}")
            needs_fix = True
    
    # Si on a besoin de corriger
    if needs_fix:
        # S'assurer que les deux utilisateurs sont présents
        if len(valid_participants) == 1 and correct_user_id not in valid_participants:
            valid_participants.append(correct_user_id)
            print(f"   🔧 Ajout du participant manquant: {correct_user_id}")
        
        # Mettre à jour la conversation
        result = db.conversations.update_one(
            {"_id": conv["_id"]},
            {"$set": {"participants": valid_participants}}
        )
        
        if result.modified_count > 0:
            print(f"   ✅ Conversation mise à jour avec participants: {valid_participants}")
        else:
            print(f"   ❌ Échec de la mise à jour")

print("\n🎉 Correction terminée")
client.close()
