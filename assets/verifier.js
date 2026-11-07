// Global Service Groupe — vérification publique d'un document ou d'un
// certificat EcoShop. Lit ?code=… (QR code imprimé), interroge la fonction
// publique de la base et affiche le résultat. Tout texte reçu est inséré avec
// textContent : jamais interprété comme du HTML.
(function () {
  "use strict";
  var racine = document.getElementById("verification");
  if (!racine) return;
  var genre = racine.getAttribute("data-genre"); // "document" | "certificat"
  var config = (window.GSG_CONFIG || {}).ecoshop || {};
  var formulaire = document.getElementById("formulaire");
  var champ = document.getElementById("code");
  var sortie = document.getElementById("resultat");

  var MOTIF = genre === "document"
    ? /^DOC-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/
    : /^GSG-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/;
  var TYPES = {
    carte_scolaire: "Carte scolaire",
    certificat_scolarite: "Certificat de scolarité",
    attestation_niveau: "Attestation de niveau",
    fiche_renseignements: "Fiche de renseignements",
    certificat_radiation: "Certificat de radiation (exeat)",
    carte_professionnelle: "Carte professionnelle",
    attestation_travail: "Attestation de travail",
    certificat_travail: "Certificat de travail",
    quitus: "Quitus de paiement",
    attestation_paiement: "Attestation de paiement",
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
    var classe = r.classe ? r.classe + (r.annee ? " (" + r.annee + ")" : "") : "";
    var lignes = [
      ["Document", TYPES[r.type] || r.type],
      ["Titulaire", r.titulaire],
      ["Classe", classe],
      ["Établissement", (r.etablissement || "") + (r.ville ? ", " + r.ville : "")],
      ["Délivré le", date(r.delivre_le)],
      ["Numéro", r.numero],
    ];
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

  function verifier(code) {
    code = (code || "").trim().toUpperCase();
    champ.value = code;
    if (!MOTIF.test(code)) return afficher("Code invalide", "ko", "Ce code n'a pas le bon format. Recopiez-le tel qu'il est imprimé.");
    if (!config.supabaseUrl || config.supabaseUrl.indexOf("⟦") >= 0) {
      return afficher("Service indisponible", "ko", "La vérification n'est pas encore ouverte. Réessayez plus tard.");
    }
    afficher("Vérification…", "attente", "Un instant.");
    var fonction = genre === "document" ? "verifier_document" : "verifier_certificat";
    fetch(config.supabaseUrl.replace(/\/+$/, "") + "/rest/v1/rpc/" + fonction, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: config.clePublique },
      body: JSON.stringify({ p_code: code }),
      cache: "no-store",
      referrerPolicy: "no-referrer",
    })
      .then(function (rep) { if (!rep.ok) throw new Error("HTTP " + rep.status); return rep.json(); })
      .then(function (r) { (genre === "document" ? rendreDocument : rendreCertificat)(r || { inconnu: true }); })
      .catch(function () {
        afficher("Service indisponible", "ko", "La vérification n'a pas pu se faire. Vérifiez votre connexion et réessayez dans un instant.");
      });
  }

  formulaire.addEventListener("submit", function (e) {
    e.preventDefault();
    var code = champ.value.trim().toUpperCase();
    history.replaceState(null, "", "?code=" + encodeURIComponent(code));
    verifier(code);
  });

  var depart = new URLSearchParams(location.search).get("code");
  if (depart) verifier(depart);
})();
