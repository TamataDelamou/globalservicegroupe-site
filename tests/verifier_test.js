// Test de la page de vérification (assets/verifier.js), sans navigateur :
// un faux DOM minimal et un faux fetch. Lancer : deno test tests/
// Vérifie l'adresse appelée (fonction Edge pour les documents, base pour les
// certificats) et le texte affiché pour chaque réponse.
import { strictEqual as egal, ok } from "node:assert/strict";

const SOURCE = await Deno.readTextFile(new URL("../assets/verifier.js", import.meta.url));

function element() {
  return {
    textContent: "", className: "", value: "", enfants: [], attributs: {},
    appendChild(e) { this.enfants.push(e); return e; },
    setAttribute(k, v) { this.attributs[k] = v; },
    getAttribute(k) { return this.attributs[k]; },
    addEventListener() {},
    focus() {},
  };
}

function texte(e) {
  return [e.textContent, ...e.enfants.map(texte)].join(" ");
}

async function charger({ genre = "document", recherche, reponse }) {
  const racine = element();
  racine.attributs["data-genre"] = genre;
  const ids = { verification: racine, formulaire: element(), code: element(), resultat: element() };
  const appels = [];
  const contexte = {
    document: { getElementById: (id) => ids[id] ?? null, createElement: () => element() },
    window: { GSG_CONFIG: { ecoshop: { supabaseUrl: "https://projet.supabase.co/" } } },
    location: { search: recherche },
    history: { replaceState() {} },
    URLSearchParams,
    fetch: (url, options) => {
      appels.push({ url, options });
      return Promise.resolve({ status: reponse.status, ok: reponse.status < 300, json: () => Promise.resolve(reponse.corps) });
    },
  };
  new Function(...Object.keys(contexte), SOURCE)(...Object.values(contexte));
  await new Promise((fin) => setTimeout(fin, 0));
  await new Promise((fin) => setTimeout(fin, 0));
  return { appels, affiche: texte(ids.resultat) };
}

Deno.test("document : fonction Edge en GET, sans en-tête (aucun échange CORS préalable)", async () => {
  const { appels, affiche } = await charger({
    recherche: "?code=DOC-2345-6789-ABCD-EFGH",
    reponse: { status: 200, corps: { valide: true, type: "fiche_scolarite", etablissement: "ÉCOLE A", delivre_le: "2026-11-25T10:00:00Z" } },
  });
  egal(appels.length, 1);
  egal(appels[0].url, "https://projet.supabase.co/functions/v1/verifier_document?format=json&code=DOC-2345-6789-ABCD-EFGH");
  egal(appels[0].options.method, "GET");
  egal(appels[0].options.headers, undefined);
  ok(affiche.includes("Document authentique"));
  ok(affiche.includes("Fiche de scolarité"));
  ok(affiche.includes("ÉCOLE A"));
});

Deno.test("document ancien (12 caractères) : titulaire et numéro affichés comme avant", async () => {
  const { appels, affiche } = await charger({
    recherche: "?code=doc-2345-6789-abcd",
    reponse: { status: 200, corps: { valide: true, type: "certificat_scolarite", titulaire: "AWA D.", numero: "CS-12", etablissement: "ÉCOLE A" } },
  });
  ok(appels[0].url.endsWith("&code=DOC-2345-6789-ABCD"));
  ok(affiche.includes("AWA D.") && affiche.includes("CS-12"));
});

Deno.test("jeton signé : envoyé à la fonction Edge à la place du code", async () => {
  const { appels } = await charger({ recherche: "?jeton=abc.def", reponse: { status: 200, corps: { valide: false, inconnu: true } } });
  egal(appels[0].url, "https://projet.supabase.co/functions/v1/verifier_document?format=json&jeton=abc.def");
});

Deno.test("inconnu, en cours de délivrance, trop d'essais, code mal formé", async () => {
  ok((await charger({ recherche: "?code=DOC-2345-6789-ABCD", reponse: { status: 200, corps: { valide: false, inconnu: true } } })).affiche.includes("Document introuvable"));
  ok((await charger({ recherche: "?code=DOC-2345-6789-ABCD", reponse: { status: 200, corps: { valide: false, en_attente: true } } })).affiche.includes("en cours de délivrance"));
  ok((await charger({ recherche: "?code=DOC-2345-6789-ABCD", reponse: { status: 429, corps: {} } })).affiche.includes("Trop d'essais"));
  const malForme = await charger({ recherche: "?code=DOC-1111", reponse: { status: 200, corps: {} } });
  egal(malForme.appels.length, 0);
  ok(malForme.affiche.includes("Code invalide"));
});

Deno.test("certificat (REG-220) : fonction Edge verifier_certificat en JSON, sans clé ; 429 et inconnu affichés", async () => {
  const { appels, affiche } = await charger({ genre: "certificat", recherche: "?code=GSG-2345-6789-ABCD", reponse: { status: 200, corps: { valide: false, inconnu: true } } });
  egal(appels.length, 1);
  egal(appels[0].url, "https://projet.supabase.co/functions/v1/verifier_certificat?format=json&code=GSG-2345-6789-ABCD");
  egal(appels[0].options.method, "GET");
  egal(appels[0].options.headers, undefined);
  ok(affiche.includes("Certificat introuvable"));
  ok((await charger({ genre: "certificat", recherche: "?code=GSG-2345-6789-ABCD", reponse: { status: 429, corps: {} } })).affiche.includes("Trop d'essais"));
});
