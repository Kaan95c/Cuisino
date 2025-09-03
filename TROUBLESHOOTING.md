# 🔧 Guide de Dépannage - Erreur "Network request failed"

## 🚨 Problème : "Network request failed" lors de l'inscription

Cette erreur indique que l'application frontend n'arrive pas à se connecter au backend.

## 🔍 **Étapes de Diagnostic**

### 1. **Vérifiez que le backend est démarré**

```bash
cd backend
python start_server.py
```

Vous devriez voir :
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
```

### 2. **Testez la connexion avec le bouton de test**

Dans l'écran d'inscription, cliquez sur **"🔍 Tester la connexion"** et vérifiez la console.

### 3. **Vérifiez l'URL de l'API**

L'URL dépend de votre plateforme :

#### **Android Emulator**
```typescript
const API_BASE_URL = 'http://10.0.2.2:8000/api';
```

#### **iOS Simulator**
```typescript
const API_BASE_URL = 'http://localhost:8000/api';
```

#### **Appareil Physique**
```typescript
const API_BASE_URL = 'http://192.168.1.XXX:8000/api'; // Remplacez XXX par votre IP
```

## 🛠️ **Solutions par Plateforme**

### **Solution 1: Android Emulator**

1. Modifiez `frontend/services/api.ts` :
```typescript
const API_BASE_URL = 'http://10.0.2.2:8000/api';
```

2. Redémarrez l'application

### **Solution 2: iOS Simulator**

1. Modifiez `frontend/services/api.ts` :
```typescript
const API_BASE_URL = 'http://localhost:8000/api';
```

2. Redémarrez l'application

### **Solution 3: Appareil Physique**

1. Trouvez votre IP locale :
   - Windows : `ipconfig`
   - Mac/Linux : `ifconfig`

2. Modifiez `frontend/services/api.ts` :
```typescript
const API_BASE_URL = 'http://192.168.1.XXX:8000/api';
```

3. Assurez-vous que le backend écoute sur toutes les interfaces :
```python
# Dans start_server.py
uvicorn.run(
    "server:app",
    host="0.0.0.0",  # Important : pas localhost
    port=8000,
    reload=True
)
```

## 🔧 **Configuration Automatique**

Pour une configuration automatique, modifiez `frontend/services/api.ts` :

```typescript
import { Platform } from 'react-native';

const getApiBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8000/api';
    } else {
      return 'http://localhost:8000/api';
    }
  }
  return 'http://your-production-url.com/api';
};

const API_BASE_URL = getApiBaseUrl();
```

## 🧪 **Tests de Connexion**

### Test 1: Ping du serveur
```bash
curl http://localhost:8000/api/
```

### Test 2: Test d'inscription
```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "username": "testuser",
    "email": "test@example.com",
    "phone": "+33123456789",
    "password": "password123"
  }'
```

## 🚨 **Problèmes Courants**

### **Problème 1: Backend non démarré**
- **Symptôme** : "Network request failed"
- **Solution** : Démarrez le backend avec `python start_server.py`

### **Problème 2: Mauvaise URL**
- **Symptôme** : "Network request failed" sur émulateur
- **Solution** : Utilisez `10.0.2.2` pour Android, `localhost` pour iOS

### **Problème 3: Firewall/Port bloqué**
- **Symptôme** : Connexion timeout
- **Solution** : Vérifiez que le port 8000 n'est pas bloqué

### **Problème 4: MongoDB non connecté**
- **Symptôme** : Erreur 500 du serveur
- **Solution** : Vérifiez que MongoDB est démarré et accessible

## 📱 **Configuration par Défaut Recommandée**

Pour éviter les problèmes, utilisez cette configuration dans `frontend/services/api.ts` :

```typescript
import { Platform } from 'react-native';

const getApiBaseUrl = () => {
  if (__DEV__) {
    // Configuration automatique selon la plateforme
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8000/api';
    } else {
      return 'http://localhost:8000/api';
    }
  }
  // URL de production
  return 'https://your-api-domain.com/api';
};

const API_BASE_URL = getApiBaseUrl();
```

## 🆘 **Si rien ne fonctionne**

1. **Vérifiez les logs du backend** dans le terminal
2. **Vérifiez les logs de l'application** dans la console
3. **Testez avec Postman** ou curl
4. **Redémarrez tout** : backend, émulateur, application

## 📞 **Support**

Si le problème persiste, fournissez :
- Plateforme (Android/iOS)
- Type d'appareil (émulateur/physique)
- Logs de la console
- Message d'erreur exact
