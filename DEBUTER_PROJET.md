# 🚀 Guide de Démarrage - Ticketaf

## ⚠️ Erreur ERR_CONNECTION_REFUSED

Si vous voyez l'erreur `ERR_CONNECTION_REFUSED`, cela signifie que **le backend n'est pas démarré**.

## 📋 Étapes pour démarrer le projet

### 1. Démarrer le Backend

```bash
# Aller dans le dossier Backend
cd Backend

# Installer les dépendances (si pas déjà fait)
npm install

# Créer le fichier .env (si pas déjà fait)
# Copier .env.example en .env et remplir les variables
cp .env.example .env

# Démarrer le serveur
npm run dev
# ou
npm start
```

Le serveur doit afficher :
```
✅ Connecté à MongoDB
Serveur démarré sur le port 3000
```

### 2. Démarrer le Frontend

Dans un **nouveau terminal** :

```bash
# Aller dans le dossier Frontend
cd Frontend

# Installer les dépendances (si pas déjà fait)
npm install

# Démarrer le serveur de développement
npm run dev
```

Le frontend devrait démarrer sur `http://localhost:5173` (ou un autre port).

## ✅ Vérification

1. **Backend** : Ouvrir `http://localhost:3000/api/test`
   - Devrait retourner : `{"message":"Serveur backend fonctionne!","timestamp":"..."}`

2. **Swagger** : Ouvrir `http://localhost:3000/api-docs`
   - Devrait afficher la documentation Swagger

3. **Frontend** : Ouvrir l'URL affichée dans le terminal (ex: `http://localhost:5173`)
   - Devrait afficher l'interface de connexion

## 🔧 Problèmes courants

### Le backend ne démarre pas

**Erreur : "Port 3000 déjà utilisé"**
```bash
# Tuer le processus sur le port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

**Erreur : "MongoDB connection failed"**
- Vérifier que MongoDB est démarré (si local)
- Vérifier la `DATABASE_URL` dans `Backend/.env`
- Vérifier que MongoDB Atlas est accessible (si utilisant Atlas)

### Le frontend ne se connecte pas au backend

**Vérifier l'URL dans `Frontend/src/api/axios.js`**
```javascript
baseURL: "http://localhost:3000/api"
```

**Vérifier que le backend tourne bien sur le port 3000**

## 📝 Variables d'environnement nécessaires

Dans `Backend/.env` :
```env
PORT=3000
DATABASE_URL=mongodb://localhost:27017/ticketaf
# ou pour MongoDB Atlas:
# DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/ticketaf
JWT_SECRET=votre_secret_jwt_securise
NODE_ENV=development
```

## 🎯 Commandes rapides

```bash
# Backend
cd Backend
npm install
npm run dev

# Frontend (dans un autre terminal)
cd Frontend
npm install
npm run dev
```

## 📞 Besoin d'aide ?

1. Vérifier que les deux serveurs sont démarrés
2. Vérifier les logs dans les terminaux
3. Vérifier la console du navigateur (F12)
4. Vérifier que MongoDB est accessible







