# Architecture du système de stockage

## Schéma de connexion

```
┌─────────────────────────────────────────────────────────────┐
│                    utils/storage.js                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  • getToken()      • setToken()                       │  │
│  │  • getUser()       • setUser()                        │  │
│  │  • removeToken()   • removeUser()                     │  │
│  │  • isAuthenticated()  • clear()                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ↓                                 │
│                   sessionStorage                            │
│              (expire à la fermeture)                        │
└─────────────────────────────────────────────────────────────┘
                           ↑
                           │ import storage from '../utils/storage'
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ↓                  ↓                  ↓
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  login.jsx   │   │   App.jsx    │   │ Dashboard.jsx│
│              │   │              │   │              │
│ storage.     │   │ storage.     │   │ storage.     │
│  setToken()  │   │  getUser()   │   │  getToken()  │
│  setUser()   │   │  clear()     │   │              │
└──────────────┘   └──────────────┘   └──────────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                           ↓
                  Autres fichiers qui utilisent
                  sessionStorage directement
                  (à migrer vers storage.js)
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ↓                  ↓                  ↓
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│reservations  │   │  voyage.jsx  │   │  buses.jsx   │
│   .jsx       │   │              │   │              │
│sessionStorage│   │sessionStorage│   │sessionStorage│
│  .getItem()  │   │  .getItem()  │   │  .getItem()  │
└──────────────┘   └──────────────┘   └──────────────┘
```

## Flux de données

### 1. **Connexion (login.jsx)**
```javascript
import storage from '../utils/storage';

// L'utilisateur se connecte
const token = response.data.token;
const userData = response.data.user;

// Stockage via storage.js
storage.setToken(token);      // ──→ sessionStorage.setItem('token', token)
storage.setUser(userData);    // ──→ sessionStorage.setItem('user', JSON.stringify(userData))
```

### 2. **Vérification (App.jsx)**
```javascript
import storage from './utils/storage';

// Au chargement de l'app
const [user, setUser] = useState(() => storage.getUser());
//                                      ↓
//                        sessionStorage.getItem('user')
//                        puis JSON.parse() automatique
```

### 3. **Déconnexion (App.jsx)**
```javascript
const handleLogout = () => {
  storage.clear();    // ──→ sessionStorage.clear()
  setUser(null);
};
```

### 4. **Utilisation dans les pages**
```javascript
import storage from '../utils/storage';

// Récupérer le token pour les requêtes API
const token = storage.getToken();
axios.get('/api/data', {
  headers: { Authorization: `Bearer ${token}` }
});
```

## État actuel de la migration

### ✅ Fichiers utilisant storage.js
- `src/pages/login.jsx` - Connexion
- `src/App.jsx` - État global et déconnexion

### ⏳ Fichiers à migrer (utilisent encore sessionStorage directement)
- `src/pages/Dashboard.jsx`
- `src/pages/reservations.jsx`
- `src/pages/voyage.jsx`
- `src/pages/buses.jsx`
- `src/pages/users.jsx`
- `src/pages/drivers.jsx`
- `src/pages/annonces.jsx`
- `src/pages/Profile.jsx`
- `src/pages/historique.jsx`
- `src/api/reservations.js`
- `src/api/voyage.js`
- `src/components/Sidebar.jsx`

## Avantages de cette architecture

### 🎯 Centralisation
- **1 seul fichier** à modifier pour changer la logique de stockage
- Pas besoin de chercher dans 13 fichiers différents

### 🔒 Sécurité
- Possibilité d'ajouter du chiffrement
- Validation centralisée des données
- Gestion d'expiration du token

### 🧪 Testabilité
- Facile de mocker `storage.js` dans les tests
- Pas besoin de mocker `sessionStorage` partout

### 📦 Réutilisabilité
- Les méthodes peuvent être utilisées partout
- Code DRY (Don't Repeat Yourself)

## Migration recommandée

Pour migrer un fichier vers `storage.js` :

1. **Importer le module**
   ```javascript
   import storage from '../utils/storage';
   ```

2. **Remplacer les appels**
   ```javascript
   // Avant
   const token = sessionStorage.getItem('token');
   const user = JSON.parse(sessionStorage.getItem('user'));
   
   // Après
   const token = storage.getToken();
   const user = storage.getUser();
   ```

3. **Simplifier le code**
   ```javascript
   // Avant
   sessionStorage.removeItem('token');
   sessionStorage.removeItem('user');
   
   // Après
   storage.clear();
   ```

---
**Dernière mise à jour** : 28 octobre 2025
