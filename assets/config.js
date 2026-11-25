// Global Service Groupe — réglages publics du site (aucun secret ici).
//
// Les documents sont vérifiés par la fonction Edge verifier_document du projet
// (aucune clé envoyée) ; les certificats, par la fonction de base publique
// verifier_certificat, avec la clé PUBLIQUE (« publishable ») du projet
// Supabase. Au passage en production, remplacer ces deux valeurs par celles
// du projet de production (Supabase › Project Settings › API Keys).
window.GSG_CONFIG = {
  ecoshop: {
    supabaseUrl: "https://nlydvaszgdtjohneggqt.supabase.co",
    clePublique: "sb_publishable_1K7s4ewnoUW6I7axDu1t_A_BE18Mkwl",
  },
};
