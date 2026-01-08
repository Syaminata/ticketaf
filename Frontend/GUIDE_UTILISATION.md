# Guide d'Utilisation - Frontend TicketAF

## Table des matières

1. [Introduction](#introduction)
2. [Authentification](#authentification)
3. [Tableau de bord (Dashboard)](#tableau-de-bord-dashboard)
4. [Gestion des Utilisateurs](#gestion-des-utilisateurs)
5. [Gestion des Chauffeurs](#gestion-des-chauffeurs)
6. [Gestion des Voyages](#gestion-des-voyages)
7. [Gestion des Réservations](#gestion-des-réservations)
8. [Gestion des Colis](#gestion-des-colis)
9. [Gestion des Bus](#gestion-des-bus)
10. [Gestion des Annonces](#gestion-des-annonces)
11. [Historique](#historique)
12. [Mon Profil](#mon-profil)

---

## Introduction

**TicketAF** est une plateforme de gestion de transport qui permet de gérer les voyages, réservations, colis et bien plus encore. Ce guide vous explique comment utiliser chaque page du système.

### Rôles utilisateurs

Le système comporte plusieurs rôles avec des permissions différentes :

- **Super Admin** : Accès complet à toutes les fonctionnalités
- **Admin** : Gestion complète sauf certaines fonctionnalités spécifiques
- **Gestionnaire de Colis** : Gestion des colis et utilisateurs
- **Client** : Accès limité pour consulter ses propres données

---

## Authentification

### Page de connexion (`/login`)

**Description** : Page d'entrée du système permettant aux utilisateurs de se connecter.

**Fonctionnalités** :

1. **Sélection du rôle**
   - Choisir parmi : Super Admin, Admin, ou Gestionnaire
   - Les boutons permettent de basculer entre les rôles

2. **Connexion**
   - **Email** : Adresse email de l'utilisateur
   - **Mot de passe** : Mot de passe avec possibilité d'afficher/masquer
   - **Bouton "Se connecter"** : Valide et authentifie l'utilisateur

**Étapes d'utilisation** :

1. Sélectionner votre rôle (Super Admin, Admin ou Gestionnaire)
2. Entrer votre adresse email
3. Entrer votre mot de passe
4. Cliquer sur "Se connecter"

**Message d'erreur** : En cas d'identifiants incorrects, un message d'erreur s'affiche.

---

## Tableau de bord (Dashboard)

### Accès : `/dashboard`

**Description** : Vue d'ensemble du système avec statistiques et informations clés.

**Fonctionnalités principales** :

#### 1. **Statistiques générales**
   - **Utilisateurs inscrits** : Nombre total d'utilisateurs
   - **Chauffeurs actifs** : Nombre de chauffeurs disponibles
   - **Réservations totales** : Nombre total de réservations
   - **Bus disponibles** : Nombre de bus en service
   - **Voyages planifiés** : Nombre de voyages programmés

#### 2. **Graphique des réservations**
   - Graphique en barres montrant les réservations par jour de la semaine
   - Permet de visualiser les tendances hebdomadaires

#### 3. **Utilisateurs par rôle**
   - Graphique circulaire (camembert) montrant la répartition des utilisateurs
   - Affiche les clients, chauffeurs et admins

#### 4. **Réservations récentes** (Admin/Superadmin uniquement)
   - Liste des 5 dernières réservations
   - Affiche : client, trajet, date et statut
   - Non visible pour les gestionnaires de colis

#### 5. **Meilleurs clients** (Admin/Superadmin uniquement)
   - Classement des clients avec le plus de réservations
   - Affichage du nombre de voyages effectués
   - Non visible pour les gestionnaires de colis

#### 6. **Top 5 Destinations Colis** (Gestionnaire de Colis/Superadmin uniquement)
   - Graphique en aires montrant les destinations les plus populaires pour les colis
   - Affiché côte à côte avec "Top 5 Clients Colis" pour les gestionnaires de colis
   - Non visible pour les admins

#### 7. **Top 5 Clients Colis** (Gestionnaire de Colis/Superadmin uniquement)
   - Liste des clients ayant envoyé le plus de colis
   - Avec leur nombre total de colis et dernière activité
   - Affiché côte à côte avec "Top 5 Destinations Colis" pour les gestionnaires de colis
   - Non visible pour les admins

#### 8. **Top 5 Chauffeurs** (Admin/Superadmin uniquement)
   - Classement des chauffeurs par nombre de voyages effectués
   - Indication du statut (actif/inactif)
   - Non visible pour les gestionnaires de colis

#### 9. **Widget des revenus**
   - Aperçu des revenus générés

**Affichage selon le rôle** :
- **Admin** : Voit toutes les statistiques sauf les sections liées aux colis (Top 5 Destinations Colis, Top 5 Clients Colis)
- **Gestionnaire de Colis** : Voit uniquement les statistiques générales, le graphique des réservations, les utilisateurs par rôle, et les sections liées aux colis (Top 5 Destinations Colis et Top 5 Clients Colis côte à côte)
- **Super Admin** : Voit toutes les sections sans restriction

**Responsive** : Le tableau de bord s'adapte automatiquement aux écrans mobiles.

---

## Gestion des Utilisateurs

### Accès : `/users`

**Description** : Page permettant de gérer tous les utilisateurs du système.

**Fonctionnalités** :

#### 1. **Liste des utilisateurs**
   - Tableau affichant : Nom, Numéro, Adresse, Rôle
   - Pagination intégrée (10, 25 ou 50 par page)

#### 2. **Recherche**
   - Champ de recherche pour filtrer par nom ou numéro
   - Recherche en temps réel

#### 3. **Filtrage par rôle**
   - Bouton filtre permettant de sélectionner :
     - Tous les rôles
     - Admin
     - Gestionnaire de colis
     - Conducteur
     - Client

#### 4. **Ajouter un utilisateur**
   - Bouton "Ajouter un utilisateur"
   - Formulaire inclut :
     - **Nom complet** (requis)
     - **Adresse email** (optionnel)
     - **Numéro de téléphone** (requis, format sénégalais : 77/78/76/70/75/33/71 + 7 chiffres)
     - **Adresse** (requis)
     - **Rôle** : Client, Administrateur ou Gestionnaire de Colis
     - **Mot de passe** (requis pour nouveau compte)

#### 5. **Modifier un utilisateur**
   - Cliquer sur l'icône ✏️ (crayon) à côté de l'utilisateur
   - Modifier les informations
   - Le mot de passe n'est requis que si vous souhaitez le changer

#### 6. **Supprimer un utilisateur**
   - Cliquer sur l'icône 🗑️ (poubelle)
   - Confirmation requise avant suppression

**Note** : Les admins voient uniquement les clients. Les superadmins voient tous les utilisateurs.

---

## Gestion des Chauffeurs

### Accès : `/drivers`

**Description** : Page de gestion complète des chauffeurs et de leurs véhicules.

**Fonctionnalités** :

#### 1. **Liste des chauffeurs**
   - Tableau avec : Nom, Téléphone, Matricule, Marque du véhicule, Capacité, Statut (Actif/Inactif)
   - Indicateur visuel du statut actif/inactif

#### 2. **Recherche**
   - Recherche par nom, téléphone, matricule ou marque de véhicule

#### 3. **Ajouter un chauffeur**
   - Formulaire complet incluant :
     - **Informations personnelles** :
       - Nom complet
       - Email (optionnel)
       - Numéro de téléphone (format sénégalais)
       - Adresse
       - Mot de passe
     - **Informations du véhicule** :
       - Matricule
       - Marque du véhicule
       - Capacité (nombre de places)
       - Capacité du coffre
       - Climatisation (case à cocher)
     - **Documents** :
       - Photo du chauffeur (image)
       - Permis de conduire (image)

#### 4. **Modifier un chauffeur**
   - Cliquer sur ✏️ pour modifier
   - Toutes les informations sont modifiables
   - Possibilité de changer les documents

#### 5. **Voir les détails**
   - Bouton "Voir détails" pour afficher toutes les informations d'un chauffeur
   - Affichage des documents (photo et permis)

#### 6. **Activer/Désactiver un chauffeur**
   - Utiliser le switch pour activer ou désactiver un chauffeur
   - Les chauffeurs inactifs n'apparaissent pas dans les sélections de nouveaux voyages

#### 7. **Supprimer un chauffeur**
   - Cliquer sur 🗑️
   - Confirmation requise

**Important** : Seuls les admins et superadmins ont accès à cette page.

---

## Gestion des Voyages

### Accès : `/voyage`

**Description** : Page pour planifier et gérer les voyages de covoiturage.

**Fonctionnalités** :

#### 1. **Liste des voyages**
   - Tableau affichant :
     - Trajet (départ → destination)
     - Conducteur assigné
     - Date et heure de départ
     - Prix par passager
     - Statut (Terminé, Aujourd'hui, Dans X jours, Programmé)

#### 2. **Recherche et filtres**
   - **Recherche textuelle** : Par conducteur, ville de départ, ville d'arrivée
   - **Filtre par statut** : Tous, À venir, Passés
   - **Filtre par date** : Sélection d'une période (date de début et date de fin)

#### 3. **Planifier un voyage**
   - Cliquer sur "Planifier un voyage"
   - Formulaire inclut :
     - **Sélection du conducteur** : Autocomplete avec recherche
       - Affiche : Nom, Marque du véhicule, Capacité
       - Seuls les chauffeurs actifs sont affichés
     - **Ville de départ** : Autocomplete avec liste des villes existantes
       - Possibilité d'ajouter une nouvelle ville (bouton +)
       - Possibilité de supprimer une ville (icône X dans la liste)
     - **Ville de destination** : Même principe que départ
     - **Date et heure de départ** : Sélecteur datetime-local
     - **Prix unitaire** : Prix en FCFA par passager

#### 4. **Gestion des villes**
   - **Ajouter une ville** : 
     - Cliquer sur le bouton ➕ à côté du champ de ville
     - Entrer le nom de la ville
     - La ville est automatiquement ajoutée et sélectionnée
   - **Supprimer une ville** :
     - Icône X apparaît dans la liste déroulante des villes
     - Impossible de supprimer une ville utilisée dans des voyages

#### 5. **Modifier un voyage**
   - Cliquer sur ✏️
   - Modifier les informations nécessaires
   - Un résumé du voyage s'affiche en bas du formulaire

#### 6. **Supprimer un voyage**
   - Cliquer sur 🗑️
   - Confirmation requise

#### 7. **Statuts visuels**
   - **Terminé** : Voyage dont la date est passée (rouge)
   - **Aujourd'hui** : Voyage prévu aujourd'hui (orange)
   - **Dans X jours** : Voyage dans les 7 prochains jours (bleu)
   - **Programmé** : Voyage au-delà de 7 jours (vert)

**Pagination** : 10, 25 ou 50 voyages par page.

---

## Gestion des Réservations

### Accès : `/reservations`

**Description** : Page pour gérer toutes les réservations (places et colis).

**Fonctionnalités** :

#### 1. **Liste des réservations**
   - Tableau avec : Client, Téléphone, Trajet, Date, Prix, Actions
   - Affiche uniquement les réservations à venir (les passées sont dans Historique)

#### 2. **Recherche et filtres**
   - **Recherche** : Par client, trajet, date
   - **Filtre par date** : Sélection d'une période

#### 3. **Nouvelle réservation**
   - Cliquer sur "Nouvelle Réservation"
   - Formulaire en plusieurs sections :

   **Section 1 : Utilisateur**
   - Autocomplete pour sélectionner un utilisateur
   - Bouton "Ajouter un utilisateur" pour créer rapidement un utilisateur
   - Formulaire rapide : Nom, Email (optionnel), Numéro, Mot de passe

   **Section 2 : Mode de transport**
   - Sélection parmi :
     - **Covoiturage** : Pour les voyages planifiés
     - **Minibus** : Pour les bus de petite capacité (≤30 places)
     - **Bus** : Pour les bus de grande capacité (>30 places)

   **Section 3 : Sélection du transport**
   - Si **Covoiturage** : Sélection d'un voyage avec affichage de :
     - Trajet (départ → destination)
     - Date et heure
     - Prix
     - Places disponibles
   - Si **Minibus ou Bus** : Sélection d'un bus avec :
     - Nom du bus
     - Trajet
     - Date de départ
     - Capacité et prix

   **Section 4 : Type de réservation**
   - **Place** : Réservation de siège(s)
     - Nombre de tickets (quantité)
   - **Colis** : Envoi de colis
     - Description du colis (requis)

   **Résumé** : Un résumé de la réservation s'affiche automatiquement quand tous les champs sont remplis.

#### 4. **Voir les détails d'une réservation**
   - Cliquer sur l'icône 👁️ (œil)
   - Affichage complet :
     - Informations du client
     - Détails de la réservation (référence, type, quantité, prix)
     - Informations du trajet
     - Informations du chauffeur/véhicule

#### 5. **Modifier une réservation**
   - Cliquer sur ✏️
   - Modifier les informations nécessaires

#### 6. **Supprimer une réservation**
   - Cliquer sur 🗑️
   - Confirmation requise

**Note** : Le système vérifie automatiquement la disponibilité des places avant de valider une réservation.

---

## Gestion des Colis

### Accès : `/colis`

**Description** : Page pour gérer les envois de colis via les voyages.

**Fonctionnalités** :

#### 1. **Liste des colis**
   - Tableau avec : Image, Destinataire, Voyage, Expéditeur (pour admins), Statut, Actions
   - Affiche uniquement les colis pour voyages à venir

#### 2. **Recherche et filtres**
   - **Recherche** : Par destinataire, description, trajet
   - **Filtre par statut** : Tous, En attente, Envoyé, Reçu, Annulé
   - **Filtre par voyage** : Sélection d'un voyage spécifique

#### 3. **Envoyer un colis**
   - Cliquer sur "Envoyer un colis"
   - Formulaire en sections :

   **Section 1 : Voyage**
   - Sélection du voyage parmi les voyages disponibles
   - Affichage : Trajet et date

   **Section 2 : Destinataire**
   - Nom du destinataire (requis)
   - Téléphone (requis)
   - Adresse (optionnel)

   **Section 3 : Détails du colis**
   - Description du colis (optionnel)

   **Section 4 : Prix** (Admin/Gestionnaire uniquement)
   - Définition du prix en FCFA pour le colis

   **Section 5 : Image**
   - Téléchargement d'une photo du colis (optionnel)
   - Formats acceptés : images (JPG, PNG, etc.)
   - Taille maximale : 5 MB
   - Aperçu avant validation

#### 4. **Voir les détails d'un colis**
   - Bouton "Voir détails"
   - Affichage complet :
     - Informations du destinataire
     - Informations du colis (statut, description, prix si applicable)
     - Informations du voyage
     - Photo du colis (si disponible)

#### 5. **Modifier un colis**
   - Cliquer sur ✏️
   - Modifier les informations
   - Possibilité de changer la photo

#### 6. **Supprimer un colis**
   - Cliquer sur 🗑️
   - Confirmation requise

**Statuts** :
- **En attente** : Colis déposé mais pas encore envoyé
- **Envoyé** : Colis en transit
- **Reçu** : Colis livré au destinataire
- **Annulé** : Colis annulé

**Note** : Les clients ne voient que leurs propres colis. Les admins et gestionnaires voient tous les colis.

---

## Gestion des Bus

### Accès : `/buses`

**Description** : Page pour gérer les bus et minibus du système.

**Fonctionnalités** :

#### 1. **Liste des bus**
   - Tableau avec : Nom, Plaque, Capacité, Trajet, Date de départ, Prix, Statut, Actions
   - Indicateur de statut (Actif/Inactif)

#### 2. **Recherche et filtres**
   - **Recherche** : Par nom, plaque, trajet
   - **Filtre par statut** : Tous, Actifs, Inactifs

#### 3. **Ajouter un bus**
   - Cliquer sur "Ajouter un bus"
   - Formulaire inclut :
     - **Nom du bus** : Ex: "Bus Express 1"
     - **Numéro de plaque** : Plaque d'immatriculation
     - **Capacité** : Nombre total de places
     - **Ville de départ** : Autocomplete avec possibilité d'ajouter une ville
     - **Ville de destination** : Même principe
     - **Date et heure de départ** : Sélecteur datetime-local
     - **Prix** : Prix en FCFA par place
     - **Statut actif** : Switch pour activer/désactiver

#### 4. **Gestion des villes**
   - Comme pour les voyages, possibilité d'ajouter/supprimer des villes

#### 5. **Modifier un bus**
   - Cliquer sur ✏️
   - Modifier les informations

#### 6. **Activer/Désactiver un bus**
   - Utiliser le switch dans la liste ou dans le formulaire

#### 7. **Voir les détails**
   - Affichage complet des informations du bus

#### 8. **Supprimer un bus**
   - Cliquer sur 🗑️
   - Confirmation requise

**Note** : Seuls les admins et superadmins ont accès à cette page.

---

## Gestion des Annonces

### Accès : `/annonces`

**Description** : Page pour créer et gérer les annonces/publicités affichées dans l'application.

**Fonctionnalités** :

#### 1. **Liste des annonces**
   - Affichage en grille avec cartes
   - Chaque carte affiche :
     - Image de l'annonce
     - Titre
     - Date de publication
     - Date de fin
     - Statut (Active/Expirée)

#### 2. **Créer une annonce**
   - Formulaire inclut :
     - **Titre** : Titre de l'annonce (requis)
     - **Description** : Texte de l'annonce (requis)
     - **Date de publication** : Date de début (requis)
     - **Date de fin** : Date d'expiration (requis)
     - **Image** : Photo de l'annonce (requis, formats image)

#### 3. **Modifier une annonce**
   - Cliquer sur ✏️ sur la carte de l'annonce
   - Modifier les informations
   - Possibilité de changer l'image

#### 4. **Supprimer une annonce**
   - Cliquer sur 🗑️
   - Confirmation requise

**Note** : Seuls les admins et superadmins ont accès à cette page.

---

## Historique

### Accès : `/historique`

**Description** : Page pour consulter l'historique des voyages, réservations et colis (notamment les éléments passés).

**Fonctionnalités** :

#### 1. **Onglets**
   - **Voyages** : Historique des voyages
   - **Réservations** : Historique des réservations
   - **Colis** : Historique des colis

#### 2. **Recherche**
   - Champ de recherche pour filtrer dans l'onglet actif

#### 3. **Filtres avancés**
   - **Statut temporel** :
     - Tous
     - Expiré (passé)
     - Aujourd'hui
     - À venir
   - **Filtre par utilisateur** (pour réservations et colis)
   - **Filtre par date** : Sélection d'une date spécifique

#### 4. **Affichage des éléments**

   Chaque type d'élément affiche des informations spécifiques :

   **Voyages** :
   - Trajet (départ → destination)
   - Date et heure de départ
   - Nombre de places disponibles
   - Prix par passager
   - **Chauffeur** : Nom et numéro de téléphone du chauffeur assigné
   - Statut temporel (Expiré, Aujourd'hui, À venir)

   **Réservations** :
   - Nom du client
   - Trajet (départ → destination)
   - Type de réservation (Place ou Colis)
   - Nombre de tickets si place
   - Prix total
   - **Téléphone** : Numéro de téléphone du client ayant effectué la réservation
   - Date et heure de départ
   - Date de création de la réservation
   - Statut temporel (Expiré, Aujourd'hui, À venir)

   **Colis** :
   - Nom du destinataire
   - Trajet (départ → destination)
   - Téléphone du destinataire
   - **Expéditeur** : Nom et numéro de téléphone de l'expéditeur
   - Prix du colis (si défini)
   - Description du colis
   - Date et heure de départ du voyage
   - Statut du colis (En attente, Envoyé, Reçu, Annulé)
   - Statut temporel (Expiré, Aujourd'hui, À venir)

#### 5. **Pagination**
   - 5, 10 ou 25 éléments par page (sélectionnable)
   - Navigation entre les pages
   - Compteur du nombre total d'éléments filtrés

#### 6. **Filtres actifs**
   - Les filtres actifs sont affichés sous forme de puces (chips) cliquables
   - Possibilité de supprimer chaque filtre individuellement en cliquant sur la croix

**Utilisation** :
1. Sélectionner l'onglet désiré (Voyages, Réservations ou Colis)
2. Utiliser les filtres pour affiner la recherche :
   - Par statut temporel (par défaut : "Expiré")
   - Par utilisateur (pour réservations et colis)
   - Par date spécifique
3. Utiliser la recherche textuelle pour trouver rapidement un élément
4. Naviguer entre les pages avec la pagination
5. Supprimer les filtres en cliquant sur les puces de filtres actifs

**Note** : Les éléments expirés sont affichés avec une opacité réduite et un fond légèrement coloré pour les distinguer facilement.

---

## Mon Profil

### Accès : `/profile`

**Description** : Page personnelle pour gérer ses propres informations et mot de passe.

**Fonctionnalités** :

#### 1. **Affichage du profil**
   - Avatar avec initiales
   - Nom complet
   - Email
   - Numéro de téléphone
   - Rôle
   - Date d'inscription

#### 2. **Modifier le profil**
   - Cliquer sur le bouton "Modifier le profil"
   - Modifier :
     - Nom complet
     - Email
     - Numéro de téléphone (format sénégalais requis)

#### 3. **Changer le mot de passe**
   - Dans le mode édition :
     - **Mot de passe actuel** : Requis pour changer
     - **Nouveau mot de passe** : Minimum 6 caractères
     - **Confirmer le mot de passe** : Doit correspondre au nouveau

#### 4. **Sauvegarder**
   - Cliquer sur "Enregistrer" pour valider les modifications
   - Cliquer sur "Annuler" pour annuler les modifications

**Validation** :
- Le numéro de téléphone doit respecter le format sénégalais
- Les mots de passe doivent correspondre
- Le mot de passe actuel est requis pour changer le mot de passe

---

## Navigation et Interface

### Sidebar (Menu latéral)

Le menu latéral permet de naviguer entre les différentes pages :

- **Tableau de bord** : Vue d'ensemble
- **Utilisateurs** : Gestion des utilisateurs
- **Chauffeurs** : Gestion des chauffeurs (Admin/Superadmin uniquement)
- **Voyages** : Gestion des voyages (Admin/Superadmin uniquement)
- **Réservations** : Gestion des réservations (Admin/Superadmin uniquement)
- **Colis** : Gestion des colis (tous sauf Admin)
- **Bus** : Gestion des bus (Admin/Superadmin uniquement)
- **Annonces** : Gestion des annonces (Admin/Superadmin uniquement)
- **Historique** : Consultation de l'historique
- **Mon Profil** : Gestion du profil personnel
- **Déconnexion** : Quitter la session

**Note** : Le menu s'adapte selon le rôle de l'utilisateur connecté.

### Header (En-tête)

- Affiche le nom de l'utilisateur connecté
- Bouton de déconnexion

---

## Conseils et Bonnes Pratiques

### Général

1. **Sauvegardez régulièrement** : Après chaque modification importante, vérifiez que les données sont bien enregistrées
2. **Vérifiez les champs requis** : Les champs marqués comme requis doivent être remplis
3. **Format des numéros** : Les numéros de téléphone doivent commencer par 77, 78, 76, 70, 75, 33 ou 71
4. **Dates** : Respectez le format datetime pour les dates avec heure

### Gestion des voyages

1. **Vérifiez la disponibilité** : Avant de planifier un voyage, assurez-vous que le chauffeur est disponible
2. **Gestion des villes** : Ajoutez les villes fréquemment utilisées pour gagner du temps
3. **Prix** : Définissez des prix cohérents avec le marché

### Gestion des réservations

1. **Vérifiez les places** : Le système vérifie automatiquement la disponibilité, mais soyez attentif aux messages d'erreur
2. **Création rapide d'utilisateur** : Utilisez le bouton "Ajouter un utilisateur" dans le formulaire de réservation pour créer rapidement un client

### Gestion des colis

1. **Photos** : Prenez des photos claires des colis pour faciliter leur identification
2. **Informations complètes** : Remplissez toutes les informations du destinataire pour éviter les erreurs de livraison

---

## Messages d'erreur courants

### Erreurs d'authentification
- **"Token d'authentification expiré"** : Votre session a expiré, reconnectez-vous
- **"Mot de passe incorrect"** : Vérifiez votre mot de passe
- **"Utilisateur non trouvé"** : Vérifiez votre email

### Erreurs de validation
- **"Le numéro de téléphone doit commencer par..."** : Respectez le format sénégalais
- **"Tous les champs sont requis"** : Remplissez tous les champs obligatoires
- **"Pas assez de places disponibles"** : Réduisez la quantité ou choisissez un autre voyage/bus

### Erreurs serveur
- **"Erreur serveur"** : Problème temporaire, réessayez plus tard
- **"Impossible de se connecter au serveur"** : Vérifiez votre connexion internet

---

## Support

En cas de problème ou de question :

1. Vérifiez ce guide d'utilisation
2. Consultez les messages d'erreur affichés
3. Contactez votre administrateur système

---

**Dernière mise à jour** : 2025

**Version** : 1.0

