# Tests des Endpoints - Voyages et Historique

## Endpoints Voyages

### 1. GET /api/voyages (Voyages futurs uniquement)
**Usage**: Pages de réservation

```bash
curl -X GET http://localhost:3000/api/voyages \
  -H "Authorization: Bearer <votre_token>"
```

**Réponse attendue**: Liste des voyages dont `date > maintenant`

---

### 2. GET /api/voyages/all/including-expired (Tous les voyages)
**Usage**: Page historique

```bash
curl -X GET http://localhost:3000/api/voyages/all/including-expired \
  -H "Authorization: Bearer <votre_token>"
```

**Réponse attendue**: Liste de TOUS les voyages (passés + futurs)

---

### 3. Comparaison des Résultats

**Test à effectuer**:
1. Créer un voyage avec une date passée (ex: hier)
2. Créer un voyage avec une date future (ex: demain)
3. Appeler `/api/voyages` → Devrait retourner uniquement le voyage futur
4. Appeler `/api/voyages/all/including-expired` → Devrait retourner les deux voyages

---

## Test avec Postman/Thunder Client

### Configuration
- **Method**: GET
- **Headers**: 
  - `Authorization`: `Bearer <token>`
  - `Content-Type`: `application/json`

### Endpoint 1: Voyages Futurs
```
GET http://localhost:3000/api/voyages
```

### Endpoint 2: Tous les Voyages
```
GET http://localhost:3000/api/voyages/all/including-expired
```

---

## Test depuis le Frontend

### Console du Navigateur

```javascript
// Récupérer le token
const token = localStorage.getItem('token');

// Test endpoint voyages futurs
fetch('http://localhost:3000/api/voyages', {
  headers: { Authorization: `Bearer ${token}` }
})
  .then(r => r.json())
  .then(data => console.log('Voyages futurs:', data));

// Test endpoint tous les voyages
fetch('http://localhost:3000/api/voyages/all/including-expired', {
  headers: { Authorization: `Bearer ${token}` }
})
  .then(r => r.json())
  .then(data => console.log('Tous les voyages:', data));
```

---

## Vérification de la Page Historique

### Étapes
1. Se connecter en tant qu'admin
2. Aller sur la page Historique
3. Vérifier que les voyages passés s'affichent
4. Vérifier que le badge "EXPIRÉ" apparaît sur les voyages passés
5. Tester le filtre "Expirés" → Devrait afficher uniquement les voyages passés
6. Tester le filtre "À venir" → Devrait afficher uniquement les voyages futurs

---

## Scénarios de Test

### Scénario 1: Voyage Expiré
```javascript
// Créer un voyage avec date passée
POST /api/voyages
{
  "driverId": "...",
  "from": "Dakar",
  "to": "Thiès",
  "date": "2025-10-20T10:00:00Z", // Date passée
  "price": 2000,
  "totalSeats": 4
}
```

**Vérification**:
- ✅ N'apparaît PAS dans `/api/voyages`
- ✅ Apparaît dans `/api/voyages/all/including-expired`
- ✅ Apparaît dans la page historique avec badge "EXPIRÉ"

### Scénario 2: Voyage Futur
```javascript
// Créer un voyage avec date future
POST /api/voyages
{
  "driverId": "...",
  "from": "Dakar",
  "to": "Saint-Louis",
  "date": "2025-10-30T14:00:00Z", // Date future
  "price": 3000,
  "totalSeats": 4
}
```

**Vérification**:
- ✅ Apparaît dans `/api/voyages`
- ✅ Apparaît dans `/api/voyages/all/including-expired`
- ✅ Apparaît dans la page historique avec badge "À VENIR"

### Scénario 3: Voyage Aujourd'hui
```javascript
// Créer un voyage pour aujourd'hui
POST /api/voyages
{
  "driverId": "...",
  "from": "Dakar",
  "to": "Rufisque",
  "date": "2025-10-24T16:00:00Z", // Aujourd'hui
  "price": 1500,
  "totalSeats": 4
}
```

**Vérification**:
- ✅ Apparaît dans `/api/voyages`
- ✅ Apparaît dans `/api/voyages/all/including-expired`
- ✅ Apparaît dans la page historique avec badge "AUJOURD'HUI"

---

## Checklist de Validation

### Backend
- [ ] Endpoint `/api/voyages` retourne uniquement les voyages futurs
- [ ] Endpoint `/api/voyages/all/including-expired` retourne tous les voyages
- [ ] Les deux endpoints nécessitent une authentification
- [ ] Les deux endpoints populatent correctement le driver

### Frontend - Page Historique
- [ ] Affiche tous les voyages (passés + futurs)
- [ ] Badge "EXPIRÉ" visible sur les voyages passés
- [ ] Fond rouge clair pour les voyages expirés
- [ ] Filtre "Expirés" fonctionne
- [ ] Filtre "Aujourd'hui" fonctionne
- [ ] Filtre "À venir" fonctionne
- [ ] Statistiques correctes (nombre d'expirés, aujourd'hui, à venir)

### Frontend - Autres Pages
- [ ] Pages de réservation affichent uniquement les voyages futurs
- [ ] Création de réservation fonctionne normalement
- [ ] Aucune régression sur les autres fonctionnalités

---

## Commandes Rapides

### Démarrer le Backend
```bash
cd Backend
npm start
```

### Démarrer le Frontend
```bash
cd Frontend
npm run dev
```

### Vérifier les Logs
```bash
# Backend
# Vérifier la console pour les logs de requêtes

# Frontend
# Ouvrir DevTools → Console
# Vérifier les requêtes dans l'onglet Network
```

---

## Dépannage

### Problème: 404 sur /api/voyages/all/including-expired
**Solution**: Vérifier que le serveur backend a été redémarré après les modifications

### Problème: Page historique vide
**Solution**: 
1. Vérifier le token dans localStorage
2. Vérifier que l'utilisateur est admin
3. Vérifier la console pour les erreurs

### Problème: Voyages expirés ne s'affichent pas
**Solution**: 
1. Vérifier que le frontend utilise le bon endpoint
2. Vérifier que des voyages avec dates passées existent en base
3. Vérifier les filtres appliqués

---

## Résultat Attendu

Après tous les tests, vous devriez avoir:
- ✅ Page historique complète avec tous les voyages
- ✅ Affichage visuel distinctif des voyages expirés
- ✅ Tous les filtres fonctionnels
- ✅ Statistiques précises
- ✅ Aucune régression sur les autres pages
