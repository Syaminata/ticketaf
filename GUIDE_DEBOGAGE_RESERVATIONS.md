# Guide de Débogage - Réservations Non Affichées

## Problème

Les réservations avec dates passées ne s'affichent pas dans l'historique.

## Comment Déboguer

### 1. Ouvrir la Console du Navigateur

```
F12 → Console
```

### 2. Aller sur la Page Historique

La console affichera automatiquement des informations détaillées:

```
📊 Données chargées:
  - Voyages: 25
  - Réservations: 50
  - Utilisateurs: 15

📋 Analyse des réservations:
  - Total: 50
  - Sans voyage/bus: 5
  - Avec voyage/bus: 45
  - Voyages expirés: 30

⚠️ Réservations sans voyage/bus: ['abc123', 'def456', ...]

🔍 Filtrage des réservations:
  - Total: 50
  - Après filtres: 30
  - Filtre statut: expired
```

### 3. Analyser les Logs

#### Si "Sans voyage/bus" > 0
**Problème**: Des voyages ont été supprimés
**Solution**: Voir section "Voyages Supprimés" ci-dessous

#### Si "Voyages expirés" > 0 mais "Après filtres" = 0
**Problème**: Le filtre bloque l'affichage
**Solution**: Vérifier le filtre de statut sélectionné

#### Si "Total" = 0
**Problème**: Aucune réservation en base de données
**Solution**: Créer des réservations de test

## Vérifications Détaillées

### Vérification 1: Réservations en Base de Données

Dans la console du navigateur:

```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3000/api/reservations', {
  headers: { Authorization: `Bearer ${token}` }
})
  .then(r => r.json())
  .then(data => {
    console.log('Total réservations:', data.length);
    console.table(data.map(r => ({
      id: r._id,
      user: r.user?.name,
      voyage: r.voyage ? `${r.voyage.from} → ${r.voyage.to}` : 'N/A',
      date: r.voyage?.date || r.bus?.departureDate || 'N/A',
      expiré: r.voyage?.date ? new Date(r.voyage.date) < new Date() : 'N/A'
    })));
  });
```

### Vérification 2: Voyages Associés

```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3000/api/reservations', {
  headers: { Authorization: `Bearer ${token}` }
})
  .then(r => r.json())
  .then(data => {
    const sansVoyage = data.filter(r => !r.voyage && !r.bus);
    console.log('Réservations sans voyage/bus:', sansVoyage.length);
    console.table(sansVoyage.map(r => ({
      id: r._id,
      user: r.user?.name,
      créée: new Date(r.createdAt).toLocaleDateString()
    })));
  });
```

### Vérification 3: Dates des Voyages

```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3000/api/reservations', {
  headers: { Authorization: `Bearer ${token}` }
})
  .then(r => r.json())
  .then(data => {
    const avecVoyage = data.filter(r => r.voyage || r.bus);
    const sansDate = avecVoyage.filter(r => 
      !r.voyage?.date && !r.bus?.departureDate
    );
    console.log('Réservations sans date:', sansDate.length);
    console.table(sansDate);
  });
```

## Problèmes Courants et Solutions

### Problème 1: Voyages Supprimés

**Symptôme**:
```
⚠️ Réservations sans voyage/bus: ['abc123', 'def456']
```

**Cause**: Les voyages ont été supprimés de la base de données

**Solutions**:

#### Option A: Soft Delete (Recommandé)
Modifier le modèle Voyage pour ne pas supprimer réellement:

```javascript
// Backend/src/models/voyage.model.js
const voyageSchema = new mongoose.Schema({
  // ... autres champs
  isDeleted: { type: Boolean, default: false }
});

// Backend/src/controllers/voyage.controller.js
const deleteVoyage = async (req, res) => {
  // Au lieu de supprimer
  const voyage = await Voyage.findByIdAndUpdate(
    req.params.id, 
    { isDeleted: true },
    { new: true }
  );
  res.status(200).json({ message: 'Voyage archivé', voyage });
};

// Modifier les queries pour exclure les supprimés
const getAllVoyage = async (req, res) => {
  const voyages = await Voyage.find({ isDeleted: false });
  // ...
};
```

#### Option B: Empêcher la Suppression
Ne pas permettre de supprimer un voyage avec des réservations:

```javascript
const deleteVoyage = async (req, res) => {
  const hasReservations = await Reservation.exists({ voyage: req.params.id });
  if (hasReservations) {
    return res.status(400).json({ 
      message: 'Impossible de supprimer: des réservations existent pour ce voyage' 
    });
  }
  await Voyage.findByIdAndDelete(req.params.id);
  res.status(200).json({ message: 'Voyage supprimé' });
};
```

#### Option C: Cascade Delete
Supprimer automatiquement les réservations:

```javascript
const deleteVoyage = async (req, res) => {
  // Supprimer d'abord les réservations
  await Reservation.deleteMany({ voyage: req.params.id });
  // Puis le voyage
  await Voyage.findByIdAndDelete(req.params.id);
  res.status(200).json({ message: 'Voyage et réservations supprimés' });
};
```

### Problème 2: Dates Manquantes

**Symptôme**:
```
⚠️ Voyage/Bus sans date: 123abc
```

**Cause**: Données corrompues ou migration incomplète

**Solution**: Script de nettoyage

```javascript
// Script à exécuter une fois
const fixMissingDates = async () => {
  const voyages = await Voyage.find({ date: null });
  console.log(`${voyages.length} voyages sans date`);
  
  // Option 1: Les supprimer
  await Voyage.deleteMany({ date: null });
  
  // Option 2: Mettre une date par défaut
  // await Voyage.updateMany(
  //   { date: null },
  //   { date: new Date('2000-01-01') }
  // );
};
```

### Problème 3: Filtre Bloquant

**Symptôme**:
```
🔍 Filtrage des réservations:
  - Total: 50
  - Après filtres: 0
  - Filtre statut: expired
```

**Cause**: Le filtre "expired" est actif mais aucune réservation n'a de date valide

**Solution**: 
1. Changer le filtre à "Tous" dans l'interface
2. Vérifier les données avec les scripts ci-dessus
3. Corriger les données problématiques

### Problème 4: Populate Non Fonctionnel

**Symptôme**: `r.voyage` contient juste un ID au lieu d'un objet

**Vérification**:
```javascript
fetch('http://localhost:3000/api/reservations', {
  headers: { Authorization: `Bearer ${token}` }
})
  .then(r => r.json())
  .then(data => {
    const premiere = data[0];
    console.log('Type de voyage:', typeof premiere.voyage);
    console.log('Voyage:', premiere.voyage);
    // Devrait être 'object' et contenir from, to, date, etc.
  });
```

**Solution**: Vérifier le controller

```javascript
// Backend/src/controllers/reservation.controller.js
const getAllReservations = async (req, res) => {
  const reservations = await Reservation.find()
    .populate('user', '-password')
    .populate({
      path: 'voyage',  // ✅ Doit être présent
      populate: { path: 'driver', select: '-password' }
    })
    .populate('bus');  // ✅ Doit être présent
  
  res.status(200).json(reservations);
};
```

## Checklist de Débogage

Suivez cette checklist dans l'ordre:

- [ ] Ouvrir la console (F12)
- [ ] Aller sur la page Historique
- [ ] Noter les chiffres affichés dans les logs
- [ ] Si "Sans voyage/bus" > 0 → Voyages supprimés
- [ ] Si "Voyages expirés" > 0 mais "Après filtres" = 0 → Problème de filtre
- [ ] Exécuter les scripts de vérification dans la console
- [ ] Identifier le problème spécifique
- [ ] Appliquer la solution appropriée

## Tests Après Correction

### Test 1: Créer une Réservation avec Voyage Expiré

```javascript
// 1. Créer un voyage avec date passée
POST /api/voyages
{
  "driverId": "...",
  "from": "Dakar",
  "to": "Thiès",
  "date": "2025-10-20T10:00:00Z",  // Date passée
  "price": 2000,
  "totalSeats": 4
}

// 2. Créer une réservation pour ce voyage
POST /api/reservations
{
  "userId": "...",
  "voyageId": "...",  // ID du voyage créé
  "ticket": "place",
  "quantity": 1
}

// 3. Vérifier dans l'historique
// Devrait afficher avec badge "EXPIRÉ"
```

### Test 2: Vérifier le Filtre

1. Aller sur la page Historique
2. Le filtre "Expirés" devrait être sélectionné par défaut
3. Changer à "Tous" → Toutes les réservations apparaissent
4. Changer à "À venir" → Seules les futures apparaissent
5. Revenir à "Expirés" → Seules les expirées apparaissent

## Résultat Attendu

Après débogage et correction:

```
📊 Données chargées:
  - Voyages: 25
  - Réservations: 50
  - Utilisateurs: 15

📋 Analyse des réservations:
  - Total: 50
  - Sans voyage/bus: 0  ← Devrait être 0
  - Avec voyage/bus: 50
  - Voyages expirés: 30

🔍 Filtrage des réservations:
  - Total: 50
  - Après filtres: 30  ← Devrait correspondre aux expirés
  - Filtre statut: expired
```

Et dans l'interface:
- ✅ 30 réservations expirées affichées
- ✅ Badge rouge "EXPIRÉ" visible
- ✅ Fond rouge clair
- ✅ Aucun warning dans la console

## Aide Supplémentaire

Si le problème persiste:
1. Copier tous les logs de la console
2. Copier le résultat des scripts de vérification
3. Vérifier les données directement en base de données (MongoDB Compass)
4. Vérifier les logs du serveur backend
