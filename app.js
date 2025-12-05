// ===============================
// DIGIY CHAUFFEUR PRO — app.js
// ===============================

// On suppose que firebase-config.js a déjà fait :
// firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const app = {
  driverId: null,
  driverData: null,
  currentRideId: null,
  currentRide: null,
  isOnline: false,
  earningsChart: null,

  // =========================
  // INIT GÉNÉRAL APP
  // =========================
  init: function () {
    // Écran de chargement minimal
    window.addEventListener("load", () => {
      const loading = document.getElementById("loading-screen");
      if (loading) {
        setTimeout(() => loading.style.display = "none", 500);
      }

      // Auto-reconnexion si driver déjà en mémoire
      const savedId = localStorage.getItem("driverId");
      if (savedId) {
        this.restoreSession(savedId);
      }
    });
  },

  // =========================
  // SESSION & LOGIN
  // =========================
  login: async function () {
    const phoneInput = document.getElementById("phone-input");
    const pinInput = document.getElementById("password-input");

    const phone = phoneInput.value.trim();
    const pin = pinInput.value.trim();

    if (!phone || !pin) {
      this.showToast("Numéro ou PIN manquant.", "error");
      return;
    }

    try {
      // Recherche par téléphone
      const snap = await db.ref("drivers")
        .orderByChild("phone")
        .equalTo(phone)
        .once("value");

      if (!snap.exists()) {
        this.showToast("Aucun chauffeur trouvé avec ce numéro.", "error");
        return;
      }

      let driver = null;
      let driverId = null;

      snap.forEach(child => {
        driverId = child.key; // ex: CHA-2889-5678
        driver = child.val();
      });

      if (!driver || driver.pin !== pin) {
        this.showToast("PIN incorrect.", "error");
        return;
      }

      // Sauvegarde session
      this.driverId = driverId;
      this.driverData = driver;
      localStorage.setItem("driverId", driverId);

      // Mise en ligne par défaut (hors bouton)
      await this.setOnlineStatus(true);

      // Mise à jour UI
      this.afterLoginUI();

      // Écoute des courses
      this.listenForRides(driverId);

      this.showToast("Connexion réussie. Bienvenue, " + driver.name, "success");
    } catch (err) {
      console.error(err);
      this.showToast("Erreur de connexion. Réessaie.", "error");
    }
  },

  restoreSession: async function (driverId) {
    try {
      const snap = await db.ref("drivers/" + driverId).once("value");
      if (!snap.exists()) {
        // Session périmée
        localStorage.removeItem("driverId");
        return;
      }
      this.driverId = driverId;
      this.driverData = snap.val();

      // Mise en ligne par défaut (au démarrage)
      await this.setOnlineStatus(true);

      this.afterLoginUI();
      this.listenForRides(driverId);
      this.showToast("Session restaurée pour " + this.driverData.name, "info");
    } catch (err) {
      console.error(err);
    }
  },

  afterLoginUI: function () {
    const loginScreen = document.getElementById("login-screen");
    const appContainer = document.getElementById("app");
    const driverName = document.getElementById("driver-name");

    if (loginScreen) loginScreen.style.display = "none";
    if (appContainer) appContainer.style.display = "block";
    if (driverName && this.driverData) driverName.textContent = this.driverData.name || "Chauffeur";

    // Initialiser vue accueil
    this.showView("home");

    // Init carte + graphique
    this.initMap();
    this.initChart();
  },

  logout: async function () {
    if (this.driverId) {
      try {
        await db.ref("drivers_online/" + this.driverId).remove();
      } catch (e) {
        console.error(e);
      }
    }

    this.driverId = null;
    this.driverData = null;
    this.currentRideId = null;
    this.currentRide = null;
    this.isOnline = false;
    localStorage.removeItem("driverId");

    const appContainer = document.getElementById("app");
    const loginScreen = document.getElementById("login-screen");
    if (appContainer) appContainer.style.display = "none";
    if (loginScreen) loginScreen.style.display = "block";

    this.showToast("Déconnecté.", "info");
  },

  showRegister: function () {
    // Pour l’instant, redirige vers une page d’inscription globale DIGIY si tu veux
    window.location.href = "https://digiylyfe.com/digiy-inscription/";
  },

  // =========================
  // ONLINE / OFFLINE
  // =========================
  toggleStatus: async function () {
    if (!this.driverId) {
      this.showToast("Connecte-toi d’abord.", "error");
      return;
    }

    const newStatus = !this.isOnline;
    await this.setOnlineStatus(newStatus);
    this.showToast(newStatus ? "Tu es en ligne, prêt pour les courses." : "Tu es hors ligne.", "info");
  },

  setOnlineStatus: async function (online) {
    this.isOnline = online;
    const statusBtn = document.getElementById("status-toggle");
    const statusText = document.getElementById("status-text");

    if (statusBtn) {
      statusBtn.classList.toggle("offline", !online);
      statusBtn.classList.toggle("online", online);
    }

    if (statusText) {
      statusText.textContent = online ? "En ligne" : "Hors ligne";
    }

    if (!this.driverData || !this.driverId) return;

    const onlineRef = db.ref("drivers_online/" + this.driverId);

    if (online) {
      await onlineRef.set({
        name: this.driverData.name || "Chauffeur",
        phone: this.driverData.phone || "",
        vehicle: this.driverData.vehicle?.model || "",
        color: this.driverData.vehicle?.color || "",
        plate: this.driverData.vehicle?.plate || "",
        rating: this.driverData.stats?.rating || 5,
        isOnline: true,
        lat: 0,
        lng: 0,
        updatedAt: Date.now()
      });
    } else {
      await onlineRef.remove();
    }
  },

  // =========================
  // VUES & NAVIGATION
  // =========================
  showView: function (viewName) {
    const views = document.querySelectorAll(".view");
    views.forEach(v => v.classList.remove("active"));

    const target = document.getElementById(viewName + "-view");
    if (target) target.classList.add("active");

    const navItems = document.querySelectorAll(".bottom-nav .nav-item");
    navItems.forEach(btn => {
      const view = btn.getAttribute("data-view");
      btn.classList.toggle("active", view === viewName);
    });
  },

  showMenu: function () {
    this.showToast("Menu chauffeur à venir.", "info");
  },

  // =========================
  // COURSES (RIDES)
  // =========================
  listenForRides: function (driverId) {
    if (!driverId) return;

    const rideQuery = db.ref("rides").orderByChild("driverUid").equalTo(driverId);

    rideQuery.on("value", snap => {
      let activeRide = null;
      let activeId = null;

      snap.forEach(child => {
        const ride = child.val();
        const id = child.key;
        // On prend la dernière course non terminée comme référence
        if (ride.status && ride.status !== "completed" && ride.status !== "canceled") {
          activeRide = ride;
          activeId = id;
        }
      });

      if (activeRide && activeId) {
        this.currentRide = activeRide;
        this.currentRideId = activeId;
        this.displayActiveRequest(activeId, activeRide);
      } else {
        this.clearActiveRequest();
      }
    });
  },

  displayActiveRequest: function (rideId, ride) {
    const requestEl = document.getElementById("active-request");
    const noRequestEl = document.getElementById("no-request");

    if (requestEl) requestEl.style.display = "block";
    if (noRequestEl) noRequestEl.style.display = "none";

    // Remplir les infos
    const passengerName = document.getElementById("passenger-name");
    const pickupLocation = document.getElementById("pickup-location");
    const dropoffLocation = document.getElementById("dropoff-location");
    const tripDistance = document.getElementById("trip-distance");
    const tripDuration = document.getElementById("trip-duration");
    const tripPrice = document.getElementById("trip-price");

    if (passengerName) passengerName.textContent = ride.clientName || "Client";
    if (pickupLocation) pickupLocation.textContent = ride.pickup?.address || "Départ";
    if (dropoffLocation) dropoffLocation.textContent = ride.dropoff?.address || "Arrivée";
    if (tripDistance) tripDistance.textContent = ride.distanceKm || 0;
    if (tripDuration) tripDuration.textContent = ride.durationMin || 0;
    if (tripPrice) tripPrice.textContent = (ride.price || 0) + " FCFA";

    // Compte à rebours simple (optionnel)
    const countdownEl = document.getElementById("request-countdown");
    if (countdownEl) {
      let time = 30;
      countdownEl.textContent = time;
      const interval = setInterval(() => {
        time--;
        if (time <= 0) {
          clearInterval(interval);
        }
        if (countdownEl) countdownEl.textContent = time;
      }, 1000);
    }
  },

  clearActiveRequest: function () {
    const requestEl = document.getElementById("active-request");
    const noRequestEl = document.getElementById("no-request");
    const activeTripEl = document.getElementById("active-trip");

    if (requestEl) requestEl.style.display = "none";
    if (activeTripEl) activeTripEl.style.display = "none";
    if (noRequestEl) noRequestEl.style.display = "block";

    this.currentRide = null;
    this.currentRideId = null;
  },

  acceptRequest: async function () {
    if (!this.currentRideId || !this.driverId) {
      this.showToast("Aucune course à accepter.", "error");
      return;
    }

    try {
      await db.ref("rides/" + this.currentRideId).update({
        status: "accepted",
        acceptedAt: Date.now()
      });

      this.showToast("Course acceptée.", "success");
      this.showActiveTripUI();
    } catch (err) {
      console.error(err);
      this.showToast("Erreur en acceptant la course.", "error");
    }
  },

  declineRequest: async function () {
    if (!this.currentRideId) {
      this.showToast("Aucune course à refuser.", "error");
      return;
    }
    try {
      await db.ref("rides/" + this.currentRideId).update({
        status: "canceled",
        canceledAt: Date.now()
      });
      this.showToast("Course refusée.", "info");
      this.clearActiveRequest();
    } catch (err) {
      console.error(err);
      this.showToast("Erreur en refusant la course.", "error");
    }
  },

  showActiveTripUI: function () {
    const requestEl = document.getElementById("active-request");
    const activeTripEl = document.getElementById("active-trip");
    const noRequestEl = document.getElementById("no-request");

    if (requestEl) requestEl.style.display = "none";
    if (noRequestEl) noRequestEl.style.display = "none";
    if (activeTripEl) activeTripEl.style.display = "block";

    // Remplir les infos de trajet actif
    const ride = this.currentRide;
    if (!ride) return;

    const tripStatus = document.getElementById("trip-status");
    const tripPassengerName = document.getElementById("trip-passenger-name");
    const tripPassengerPhone = document.getElementById("trip-passenger-phone");
    const tripPickup = document.getElementById("trip-pickup");
    const tripDropoff = document.getElementById("trip-dropoff");
    const tripActionText = document.getElementById("trip-action-text");

    if (tripStatus) tripStatus.textContent = "En route vers le client";
    if (tripPassengerName) tripPassengerName.textContent = ride.clientName || "Client";
    if (tripPassengerPhone) tripPassengerPhone.textContent = ride.clientPhone || "";
    if (tripPickup) tripPickup.textContent = ride.pickup?.address || "Départ";
    if (tripDropoff) tripDropoff.textContent = ride.dropoff?.address || "Arrivée";
    if (tripActionText) tripActionText.textContent = "J'arrive";
  },

  nextTripStep: async function () {
    if (!this.currentRideId || !this.currentRide) return;

    const statusEl = document.getElementById("trip-status");
    const actionTextEl = document.getElementById("trip-action-text");

    let newStatus = this.currentRide.status;
    let label = "";
    let btnLabel = "";

    if (newStatus === "accepted" || newStatus === "on_the_way") {
      newStatus = "arrived";
      label = "Arrivé au point de départ";
      btnLabel = "Course démarrée";
    } else if (newStatus === "arrived") {
      newStatus = "in_progress";
      label = "Course en cours";
      btnLabel = "Terminer la course";
    } else if (newStatus === "in_progress") {
      newStatus = "completed";
      label = "Course terminée";
      btnLabel = "Course terminée";
    } else {
      newStatus = "completed";
      label = "Course terminée";
      btnLabel = "Course terminée";
    }

    try {
      const updatePayload = { status: newStatus };
      if (newStatus === "arrived") updatePayload.arrivedAt = Date.now();
      if (newStatus === "in_progress") updatePayload.startedAt = Date.now();
      if (newStatus === "completed") updatePayload.completedAt = Date.now();

      await db.ref("rides/" + this.currentRideId).update(updatePayload);

      this.currentRide.status = newStatus;

      if (statusEl) statusEl.textContent = label;
      if (actionTextEl) actionTextEl.textContent = btnLabel;

      if (newStatus === "completed") {
        this.showToast("Course terminée.", "success");
        setTimeout(() => {
          this.clearActiveRequest();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      this.showToast("Erreur mise à jour statut.", "error");
    }
  },

  showTripActions: function () {
    this.showToast("Menu actions course à venir.", "info");
  },

  filterTrips: function (range) {
    // Pour l’instant on affiche juste un message.
    this.showToast("Filtre historique : " + range, "info");
  },

  callPassenger: function () {
    if (!this.currentRide || !this.currentRide.clientPhone) {
      this.showToast("Numéro client indisponible.", "error");
      return;
    }
    window.location.href = "tel:" + this.currentRide.clientPhone;
  },

  chatPassenger: function () {
    if (!this.currentRide || !this.currentRide.clientPhone) {
      this.showToast("Numéro WhatsApp indisponible.", "error");
      return;
    }
    const num = this.currentRide.clientPhone.replace(/\D/g, "");
    window.open("https://wa.me/" + num, "_blank");
  },

  // =========================
  // PROFIL & SUPPORT (STUBS)
  // =========================
  editProfile: function () {
    this.showToast("Édition du profil bientôt dispo.", "info");
  },

  editVehicle: function () {
    this.showToast("Édition du véhicule bientôt dispo.", "info");
  },

  showDocuments: function () {
    this.showToast("Espace documents (CNI, permis, assurance) en préparation.", "info");
  },

  showSettings: function () {
    this.showToast("Paramètres à venir (langue, notifications, etc.).", "info");
  },

  showSupport: function () {
    window.open("https://wa.me/221771342889?text=Support%20DIGIY%20Chauffeur", "_blank");
  },

  // =========================
  // MAPS / GOOGLE MAPS
  // =========================
  initMap: function () {
    const mapContainer = document.getElementById("map");
    if (!mapContainer || !window.google || !google.maps) return;

    const defaultPos = { lat: 14.4923, lng: -17.0465 }; // Saly / AIBD approx

    const map = new google.maps.Map(mapContainer, {
      center: defaultPos,
      zoom: 12,
      disableDefaultUI: true
    });

    // Afficher position approximative si GPS pas encore branché
    const marker = new google.maps.Marker({
      position: defaultPos,
      map,
      title: "Position approximative"
    });

    const positionLabel = document.getElementById("current-position");
    if (positionLabel) {
      positionLabel.textContent = "Position approximative (Saly / AIBD)";
    }

    // Si on a la géoloc, on peut l'utiliser plus tard
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          map.setCenter(loc);
          marker.setPosition(loc);
          if (positionLabel) {
            positionLabel.textContent = "Position actuelle localisée";
          }
          // Option : envoyer la position dans drivers_online
          if (app.driverId) {
            db.ref("drivers_online/" + app.driverId).update({
              lat: loc.lat,
              lng: loc.lng,
              updatedAt: Date.now()
            });
          }
        },
        () => {
          // On laisse la position par défaut
        }
      );
    }
  },

  // =========================
  // CHART / GAINS
  // =========================
  initChart: function () {
    const ctx = document.getElementById("earnings-chart");
    if (!ctx || !window.Chart) return;

    this.earningsChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
        datasets: [{
          label: "Gains (FCFA)",
          data: [0, 0, 0, 0, 0, 0, 0]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { display: true },
          y: { display: true }
        }
      }
    });
  },

  // (Tu pourras plus tard updater ce graphe avec de vrais chiffres)
  updateEarningsUI: function (stats) {
    // stats = { today, week, month, tripsMonth, avgTrip }
    if (!stats) return;

    const monthEarnings = document.getElementById("month-earnings");
    const gainsToday = document.getElementById("gains-today");
    const gainsWeek = document.getElementById("gains-week");
    const tripsMonth = document.getElementById("trips-month");
    const avgTrip = document.getElementById("avg-trip");

    if (monthEarnings) monthEarnings.textContent = (stats.month || 0) + " FCFA";
    if (gainsToday) gainsToday.textContent = (stats.today || 0) + " FCFA";
    if (gainsWeek) gainsWeek.textContent = (stats.week || 0) + " FCFA";
    if (tripsMonth) tripsMonth.textContent = stats.tripsMonth || 0;
    if (avgTrip) avgTrip.textContent = (stats.avgTrip || 0) + " FCFA";

    if (this.earningsChart) {
      this.earningsChart.data.datasets[0].data = stats.byDay || [0, 0, 0, 0, 0, 0, 0];
      this.earningsChart.update();
    }
  },

  // =========================
  // TOAST / NOTIFS
  // =========================
  showToast: function (message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) {
      alert(message);
      return;
    }

    const toast = document.createElement("div");
    toast.className = "toast " + type;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("visible");
    }, 10);

    setTimeout(() => {
      toast.classList.remove("visible");
      setTimeout(() => container.removeChild(toast), 300);
    }, 3000);
  }
};

// On expose dans le scope global
window.app = app;
app.init();
