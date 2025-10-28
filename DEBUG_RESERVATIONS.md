# Débogage - Réservations Non Marquées comme Expirées

## Date: 24 Octobre 2025

## Problème Identifié

### Symptôme
Certaines réservations ne sont pas marquées comme "EXPIRÉ" même si leur voyage associé est expiré.

### Causes Possibles

#### 1. Voyage/Bus Supprimé
Si le voyage ou le bus associé à une réservation a été supprimé:
- `r.voyage` ou `r.bus` = `null`
- `reservationDate` = `undefined`
- `getTemporalStatus(undefined)` retourne `status: 'unknown'`
- La réservation n'est **pas** marquée comme expirée

#### 2. Date Manquante
Si le voyage/bus existe mais n'a pas de date:
- `r.voyage.date` ou `r.bus.departureDate` = `null` ou `undefined`
- `reservationDate` = `undefined`
- Même résultat: pas marquée comme expirée

#### 3. Données Non Peuplées (Populate)
Si le backend ne peuple pas correctement les références:
- `r.voyage` contient seulement l'ID au lieu de l'objet complet
- `r.voyage.date` n'existe pas
- La date ne peut pas être extraite

## Solutions Implémentées

### 1. Logs de Débogage

Ajout de warnings dans la console pour identifier les problèmes:

```javascript
// Dans ReservationRow
if (!r.voyage && !r.bus) {
  console.warn('⚠️ Réservation sans voyage ni bus:', r._id);
}
if ((r.voyage && !r.voyage.date) || (r.bus && !r.bus.departureDate)) {
  console.warn('⚠️ Voyage/Bus sans date:', r._id, r.voyage || r.bus);
}
```

### 2. Affichage Amélioré

Ajout de chips informatifs pour les cas problématiques:

```javascript
// Si pas de date
{!reservationDate && (
  <Chip size="small" label="Date inconnue" color="warning" />
)}

// Si voyage/bus supprimé
{!r.voyage && !r.bus && (
  <Chip size="small" label="Voyage supprimé" color="error" />
)}
```

## Comment Tester

### 1. Ouvrir la Console du Navigateur

```
F12 → Console
```

### 2. Aller sur la Page Historique

Regarder les warnings dans la console:
- `⚠️ Réservation sans voyage ni bus: <id>` → Voyage supprimé
- `⚠️ Voyage/Bus sans date: <id>` → Date manquante

### 3. Vérifier l'Affichage

Les réservations problématiques devraient afficher:
- Chip orange "Date inconnue" si pas de date
- Chip rouge "Voyage supprimé" si pas de voyage/bus

### 4. Inspecter les Données

Dans la console:

```javascript
// Récupérer les réservations
const token = localStorage.getItem('token');
fetch('http://localhost:3000/api/reservations', {
  headers: { Authorization: `Bearer ${token}` }
})
  .then(r => r.json())
  .then(data => {
    console.log('Toutes les réservations:', data);
    
    // Filtrer les problématiques
    const sansVoyage = data.filter(r => !r.voyage && !r.bus);
    const sansDate = data.filter(r => 
      (r.voyage && !r.voyage.date) || (r.bus && !r.bus.departureDate)
    );
    
    console.log('Réservations sans voyage/bus:', sansVoyage);
    console.log('Réservations sans date:', sansDate);
  });
```

## Scénarios de Test

### Scénario 1: Réservation avec Voyage Expiré Normal

**Données**:
```json
{
  "_id": "123",
  "user": { "name": "Amadou" },
  "voyage": {
    "_id": "456",
    "from": "Dakar",
    "to": "Thiès",
    "date": "2025-10-20T10:00:00Z",  // Date passée
    "price": 2000
  },
  "ticket": "place",
  "quantity": 1
}
```

**Résultat Attendu**:
- ✅ Badge "EXPIRÉ" visible
- ✅ Fond rouge clair
- ✅ Date affichée en rouge

### Scénario 2: Réservation avec Voyage Supprimé

**Données**:
```json
{
  "_id": "123",
  "user": { "name": "Amadou" },
  "voyage": null,  // ❌ Voyage supprimé
  "bus": null,
  "ticket": "place",
  "quantity": 1
}
```

**Résultat Attendu**:
- ⚠️ Warning dans la console
- ⚠️ Chip "Voyage supprimé" affiché
- ⚠️ Chip "Date inconnue" affiché
- ❌ PAS de badge "EXPIRÉ" (car pas de date)

### Scénario 3: Réservation avec Voyage Sans Date

**Données**:
```json
{
  "_id": "123",
  "user": { "name": "Amadou" },
  "voyage": {
    "_id": "456",
    "from": "Dakar",
    "to": "Thiès",
    "date": null,  // ❌ Date manquante
    "price": 2000
  },
  "ticket": "place",
  "quantity": 1
}
```

**Résultat Attendu**:
- ⚠️ Warning dans la console
- ⚠️ Chip "Date inconnue" affiché
- ❌ PAS de badge "EXPIRÉ" (car pas de date)

### Scénario 4: Réservation avec Voyage Non Peuplé

**Données**:
```json
{
  "_id": "123",
  "user": { "name": "Amadou" },
  "voyage": "456",  // ❌ Seulement l'ID, pas l'objet
  "ticket": "place",
  "quantity": 1
}
```

**Résultat Attendu**:
- ⚠️ Erreur JavaScript dans la console
- ⚠️ Affichage cassé

**Solution**: Vérifier le backend (populate)

## Vérification Backend

### Endpoint Réservations

```javascript
// Backend/src/controllers/reservation.controller.js
const getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate('user', '-password')
      .populate({
        path: 'voyage',  // ✅ Doit peupler voyage
        populate: { path: 'driver', select: '-password' }
      })
      .populate('bus')  // ✅ Doit peupler bus
      .sort({ createdAt: -1 });
    
    res.status(200).json(reservations);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
```

### Test Backend Direct

```bash
# Tester l'endpoint
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/reservations | jq '.[0]'
```

**Vérifier**:
- ✅ `voyage` est un objet (pas juste un ID)
- ✅ `voyage.date` existe et est une date valide
- ✅ `bus.departureDate` existe si c'est un bus

## Solutions aux Problèmes Courants

### Problème 1: Voyages Supprimés

**Cause**: Un voyage a été supprimé mais ses réservations existent toujours

**Solutions**:
1. **Soft Delete**: Ne pas supprimer les voyages, ajouter un champ `isDeleted`
2. **Cascade Delete**: Supprimer les réservations quand on supprime un voyage
3. **Archivage**: Archiver au lieu de supprimer

**Recommandation**: Utiliser le soft delete

```javascript
// Modèle Voyage
const voyageSchema = new mongoose.Schema({
  // ... autres champs
  isDeleted: { type: Boolean, default: false }
});

// Controller
const deleteVoyage = async (req, res) => {
  // Au lieu de supprimer
  await Voyage.findByIdAndUpdate(req.params.id, { isDeleted: true });
};

// Query
const getAllVoyage = async (req, res) => {
  const voyages = await Voyage.find({ isDeleted: false });
};
```

### Problème 2: Dates Manquantes

**Cause**: Données corrompues ou migration incomplète

**Solution**: Script de nettoyage

```javascript
// Script de migration
const fixMissingDates = async () => {
  const voyages = await Voyage.find({ date: null });
  console.log(`${voyages.length} voyages sans date trouvés`);
  
  // Option 1: Supprimer
  // await Voyage.deleteMany({ date: null });
  
  // Option 2: Mettre une date par défaut
  // await Voyage.updateMany(
  //   { date: null },
  //   { date: new Date('2000-01-01') }
  // );
};
```

### Problème 3: Populate Non Fonctionnel

**Cause**: Référence cassée ou modèle mal configuré

**Vérification**:
```javascript
// Vérifier le modèle Reservation
const reservationSchema = new mongoose.Schema({
  voyage: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Voyage'  // ✅ Doit correspondre au nom du modèle
  },
  bus: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Bus'  // ✅ Doit correspondre au nom du modèle
  }
});
```

## Checklist de Débogage

Quand une réservation n'est pas marquée comme expirée:

- [ ] Ouvrir la console du navigateur (F12)
- [ ] Aller sur la page Historique
- [ ] Chercher les warnings `⚠️`
- [ ] Noter les IDs des réservations problématiques
- [ ] Inspecter les données avec `fetch()` dans la console
- [ ] Vérifier si `voyage` ou `bus` est null
- [ ] Vérifier si `voyage.date` ou `bus.departureDate` existe
- [ ] Vérifier si c'est un objet ou juste un ID
- [ ] Tester l'endpoint backend directement
- [ ] Vérifier les logs du serveur backend

## Résultat Attendu

Après les corrections:
- ✅ Toutes les réservations avec voyage expiré sont marquées "EXPIRÉ"
- ✅ Les réservations sans voyage affichent "Voyage supprimé"
- ✅ Les réservations sans date affichent "Date inconnue"
- ✅ Les warnings dans la console identifient les problèmes
- ✅ L'affichage est clair et informatif

## Prochaines Étapes

1. Tester avec des données réelles
2. Identifier les réservations problématiques via les logs
3. Décider d'une stratégie (soft delete, nettoyage, etc.)
4. Implémenter la solution choisie
5. Migrer les données existantes si nécessaire
