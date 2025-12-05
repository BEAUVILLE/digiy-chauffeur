// driver-chauffeur.js
import { db, auth } from "./firebase-config.js";
import {
  ref,
  set,
  update
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";
import {
  onAuthStateChanged,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// UID chauffeur courant (firebase auth)
let currentDriverUid = null;

// 1) Auth automatique (anonyme si pas déjà connecté)
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentDriverUid = user.uid;
    console.log("Chauffeur connecté (auth):", currentDriverUid);
  } else {
    // Pas connecté → on crée une session anonyme
    signInAnonymously(auth)
      .then((cred) => {
        currentDriverUid = cred.user.uid;
        console.log("Chauffeur anonyme créé:", currentDriverUid);
      })
      .catch((error) => {
        console.error("Erreur auth anonyme:", error);
        alert("Impossible d'initialiser la session chauffeur. Réessaie plus tard.");
      });
  }
});

// 2) Récupère données du formulaire et enregistre dans Firebase
async function submitDriverForm(event) {
  event.preventDefault();

  if (!currentDriverUid) {
    alert("Patiente une seconde, on initialise ton espace DIGIY DRIVER…");
    return;
  }

  const fullName = document.getElementById("driverFullName")?.value.trim();
  const phone = document.getElementById("driverPhone")?.value.trim();
  const zone = document.getElementById("driverZone")?.value.trim();

  const vehicleType = document.getElementById("vehicleType")?.value.trim();
  const vehicleBrand = document.getElementById("vehicleBrand")?.value.trim();
  const vehicleModel = document.getElementById("vehicleModel")?.value.trim();
  const vehicleColor = document.getElementById("vehicleColor")?.value.trim();
  const vehiclePlate = document.getElementById("vehiclePlate")?.value.trim();
  const vehicleSeats = parseInt(document.getElementById("vehicleSeats")?.value || "4", 10);

  const baseFare = parseInt(document.getElementById("baseFare")?.value || "0", 10);
  const perKm = parseInt(document.getElementById("perKm")?.value || "0", 10);
  const airportFlat = parseInt(document.getElementById("airportFlat")?.value || "0", 10);

  if (!fullName || !phone || !zone) {
    alert("Merci de remplir au minimum : Nom, Téléphone, Zone.");
    return;
  }

  const now = Date.now();

  // JSON chauffeur — aligne avec ce qu’on a posé dans les règles
  const driverData = {
    uid: currentDriverUid,
    fullName,
    phone,
    whatsapp: phone,
    email: "",
    country: "Senegal",
    city: "Saly",
    zone,

    module: "DRIVER",
    role: "driver",
    status: "pending",

    vehicle: {
      type: vehicleType || "Berline",
      brand: vehicleBrand || "",
      model: vehicleModel || "",
      color: vehicleColor || "",
      plateNumber: vehiclePlate || "",
      seats: vehicleSeats || 4
    },

    pricing: {
      currency: "XOF",
      baseFare: baseFare || 0,
      perKm: perKm || 0,
      airportFlat: airportFlat || 0
    },

    documents: {
      idCardNumber: "",
      idCardUrl: "",
      licenseNumber: "",
      licenseUrl: "",
      insuranceCompany: "",
      insuranceValidUntil: "",
      insuranceUrl: ""
    },

    subscription: {
      plan: "DRIVER_START",
      pricePerMonth: 9900,
      currency: "XOF",
      billingMode: "monthly",
      startDate: now,
      endDate: 0,
      status: "trial"
    },

    stats: {
      ridesCount: 0,
      cancelledCount: 0,
      ratingAverage: 0,
      ratingCount: 0,
      revenueTotal: 0
    },

    createdAt: now,
    updatedAt: now,
    createdBy: "digiy_hub"
  };

  try {
    // 1) On écrit la fiche chauffeur
    const driverRef = ref(db, `drivers/${currentDriverUid}`);
    await set(driverRef, driverData);

    // 2) On initialise le statut online (sans GPS pour l’instant)
    const onlineRef = ref(db, `drivers_online/${currentDriverUid}`);
    await set(onlineRef, {
      driverId: currentDriverUid,
      fullName,
      status: "offline",
      lat: null,
      lng: null,
      updatedAt: now
    });

    alert("✅ Fiche chauffeur DIGIY enregistrée. Tu es en attente de validation.");
    console.log("Chauffeur enregistré:", driverData);

    // Option : reset du formulaire
    event.target.reset();
  } catch (err) {
    console.error("Erreur enregistrement chauffeur:", err);
    alert("❌ Impossible d'enregistrer ta fiche pour le moment. Réessaie plus tard.");
  }
}

// 3) Attache le listener sur le formulaire
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("driverForm");
  if (form) {
    form.addEventListener("submit", submitDriverForm);
  } else {
    console.warn("Formulaire chauffeur (#driverForm) introuvable dans la page.");
  }
});
