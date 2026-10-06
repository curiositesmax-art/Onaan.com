
// --- 1. VARIABLES GLOBALES ET INITIALISATION ---
let produitActuel = {
  nom: "",
  prixBase: 0
};

let panier = [];

// Initialisation d'EmailJS (à remplacer par vos clés réelles)
(function() {
  if (typeof emailjs !== 'undefined') {
    emailjs.init("VOTRE_PUBLIC_KEY");
  }
})();


// --- 2. GESTION DE LA MODALE ---

/**
 * Ouvre la modale et initialise les valeurs du produit sélectionné
 */
function ouvrirModale(nom, prixBase, img, desc) {
  let prixNum = parseFloat(prixBase);
  if (isNaN(prixNum)) prixNum = 0;

  produitActuel = {
    nom: nom,
    prixBase: prixNum
  };

  // Remplissage des informations produit dans la modale
  const titreEl = document.getElementById('modal-titre');
  const descEl = document.getElementById('modal-desc');
  const imgEl = document.getElementById('modal-img');

  if (titreEl) titreEl.innerText = nom;
  if (descEl) descEl.innerText = desc || '';
  if (imgEl) imgEl.src = img || '';

  // Réinitialisation des boutons radio par défaut
  const painDefault = document.querySelector('input[name="pain"][value="Naan"]');
  if (painDefault) painDefault.checked = true;

  const menuDefault = document.querySelector('input[name="menu_opt"][value="Seul"]');
  if (menuDefault) menuDefault.checked = true;

  // Calcul initial du total
  calculerPrixModale();

  // Affichage de la modale
  const modal = document.getElementById('modal-produit');
  if (modal) modal.style.display = 'block';
}

/**
 * Ferme la modale produit
 */
function fermerModale() {
  const modal = document.getElementById('modal-produit');
  if (modal) modal.style.display = 'none';
}

/**
 * Calcule dynamiquement le prix total avec les suppléments dans la modale
 */
function calculerPrixModale() {
  if (!produitActuel) return;

  let prixTotal = produitActuel.prixBase;

  // Récupération du supplément pour le menu
  const optionMenu = document.querySelector('input[name="menu_opt"]:checked');
  if (optionMenu) {
    let supplement = parseFloat(optionMenu.getAttribute('data-prix') || 0);
    if (!isNaN(supplement)) {
      prixTotal += supplement;
    }
  }

  // Mise à jour de l'affichage dans le bouton d'ajout
  const totalEl = document.getElementById('modal-total');
  if (totalEl) {
    totalEl.innerText = prixTotal.toFixed(2).replace('.', ',');
  }
}

/**
 * Valide les choix de la modale et ajoute le produit composé au panier
 */
function ajouterDepuisModale() {
  const painChecked = document.querySelector('input[name="pain"]:checked');
  const menuChecked = document.querySelector('input[name="menu_opt"]:checked');

  const choixPain = painChecked ? painChecked.value : 'Naan';
  const choixMenu = menuChecked ? menuChecked.value : 'Seul';

  // Calcul de la somme totale affichée
  let supplement = menuChecked ? parseFloat(menuChecked.getAttribute('data-prix') || 0) : 0;
  let prixFinal = produitActuel.prixBase + supplement;

  const libelleComplet = `${produitActuel.nom} (${choixPain} - ${choixMenu})`;

  // Ajout au panier
  ajouterAuPanier(libelleComplet, prixFinal);

  // Fermeture de la modale
  fermerModale();
}


// --- 3. GESTION DU PANIER ---

/**
 * Ajoute un article au panier
 */
function ajouterAuPanier(nomComplet, prix) {
  panier.push({
    nom: nomComplet,
    prix: parseFloat(prix)
  });
  afficherPanier();
}

/**
 * Supprime un article du panier selon son index
 */
function supprimerDuPanier(index) {
  panier.splice(index, 1);
  afficherPanier();
}

/**
 * Met à jour le HTML du panier et le montant total
 */
function afficherPanier() {
  const listeHTML = document.getElementById('liste-panier');
  const totalHTML = document.getElementById('total-prix');

  if (!listeHTML || !totalHTML) return;

  if (panier.length === 0) {
    listeHTML.innerHTML = '<p class="empty-cart-msg">Votre panier est vide pour le moment.</p>';
    totalHTML.innerText = '0.00';
    return;
  }

  listeHTML.innerHTML = '';
  let total = 0;

  panier.forEach((item, index) => {
    total += item.prix;
    listeHTML.innerHTML += `
      <div class="cart-item">
        <div class="cart-item-info">
          <span class="cart-item-title">${item.nom}</span>
          <span class="cart-item-price">${item.prix.toFixed(2).replace('.', ',')} €</span>
        </div>
        <button type="button" class="btn-remove" onclick="supprimerDuPanier(${index})">
          Supprimer
        </button>
      </div>
    `;
  });

  totalHTML.innerText = total.toFixed(2).replace('.', ',');
}


// --- 4. ENVOI DE LA COMMANDE (EMAILJS) ---

document.addEventListener('DOMContentLoaded', function() {
  const formCommande = document.getElementById('commande-form');
  if (!formCommande) return;

  formCommande.addEventListener('submit', function(e) {
    e.preventDefault();

    if (panier.length === 0) {
      alert("Votre panier est vide ! Veuillez ajouter des produits avant de valider.");
      return;
    }

    let detailsCommande = panier.map(item => `${item.nom} (${item.prix.toFixed(2).replace('.', ',')}€)`).join('\n - ');
    let totalCommande = document.getElementById('total-prix').innerText;

    let params = {
      user_name: document.getElementById('client_nom')?.value || '',
      user_phone: document.getElementById('client_tel')?.value || '',
      heure_retrait: document.getElementById('heure_retrait')?.value || '',
      details_commande: "\n - " + detailsCommande,
      total: totalCommande + " €"
    };

    // Exemple avec tes vraies clés EmailJS :
     emailjs.send('service_fiab978', 'template_spgmytb', params)
      .then(function() {
        alert('Commande validée avec succès ! Vous réglerez directement sur place lors du retrait.');
        panier = [];
        afficherPanier();
        formCommande.reset();
      }, function(error) {
        alert("Une erreur s'est produite lors de la validation de la commande.");
        console.error("EmailJS Error:", error);
      });
  });
});