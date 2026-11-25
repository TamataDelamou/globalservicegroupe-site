// Global Service Groupe — vérification publique d'un document ou d'un
// certificat EcoShop. Lit ?code=… (QR code imprimé) et, pour les documents
// signés, ?jeton=…, puis affiche le résultat. Tout texte reçu est inséré avec
// textContent : jamais interprété comme du HTML.
//
// Documents (EcoShop REG-216) : la page interroge la fonction Edge
// verifier_document (?format=json), qui limite le nombre d'essais par adresse
// et répond de la même façon à un code inconnu et à un code mal formé. Simple
// requête GET, sans en-tête ajouté : aucun échange CORS préalable.
// Certificats : fonction de base publique verifier_certificat, comme avant.
(function () {
  "use strict";
  var racine = document.getElementById("verification");
  if (!racine) return;
  var genre = racine.getAttribute("data-genre"); // "document" | "certificat"
  var config = (window.GSG_CONFIG || {}).ecoshop || {};
  var formulaire = document.getElementById("formulaire");
  var champ = document.getElementById("code");
  var sortie = document.getElementById("resultat");

  // Documents : 12 caractères (anciens codes) ou 16 (documents signés, REG-216).
  var MOTIF = genre === "document"
    ? /^DOC-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}(-[2-9A-HJ-NP-Z]{4})?$/
    : /^GSG-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/;
  // Même liste que le catalogue des documents d'EcoShop (types_documents).
  var TYPES = {
    fiche_scolarite: "Fiche de scolarité",
    certificat_scolarite: "Certificat de scolarité",
    attestation_inscription: "Attestation d'inscription",
    certificat_assiduite: "Certificat d'assiduité",
    carte_scolaire: "Carte scolaire",
    fiche_renseignements: "Fiche de renseignements",
    bulletin: "Bulletin de notes",
    releve_notes: "Relevé de notes",
    attestation_niveau: "Attestation de niveau",
    attestation_passage: "Attestation de passage ou de réussite",
    tableau_honneur: "Tableau d'honneur",
    certificat_radiation: "Certificat de radiation (exeat)",
    attestation_parcours: "Attestation de parcours scolaire",
    recu: "Reçu",
    releve_compte: "Relevé de compte",
    attestation_paiement: "Attestation de paiement des frais",
    quitus: "Quitus de paiement",
    attestation_bourse: "Attestation de bourse",
    carte_professionnelle: "Carte professionnelle",
    attestation_travail: "Attestation de travail",
    certificat_travail: "Certificat de travail",
    attestation_salaire: "Attestation de salaire",
  };

  function date(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    return isNaN(d) ? "" : d.toLocaleDateString("fr-FR", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" });
  }

  function el(balise, texte, classe) {
    var e = document.createElement(balise);
    if (texte !== undefined && texte !== null) e.textContent = String(texte);
    if (classe) e.className = classe;
    return e;
  }

  function afficher(titre, etat, message, lignes) {
    sortie.textContent = "";
    var carte = el("section", null, "carte resultat " + etat);
    carte.setAttribute("aria-live", "polite");
    carte.appendChild(el("h2", titre));
    if (message) carte.appendChild(el("p", message));
    if (lignes && lignes.length) {
      var dl = el("dl");
      lignes.forEach(function (l) {
        if (l[1] === undefined || l[1] === null || l[1] === "") return;
        dl.appendChild(el("dt", l[0]));
        dl.appendChild(el("dd", l[1]));
      });
      carte.appendChild(dl);
    }
    sortie.appendChild(carte);
    carte.focus && carte.setAttribute("tabindex", "-1");
  }

  function rendreDocument(r) {
    if (r.inconnu) return afficher("Document introuvable", "ko", "Aucun document ne porte ce code. Vérifiez chaque caractère, ou contactez l'établissement.");
    // Délivrance commencée mais pas terminée (REG-216) : jamais « authentique ».
    if (r.en_attente) return afficher("Document en cours de délivrance", "ko", "L'établissement n'a pas fini de délivrer ce document. Réessayez plus tard, ou contactez l'établissement.");
    var classe = r.classe ? r.classe + (r.annee ? " (" + r.annee + ")" : "") : "";
    var lignes = [
      ["Document", TYPES[r.type] || r.type],
      ["Titulaire", r.titulaire],
      ["Classe", classe],
      ["Établissement", (r.etablissement || "") + (r.ville ? ", " + r.ville : "")],
      ["Délivré le", date(r.delivre_le)],
      ["Numéro", r.numero],
    ];
    // EcoShop REG-143 : document remplacé après une correction de l'identité ;
    // la version en vigueur est indiquée (testé avant « annulé », que la base
    // garde aussi pour les anciennes pages).
    if (r.remplace) {
      var n = r.en_vigueur;
      var suite = n ? " La version en vigueur est le document n° " + (n.numero || "") + ", délivré le " + date(n.delivre_le) + " à " + (n.titulaire || "") + "." : "";
      return afficher("Document remplacé", "ko", "Ce document a été remplacé par l'établissement le " + date(r.remplace_le) + "." + suite, lignes);
    }
    if (r.annule) return afficher("Document annulé", "ko", "Ce document a été annulé par l'établissement le " + date(r.annule_le) + ".", lignes);
    afficher("Document authentique", "ok", "L'établissement a bien enregistré ce document.", lignes);
  }

  function rendreCertificat(r) {
    if (r.inconnu) return afficher("Certificat introuvable", "ko", "Aucun certificat ne porte ce code. Vérifiez chaque caractère.");
    var lignes = [
      ["Certificat", r.titre],
      ["Titulaire", r.titulaire],
      ["Mention", r.mention],
      ["Réussite", typeof r.reussite === "number" ? r.reussite + " %" : ""],
      ["Rang", r.rang ? r.rang + (r.participants ? " sur " + r.participants : "") : ""],
      ["Délivré par", r.delivre_par],
      ["Délivré le", date(r.delivre_le)],
      ["Code", r.code],
    ];
    if (r.revoque) return afficher("Certificat révoqué", "ko", "Ce certificat a été révoqué.", lignes);
    afficher("Certificat authentique", "ok", null, lignes);
  }

  function requete(code, jeton) {
    var base = config.supabaseUrl.replace(/\/+$/, "");
    if (genre === "document") {
      var params = new URLSearchParams({ format: "json" });
      if (jeton) params.set("jeton", jeton); else params.set("code", code);
      return fetch(base + "/functions/v1/verifier_document?" + params.toString(), {
        method: "GET",
        cache: "no-store",
        referrerPolicy: "no-referrer",
      });
    }
    return fetch(base + "/rest/v1/rpc/verifier_certificat", {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: config.clePublique },
      body: JSON.stringify({ p_code: code }),
      cache: "no-store",
      referrerPolicy: "no-referrer",
    });
  }

  function verifier(code, jeton) {
    code = (code || "").trim().toUpperCase();
    champ.value = code;
    if (!jeton && !MOTIF.test(code)) return afficher("Code invalide", "ko", "Ce code n'a pas le bon format. Recopiez-le tel qu'il est imprimé.");
    if (!config.supabaseUrl || config.supabaseUrl.indexOf("⟦") >= 0) {
      return afficher("Service indisponible", "ko", "La vérification n'est pas encore ouverte. Réessayez plus tard.");
    }
    afficher("Vérification…", "attente", "Un instant.");
    requete(code, jeton)
      .then(function (rep) {
        if (rep.status === 429) throw new Error("TROP_D_ESSAIS");
        if (!rep.ok) throw new Error("HTTP " + rep.status);
        return rep.json();
      })
      .then(function (r) { (genre === "document" ? rendreDocument : rendreCertificat)(r || { inconnu: true }); })
      .catch(function (e) {
        if (e && e.message === "TROP_D_ESSAIS") return afficher("Trop d'essais", "ko", "Trop de vérifications depuis cette connexion. Réessayez dans une minute.");
        afficher("Service indisponible", "ko", "La vérification n'a pas pu se faire. Vérifiez votre connexion et réessayez dans un instant.");
      });
  }

  formulaire.addEventListener("submit", function (e) {
    e.preventDefault();
    var code = champ.value.trim().toUpperCase();
    history.replaceState(null, "", "?code=" + encodeURIComponent(code));
    verifier(code);
  });

  var adresse = new URLSearchParams(location.search);
  var depart = adresse.get("code");
  var jetonDepart = genre === "document" ? adresse.get("jeton") : null;
  if (depart || jetonDepart) verifier(depart, jetonDepart);
})();
