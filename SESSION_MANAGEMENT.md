# Gestion des Sessions - TICKETAF

## Changement Important : sessionStorage au lieu de localStorage

### Pourquoi ce changement ?

L'application utilise maintenant **sessionStorage** au lieu de **localStorage** pour stocker les informations de session (token et données utilisateur).

### Différence entre localStorage et sessionStorage

| Caractéristique | localStorage | sessionStorage |
|----------------|--------------|----------------|
| **Durée de vie** | Persiste même après fermeture du navigateur | Expire à la fermeture de l'onglet/navigateur |
| **Portée** | Partagé entre tous les onglets du même domaine | Isolé par onglet |
| **Sécurité** | Moins sécurisé (données persistent) | Plus sécurisé (auto-expiration) |

### Comportement actuel

✅ **Avec sessionStorage** :
- L'utilisateur doit se reconnecter à chaque fois qu'il ferme le navigateur
- Les sessions sont automatiquement nettoyées à la fermeture
- Meilleure sécurité pour les postes partagés

❌ **Avant (avec localStorage)** :
- L'utilisateur restait connecté même après fermeture du navigateur
- Risque de sécurité sur les postes partagés

### Fichiers modifiés

Tous les fichiers utilisant `localStorage` ont été migrés vers `sessionStorage` :
- `src/pages/login.jsx`
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
- `src/App.jsx`
- `src/components/Sidebar.jsx`

### Utilitaire de stockage

Un fichier utilitaire a été créé : `src/utils/storage.js`

Ce fichier centralise toutes les opérations de stockage et peut être utilisé dans les futurs développements :

```javascript
import storage from './utils/storage';

// Utilisation
storage.setToken(token);
storage.getToken();
storage.setUser(userData);
storage.getUser();
storage.isAuthenticated();
storage.clear();
```

### Pour revenir à localStorage (si nécessaire)

Si vous souhaitez revenir à localStorage, il suffit de :
1. Modifier le fichier `src/utils/storage.js`
2. Remplacer `sessionStorage` par `localStorage`

Ou exécuter cette commande PowerShell dans le dossier Frontend :
```powershell
Get-ChildItem -Path "src" -Recurse -Include *.js,*.jsx | ForEach-Object { 
  (Get-Content $_.FullName) -replace 'sessionStorage', 'localStorage' | Set-Content $_.FullName 
}
```

### Test

Pour tester que cela fonctionne :
1. Connectez-vous à l'application
2. Fermez complètement le navigateur (tous les onglets)
3. Rouvrez le navigateur et accédez à l'application
4. ✅ Vous devriez être redirigé vers la page de connexion

---
**Date de modification** : 28 octobre 2025
**Auteur** : Cascade AI Assistant
