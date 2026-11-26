// Global Service Groupe — réglages publics du site (aucun secret ici).
//
// Les documents et les certificats sont vérifiés par les fonctions Edge
// verifier_document et verifier_certificat du projet (aucune clé envoyée,
// EcoShop REG-216 et REG-220). Au passage en production, remplacer l'adresse
// par celle du projet de production (Supabase › Project Settings › API).
window.GSG_CONFIG = {
  ecoshop: {
    supabaseUrl: "https://nlydvaszgdtjohneggqt.supabase.co",
  },
};
