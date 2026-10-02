/* ==========================================================================
   COIFFURE KB UNISEXE — Services, tarifs et offres d'emploi
   --------------------------------------------------------------------------
   Les pages se construisent automatiquement à partir de ces listes :
   ajoutez, retirez ou modifiez une entrée et le site se met à jour.

   Prix : un nombre (ex. 55) s'affiche « 55 $ ».
          Ajoutez des: true pour afficher « dès 55 $ ».
          Un texte (ex. "Sur consultation") s'affiche tel quel.
   prixDepart (facultatif, par catégorie) : prix « dès … » affiché sur
          l'accueil. Sans lui, le prix le plus bas de la catégorie est utilisé.
   ⚠️ Les prix ci-dessous sont des exemples — à ajuster avec le salon.
   ========================================================================== */

window.KB_SERVICES = [
  {
    id: "femmes",
    titre: "Femmes",
    image: "img/brushing.jpg",
    prixDepart: 35, // la retouche de frange (12 $) n'est pas un prix d'appel
    description:
      "Des coupes sur mesure, pensées selon la forme de votre visage, la nature de vos cheveux et votre quotidien.",
    prestations: [
      { nom: "Coupe & mise en plis", detail: "Consultation, shampoing, coupe et coiffage", duree: "60 min", prix: 55, des: true },
      { nom: "Coupe seulement", detail: "Shampoing et coupe, sans coiffage", duree: "40 min", prix: 42, des: true },
      { nom: "Brushing", detail: "Shampoing et coiffage lisse ou volume", duree: "40 min", prix: 35, des: true },
      { nom: "Retouche de frange", detail: "Entre deux coupes", duree: "10 min", prix: 12 },
    ],
  },
  {
    id: "hommes",
    titre: "Hommes",
    image: "img/coupe-homme.jpg",
    description:
      "Du classique au dégradé le plus net : des coupes précises, aux ciseaux comme à la tondeuse.",
    prestations: [
      { nom: "Coupe homme", detail: "Shampoing, coupe ciseaux et/ou tondeuse, coiffage", duree: "30 min", prix: 30, des: true },
      { nom: "Dégradé (fade)", detail: "Low, mid ou high fade, finition au rasoir", duree: "45 min", prix: 35, des: true },
      { nom: "Coupe à la tondeuse", detail: "Un seul sabot, rapide et net", duree: "20 min", prix: 22 },
      { nom: "Coupe + barbe", detail: "Le forfait complet", duree: "50 min", prix: 45, des: true },
    ],
  },
  {
    id: "barbe",
    titre: "Barbe",
    image: "img/barbe.jpg",
    description:
      "Taille, contours et rasage traditionnel à la serviette chaude pour une barbe impeccable.",
    prestations: [
      { nom: "Taille de barbe", detail: "Mise en forme et contours", duree: "20 min", prix: 18, des: true },
      { nom: "Rasage traditionnel", detail: "Serviette chaude, rasoir et soin après-rasage", duree: "30 min", prix: 30 },
      { nom: "Contours seulement", detail: "Nuque, joues et ligne de barbe", duree: "10 min", prix: 10 },
    ],
  },
  {
    id: "coloration",
    titre: "Coloration",
    image: "img/balayage.jpg",
    description:
      "Couleur, mèches et balayages réalisés avec des produits professionnels, incluant la coloration sans ammoniaque.",
    prestations: [
      { nom: "Coloration racines", detail: "Retouche des repousses", duree: "75 min", prix: 65, des: true },
      { nom: "Coloration complète", detail: "Racines et longueurs", duree: "90 min", prix: 85, des: true },
      { nom: "Balayage", detail: "Effet soleil naturel, peint à la main", duree: "2 h 30", prix: 140, des: true },
      { nom: "Mèches", detail: "Partielles ou complètes", duree: "2 h", prix: 110, des: true },
      { nom: "Gloss / tonalisation", detail: "Neutralise les reflets et ravive la brillance", duree: "30 min", prix: 35, des: true },
      { nom: "Camouflage des cheveux blancs", detail: "Pour hommes — résultat naturel", duree: "20 min", prix: 30, des: true },
    ],
  },
  {
    id: "soins-coiffage",
    titre: "Soins & coiffage",
    image: "img/shampoing.jpg",
    description:
      "Soins profonds, lissages et coiffures d'événement : pour des cheveux en santé et des moments marquants.",
    prestations: [
      { nom: "Soin profond", detail: "Masque nourrissant et massage du cuir chevelu", duree: "15 min", prix: 15, des: true },
      { nom: "Lissage à la kératine", detail: "Cheveux lisses et disciplinés pendant des semaines", duree: "2 h 30", prix: 200, des: true },
      { nom: "Permanente", detail: "Boucles ou ondulations durables", duree: "2 h", prix: 90, des: true },
      { nom: "Boucles au fer", detail: "Ondulations souples ou boucles définies", duree: "45 min", prix: 45, des: true },
      { nom: "Chignon & coiffure d'événement", detail: "Bal, mariage, soirée", duree: "60 min", prix: 65, des: true },
      { nom: "Forfait mariée", detail: "Essai et coiffure le jour J", duree: "Sur rendez-vous", prix: "Sur consultation" },
    ],
  },
  {
    id: "enfants",
    titre: "Enfants",
    image: "img/enfants.jpg",
    description:
      "Des coupes pour les tout-petits comme pour les ados, dans une ambiance détendue et rassurante.",
    prestations: [
      { nom: "Coupe enfant", detail: "12 ans et moins", duree: "20 min", prix: 20, des: true },
      { nom: "Coupe ado", detail: "13 à 17 ans", duree: "30 min", prix: 25, des: true },
      { nom: "Première coupe", detail: "Un moment tout en douceur pour les tout-petits", duree: "20 min", prix: 18 },
    ],
  },
];

/* --------------------------------------------------------------------------
   Offres d'emploi
   Mettez actif: false pour masquer un poste comblé sans le supprimer.
   ⚠️ Contenu d'exemple — à valider avec le salon.
   -------------------------------------------------------------------------- */
window.KB_EMPLOIS = [
  {
    id: "coiffeur-unisexe",
    actif: true,
    titre: "Coiffeur(euse) unisexe",
    type: "Temps plein",
    horaire: "4 à 5 jours / semaine",
    experience: "DEP en coiffure",
    remuneration: "Selon l'expérience + pourboires",
    resume:
      "Coupes hommes, femmes et enfants, colorations et coiffage pour une clientèle fidèle et variée.",
    description:
      "Nous cherchons un(e) coiffeur(euse) polyvalent(e), aussi à l'aise avec les coupes masculines que féminines, pour compléter notre équipe dans un salon moderne et achalandé.",
    responsabilites: [
      "Réaliser coupes, colorations, brushings et mises en plis",
      "Conseiller la clientèle sur le style et l'entretien",
      "Recommander les produits adaptés à chaque type de cheveux",
      "Garder son poste de travail propre et organisé",
    ],
    exigences: [
      "DEP en coiffure ou expérience équivalente",
      "Aisance avec les coupes hommes et femmes",
      "Sens du service et bonne écoute",
      "Ponctualité et esprit d'équipe",
    ],
    avantages: [
      "Clientèle établie dès le premier jour",
      "Horaire stable et conciliation travail-vie personnelle",
      "Formation continue",
      "Rabais sur les produits professionnels",
    ],
  },
  {
    id: "barbier",
    actif: true,
    titre: "Barbier(ère)",
    type: "Temps plein ou partiel",
    horaire: "Jour, soir et samedi",
    experience: "2 ans et plus",
    remuneration: "Selon l'expérience + pourboires",
    resume:
      "Dégradés précis, tailles de barbe et rasages traditionnels pour notre clientèle masculine.",
    description:
      "Vous maîtrisez les dégradés et le rasoir ? Venez apporter votre savoir-faire à une équipe qui accorde autant d'importance au détail qu'à l'expérience client.",
    responsabilites: [
      "Réaliser dégradés, coupes classiques et coupes à la tondeuse",
      "Tailler et entretenir les barbes, contours au rasoir",
      "Offrir le rasage traditionnel à la serviette chaude",
      "Fidéliser la clientèle par un service soigné",
    ],
    exigences: [
      "Minimum 2 ans d'expérience en barberie",
      "Maîtrise des fades et des finitions au rasoir",
      "Portfolio ou photos de réalisations (un atout)",
      "Attitude professionnelle et souriante",
    ],
    avantages: [
      "Achalandage régulier",
      "Horaire flexible, temps plein ou partiel",
      "Matériel professionnel sur place",
      "Ambiance d'équipe conviviale",
    ],
  },
  {
    id: "coloriste",
    actif: true,
    titre: "Coloriste",
    type: "Temps partiel",
    horaire: "2 à 3 jours / semaine",
    experience: "Spécialisation en coloration",
    remuneration: "Selon l'expérience",
    resume:
      "Balayages, mèches et corrections de couleur avec des produits professionnels de qualité.",
    description:
      "Passionné(e) de couleur ? Nous recherchons un(e) coloriste créatif(ve) et rigoureux(se) pour prendre en charge nos services de balayage, de mèches et de coloration.",
    responsabilites: [
      "Analyser les cheveux et proposer la couleur idéale",
      "Réaliser balayages, mèches, colorations et tonalisations",
      "Effectuer des corrections de couleur",
      "Conseiller sur l'entretien de la couleur à la maison",
    ],
    exigences: [
      "DEP en coiffure",
      "Expérience solide en balayage et en mèches",
      "Connaissance des colorations professionnelles",
      "Souci du détail et créativité",
    ],
    avantages: [
      "Horaire à temps partiel adaptable",
      "Produits de coloration professionnels",
      "Formations sur les nouvelles techniques",
      "Clientèle à la recherche d'expertise",
    ],
  },
  {
    id: "apprenti",
    actif: true,
    titre: "Apprenti(e) coiffeur(euse)",
    type: "Temps partiel",
    horaire: "Soirs et fins de semaine",
    experience: "Étudiant(e) ou finissant(e)",
    remuneration: "Taux horaire",
    resume:
      "Shampoings, accueil et assistance à l'équipe : l'endroit idéal pour apprendre le métier.",
    description:
      "Vous étudiez en coiffure ou venez de terminer votre DEP ? Rejoignez-nous pour apprendre aux côtés de professionnels et développer votre clientèle à votre rythme.",
    responsabilites: [
      "Accueillir la clientèle et gérer les rendez-vous",
      "Effectuer shampoings et soins",
      "Assister les coiffeurs et coiffeuses au quotidien",
      "Participer à l'entretien du salon",
    ],
    exigences: [
      "Inscription ou diplôme récent en coiffure",
      "Envie d'apprendre et de progresser",
      "Disponible les soirs et fins de semaine",
      "Entregent et sens de l'organisation",
    ],
    avantages: [
      "Encadrement par des professionnels",
      "Possibilité d'évoluer vers un poste de coiffeur(euse)",
      "Horaire compatible avec les études",
      "Ambiance jeune et dynamique",
    ],
  },
];
