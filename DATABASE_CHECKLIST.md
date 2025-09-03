# 📋 Checklist Base de Données MongoDB

## ✅ Collections à créer dans MongoDB Compass

### 1. **`users`** - Utilisateurs
```json
{
  "_id": ObjectId,
  "firstName": "string",
  "lastName": "string", 
  "username": "string",
  "email": "string",
  "phone": "string",
  "password": "string", // hashé avec bcrypt
  "bio": "string",
  "avatar": "string",
  "createdAt": Date,
  "updatedAt": Date,
  "isActive": boolean
}
```

**Index requis :**
- `{ "email": 1 }` (unique)
- `{ "username": 1 }` (unique)

### 2. **`recipes`** - Recettes
```json
{
  "_id": ObjectId,
  "title": "string",
  "description": "string",
  "ingredients": ["string"],
  "instructions": ["string"],
  "image": "string",
  "authorId": ObjectId, // référence vers users
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

**Index requis :**
- `{ "authorId": 1 }`
- `{ "createdAt": -1 }`
- `{ "category": 1 }`
- `{ "tags": 1 }`
- `{ "difficulty": 1 }`
- `{ "title": "text", "description": "text" }` (recherche textuelle)

### 3. **`user_likes`** - Likes des utilisateurs
```json
{
  "_id": ObjectId,
  "userId": ObjectId, // référence vers users
  "recipeId": ObjectId, // référence vers recipes
  "createdAt": Date
}
```

**Index requis :**
- `{ "userId": 1, "recipeId": 1 }` (unique)
- `{ "userId": 1 }`
- `{ "recipeId": 1 }`

### 4. **`user_saves`** - Recettes sauvegardées
```json
{
  "_id": ObjectId,
  "userId": ObjectId, // référence vers users
  "recipeId": ObjectId, // référence vers recipes
  "createdAt": Date
}
```

**Index requis :**
- `{ "userId": 1, "recipeId": 1 }` (unique)
- `{ "userId": 1 }`
- `{ "recipeId": 1 }`

### 5. **`categories`** - Catégories de recettes (optionnel)
```json
{
  "_id": ObjectId,
  "name": "string",
  "slug": "string",
  "icon": "string",
  "color": "string",
  "isActive": boolean
}
```

### 6. **`tags`** - Tags/étiquettes (optionnel)
```json
{
  "_id": ObjectId,
  "name": "string",
  "slug": "string",
  "usageCount": number,
  "isActive": boolean
}
```

### 7. **`status_checks`** - Monitoring (déjà existant)
```json
{
  "_id": ObjectId,
  "id": "string",
  "client_name": "string",
  "timestamp": Date
}
```

## 🔧 Scripts de Création des Index

### Dans MongoDB Compass, exécutez ces commandes :

```javascript
// Index pour users
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "username": 1 }, { unique: true })

// Index pour recipes
db.recipes.createIndex({ "authorId": 1 })
db.recipes.createIndex({ "createdAt": -1 })
db.recipes.createIndex({ "category": 1 })
db.recipes.createIndex({ "tags": 1 })
db.recipes.createIndex({ "difficulty": 1 })
db.recipes.createIndex({ "title": "text", "description": "text" })

// Index pour user_likes
db.user_likes.createIndex({ "userId": 1, "recipeId": 1 }, { unique: true })
db.user_likes.createIndex({ "userId": 1 })
db.user_likes.createIndex({ "recipeId": 1 })

// Index pour user_saves
db.user_saves.createIndex({ "userId": 1, "recipeId": 1 }, { unique: true })
db.user_saves.createIndex({ "userId": 1 })
db.user_saves.createIndex({ "recipeId": 1 })
```

## ✅ Vérifications

- [ ] Collection `users` créée
- [ ] Collection `recipes` créée
- [ ] Collection `user_likes` créée
- [ ] Collection `user_saves` créée
- [ ] Collection `status_checks` créée
- [ ] Index uniques sur email et username
- [ ] Index de performance créés
- [ ] Base de données nommée `cuisino`
