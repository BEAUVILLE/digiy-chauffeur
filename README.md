# DIGIY CHAUFFEUR PRO 🚗

**Application web professionnelle pour les chauffeurs VTC au Sénégal**

## 🎯 Caractéristiques

### ✨ Fonctionnalités principales
- **Statut en ligne/hors ligne** : Contrôlez votre disponibilité
- **Réception de courses en temps réel** : Notifications instantanées
- **Géolocalisation GPS** : Tracking en temps réel
- **Gestion des courses** : Accepter, refuser, suivre les courses
- **Historique complet** : Toutes vos courses avec détails
- **Statistiques détaillées** : Gains quotidiens, hebdomadaires, mensuels
- **0% de commission** : 100% de vos gains pour vous !
- **Interface professionnelle** : Design moderne et intuitif
- **Multi-tenant** : Architecture pour plusieurs villes/pays

### 📱 Écrans disponibles
1. **Accueil** : Carte GPS, statut, demandes de course
2. **Courses** : Historique avec filtres (aujourd'hui, semaine, mois)
3. **Gains** : Statistiques et graphiques de revenus
4. **Profil** : Informations chauffeur et véhicule

## 🚀 Déploiement sur GitHub Pages

### 1️⃣ Préparer le projet

```bash
cd digiy-chauffeur
git init
git add .
git commit -m "Initial commit - DIGIY CHAUFFEUR PRO"
```

### 2️⃣ Créer le repo GitHub

```bash
# Remplace USERNAME par ton nom d'utilisateur GitHub
git remote add origin https://github.com/beauville/digiy-chauffeur.git
git branch -M main
git push -u origin main
```

### 3️⃣ Activer GitHub Pages

1. Va sur ton repo : `https://github.com/beauville/digiy-chauffeur`
2. **Settings** → **Pages**
3. **Source** : Deploy from a branch
4. **Branch** : `main` → `/root`
5. **Save**

✅ Ton app sera disponible sur : **https://beauville.github.io/digiy-chauffeur/**

## 🔧 Configuration

### Firebase Setup

1. Créer un projet Firebase : https://console.firebase.google.com
2. Activer **Realtime Database**
3. Activer **Authentication** (Phone)
4. Copier la configuration dans `js/firebase-config.js`

```javascript
const firebaseConfig = {
    apiKey: "TON_API_KEY",
    authDomain: "TON_PROJECT.firebaseapp.com",
    databaseURL: "https://TON_PROJECT.firebaseio.com",
    projectId: "TON_PROJECT_ID",
    storageBucket: "TON_PROJECT.appspot.com",
    messagingSenderId: "TON_SENDER_ID",
    appId: "TON_APP_ID"
};
```

### Google Maps API

1. Créer une clé API : https://console.cloud.google.com
2. Activer **Maps JavaScript API** et **Geocoding API**
3. Remplacer dans `index.html` :

```html
<script src="https://maps.googleapis.com/maps/api/js?key=TA_CLE_API&libraries=places"></script>
```

### Domaines autorisés Firebase

Dans Firebase Console → **Authentication** → **Settings** → **Authorized domains**, ajoute :
- `beauville.github.io`
- `localhost` (pour développement)

## 📊 Structure du projet

```
digiy-chauffeur/
├── index.html              # Page principale
├── css/
│   └── style.css          # Styles de l'application
├── js/
│   ├── app.js             # Logique principale
│   └── firebase-config.js # Configuration Firebase
└── README.md              # Documentation
```

## 🎨 Personnalisation

### Couleurs (dans `css/style.css`)
```css
:root {
    --primary: #FF6B35;      /* Orange DIGIY */
    --secondary: #004E89;    /* Bleu DIGIY */
    --success: #10B981;      /* Vert */
    --danger: #EF4444;       /* Rouge */
}
```

## 📱 Utilisation

### Pour les chauffeurs

1. **Connexion** : Numéro de téléphone + Code PIN
2. **Passer en ligne** : Cliquer sur le bouton de statut
3. **Recevoir une course** : Notification avec détails
4. **Accepter/Refuser** : 30 secondes pour décider
5. **Suivre la course** :
   - "J'arrive" → Client à bord
   - "Démarrer" → Course en cours
   - "Terminer" → Fin de course
6. **Consulter les gains** : Onglet "Gains"

## 🔗 Intégration DIGIYLYFE

### Avec DIGIY CORE
```javascript
// Synchronisation des données chauffeur
const driverId = 'driver_123';
firebaseDb.driversRef.child(driverId).on('value', (snapshot) => {
    // Mise à jour en temps réel
});
```

### Avec DIGIY CHAT PRO
```javascript
// Communication chauffeur-passager
function chatPassenger() {
    window.location.href = `https://beauville.github.io/digiy-chat-pro/?user=${passengerId}`;
}
```

### Avec DIGIY PAY
```javascript
// Paiement des courses
function processPayment(amount) {
    // Intégration DIGIY PAY
}
```

## 🌍 Multi-tenant (Sénégal, France, etc.)

```javascript
// Configuration par pays
const config = {
    senegal: {
        currency: 'FCFA',
        basePrice: 500,
        kmPrice: 350
    },
    france: {
        currency: '€',
        basePrice: 5,
        kmPrice: 1.5
    }
};
```

## 📈 Roadmap

- [ ] Notifications push
- [ ] Mode hors ligne
- [ ] Historique de navigation
- [ ] Intégration complète DIGIY PAY
- [ ] Chat temps réel avec passagers
- [ ] Système de pourboires
- [ ] Export des gains (PDF)
- [ ] Application mobile native

## 🆘 Support

**DIGIYLYFE Support**
- 📧 Email : support@digiylyfe.com
- 📱 WhatsApp : +221 77 XXX XX XX
- 🌐 Site : https://digiylyfe.com

## 📄 Licence

**DIGIYLYFE** © 2024 - Tous droits réservés

---

**Pierre par pierre, on construit l'Afrique digitale ! 🚀**

GO GO GO frérot ! 💪🔥
