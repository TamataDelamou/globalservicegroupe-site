# Site de Global Service Groupe — globalservicegroupe.com

Site vitrine de GSG : une page par application, avec ses pages légales.
Dépôt `globalservicegroupe-site`, publié par Cloudflare Pages à chaque
envoi sur `main`. HTML et CSS, un seul petit script pour la
vérification des documents ; aucune police à télécharger, aucun traceur.

| Adresse | Rôle |
|---|---|
| `/` | Accueil GSG : présentation et liste des applications |
| `/ecoshop/` | Présentation d'EcoShop |
| `/ecoshop/confidentialite/` | Politique de confidentialité d'EcoShop (v1.1) |
| `/ecoshop/conditions/` | Conditions d'utilisation d'EcoShop (v1.1) |
| `/ecoshop/suppression-compte/` | Suppression de compte (exigée par le Play Store) |
| `/ecoshop/document/` | Vérifier un document scolaire (QR code imprimé) |
| `/ecoshop/certificat/` | Vérifier un certificat de révision, concours, olympiade |

**Anciennes adresses** (`_redirects`) : `/confidentialite`, `/conditions`,
`/suppression-compte`, `/document`, `/certificat` renvoient vers `/ecoshop/…`.
Elles sont déclarées chez Google ou imprimées : ne jamais les retirer.

**Nouvelle application** : créer `/<application>/` sur le modèle d'`ecoshop/`
(présentation, confidentialité, conditions, suppression), puis l'ajouter à
l'accueil.

## Vérification des documents

Supabase ne sert pas de page HTML depuis une fonction (il la transforme en
texte brut). Le QR code ouvre donc `/ecoshop/document/?code=…` (et, pour
un document signé, `&jeton=…`) ; les anciennes adresses des fonctions
renvoient ici.

- **Documents** : la page appelle la fonction Edge
  `/functions/v1/verifier_document?format=json&code=…` (EcoShop REG-216).
  Elle limite le nombre d'essais par adresse et par minute (réponse 429),
  et répond de la même façon à un code inconnu et à un code mal formé. La
  fonction de base `verifier_document` n'est plus ouverte au public.
- **Certificats** : de même par la fonction Edge
  `/functions/v1/verifier_certificat?format=json&code=…` (EcoShop REG-220),
  avec la même limite d'essais. Aucune clé n'est envoyée.

L'adresse du projet est réglée dans `assets/config.js`.

**Au passage en production** : remplacer l'adresse du projet dans
`assets/config.js`.

## Avant de publier

1. Compléter les champs entre ⟦ ⟧ (adresse du siège, numéro RCCM) :
   `index.html`, `ecoshop/confidentialite/`, `ecoshop/conditions/`.
2. Faire relire par l'avocat : responsable / sous-traitant (école ↔ GSG),
   transferts hors de Guinée (loi L/2016/037/AN), déclaration des
   traitements, données des mineurs, responsabilité, juridiction.
3. Engager les démarches auprès de l'autorité guinéenne annoncées par la
   politique (déclaration, autorisation de transfert).

## Mettre en ligne (Cloudflare Pages)

Le domaine est déjà chez Cloudflare (DNS et e-mails).

1. Cloudflare › **Workers & Pages** › **Créer** › **Pages** ›
   **Se connecter à Git** › choisir le dépôt `globalservicegroupe-site`.
2. Réglages de build : *Framework* « Aucun », *commande de build* vide,
   *répertoire de sortie* `/` (racine du dépôt). Déployer.
3. **Domaines personnalisés** › ajouter `globalservicegroupe.com` et
   `www.globalservicegroupe.com`. Les e-mails ne sont pas touchés.
4. Vérifier : `/confidentialite` redirige vers `/ecoshop/confidentialite/`,
   et `/ecoshop/document/?code=DOC-…` affiche un résultat.

Chaque envoi sur GitHub met ensuite le site à jour tout seul.

## Ensuite, côté Google

- **Play Console** › Règles de confidentialité :
  `https://globalservicegroupe.com/ecoshop/confidentialite/`.
- **Play Console** › Sécurité des données › suppression :
  `https://globalservicegroupe.com/ecoshop/suppression-compte/`.
- **Écran de consentement OAuth** : les adresses déjà déclarées redirigent ;
  on peut les remplacer par les nouvelles.
