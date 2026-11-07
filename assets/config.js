// Global Service Groupe — réglages publics du site (aucun secret ici).
//
// La vérification des documents et des certificats interroge directement la
// base EcoShop avec la clé PUBLIQUE (« publishable ») du projet Supabase : elle
// ne donne accès qu'aux deux fonctions ouvertes au public, verifier_document
// et verifier_certificat, qui ne renvoient que ce qui est imprimé sur le
// document. Au passage en production, remplacer ces deux valeurs par celles
// du projet de production (Supabase › Project Settings › API Keys).
window.GSG_CONFIG = {
  ecoshop: {
    supabaseUrl: "https://nlydvaszgdtjohneggqt.supabase.co",
    clePublique: "sb_publishable_1K7s4ewnoUW6I7axDu1t_A_BE18Mkwl",
  },
};
