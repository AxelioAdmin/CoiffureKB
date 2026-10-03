/* ==========================================================================
   COIFFURE KB UNISEXE — Coordonnées et horaires
   --------------------------------------------------------------------------
   Modifiez ce fichier pour mettre à jour les informations PARTOUT sur le site
   (en-tête, pied de page, section contact, carte, formulaire d'emploi…).
   ========================================================================== */

window.KB_CONFIG = {
  nom: "Coiffure KB Unisexe",

  // ⚠️ Valeurs d'exemple — à remplacer par les vraies coordonnées du salon.
  telephone: "(514) 555-0123",
  courriel: "salon@example.com", // reçoit aussi les demandes de rendez-vous de l'accueil
  courrielEmplois: "emplois@example.com", // reçoit les candidatures du formulaire

  adresse: {
    rue: "123, rue Principale",
    ville: "Ville",
    province: "QC",
    codePostal: "A1A 1A1",
  },

  // Recherche utilisée pour la carte Google Maps et le bouton « Itinéraire ».
  // Le nom du salon fonctionne s'il possède une fiche Google ; sinon, mettez l'adresse complète.
  carte: "Coiffure KB Unisexe",

  // Lien de réservation en ligne (facultatif). Laisser vide pour que les
  // boutons « Rendez-vous » mènent au formulaire de demande de l'accueil.
  reservation: "",

  // Réseaux sociaux (laisser vide pour masquer l'icône).
  reseaux: {
    facebook: "https://www.facebook.com/",
    instagram: "https://www.instagram.com/",
  },

  // Heures d'ouverture, format 24 h. null = fermé.
  // Index : 0 = dimanche, 1 = lundi, … 6 = samedi.
  horaires: [
    null,               // Dimanche
    null,               // Lundi
    ["09:00", "17:00"], // Mardi
    ["09:00", "17:00"], // Mercredi
    ["09:00", "20:00"], // Jeudi
    ["09:00", "20:00"], // Vendredi
    ["08:00", "16:00"], // Samedi
  ],
};
