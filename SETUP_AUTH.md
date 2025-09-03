# Configuration de l'Authentification Cuisino

## 🚀 Configuration Backend

### 1. Variables d'environnement
Créez un fichier `.env` dans le dossier `backend/` basé sur `env.example` :

```bash
cd backend
cp env.example .env
```

Modifiez le fichier `.env` avec vos paramètres :
```env
# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
DB_NAME=cuisino

# JWT Configuration
SECRET_KEY=votre-cle-secrete-super-securisee-ici
```

### 2. Installation des dépendances
```bash
cd backend
pip install -r requirements.txt
```

### 3. Démarrage du serveur
```bash
python start_server.py
```

Le serveur sera accessible sur `http://localhost:8000`

## 📱 Configuration Frontend

### 1. Installation des dépendances
```bash
cd frontend
npm install
# ou
yarn install
```

### 2. Configuration de l'API
Modifiez l'URL de l'API dans `frontend/services/api.ts` :
```typescript
const API_BASE_URL = 'http://localhost:8000/api'; // Changez selon votre configuration
```

### 3. Démarrage de l'application
```bash
cd frontend
npx expo start
```

## 🗄️ Collections MongoDB

Assurez-vous d'avoir créé les collections suivantes dans MongoDB :

### 1. `users`
```json
{
  "_id": ObjectId,
  "firstName": "string",
  "lastName": "string", 
  "username": "string",
  "email": "string",
  "phone": "string",
  "password": "string", // hashé
  "bio": "string",
  "avatar": "string",
  "createdAt": Date,
  "updatedAt": Date,
  "isActive": boolean
}
```

### 2. `recipes`
```json
{
  "_id": ObjectId,
  "title": "string",
  "description": "string",
  "ingredients": ["string"],
  "instructions": ["string"],
  "image": "string",
  "authorId": ObjectId,
  "author": {
    "id": "string",
    "name": "string",
    "avatar": "string"
  },
  "likes": number,
  "servings": number,
  "prepTimeMinutes": number,
  "difficulty": "easy|medium|hard",
  "category": "string",
  "tags": ["string"],
  "createdAt": Date,
  "updatedAt": Date,
  "isPublished": boolean
}
```

### 3. `user_likes`
```json
{
  "_id": ObjectId,
  "userId": ObjectId,
  "recipeId": ObjectId,
  "createdAt": Date
}
```

### 4. `user_saves`
```json
{
  "_id": ObjectId,
  "userId": ObjectId,
  "recipeId": ObjectId,
  "createdAt": Date
}
```

## 🔧 API Endpoints

### Authentification
- `POST /api/auth/register` - Créer un compte
- `POST /api/auth/login` - Se connecter

### Utilisateurs
- `GET /api/users/me` - Obtenir les infos de l'utilisateur connecté
- `PUT /api/users/me` - Mettre à jour le profil
- `GET /api/users/{user_id}` - Obtenir un utilisateur par ID

### Recettes
- `GET /api/recipes` - Lister toutes les recettes
- `POST /api/recipes` - Créer une recette
- `PATCH /api/recipes/{recipe_id}` - Like/Save une recette
- `GET /api/users/me/recipes` - Mes recettes
- `GET /api/users/me/liked-recipes` - Recettes likées
- `GET /api/users/me/saved-recipes` - Recettes sauvegardées

## 🧪 Test de l'API

### Créer un utilisateur
```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe", 
    "username": "johndoe",
    "email": "john@example.com",
    "phone": "+33123456789",
    "password": "password123"
  }'
```

### Se connecter
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

## 🔐 Sécurité

- Les mots de passe sont hashés avec bcrypt
- Les tokens JWT expirent après 30 minutes
- Validation des données côté serveur
- Protection CORS configurée

## 📝 Notes

- L'application mobile utilise AsyncStorage pour stocker le token JWT
- Les images sont stockées en base64 ou URL
- Le système gère automatiquement l'authentification persistante
- Les erreurs sont gérées avec des messages utilisateur appropriés
