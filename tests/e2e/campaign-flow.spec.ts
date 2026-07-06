import { test, expect } from '@playwright/test';

test.describe('Flux de Campagne E2E', () => {
  test('Devrait permettre à un utilisateur de se connecter et de créer une campagne', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    
    // On utilise les credentials de test (admin@banquexyz.ci / Sonara2026!)
    await page.fill('input[type="email"]', 'admin@banquexyz.ci');
    await page.fill('input[type="password"]', 'Sonara2026!');
    await page.click('button[type="submit"]');

    // Vérifie qu'on arrive sur le dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('h1')).toContainText('Tableau de bord');

    // 2. Navigation vers la création de campagne
    await page.click('a[href="/dashboard/campaigns"]');
    await expect(page).toHaveURL(/\/dashboard\/campaigns/);
    
    await page.click('a[href="/dashboard/campaigns/new"]');
    await expect(page).toHaveURL(/\/dashboard\/campaigns\/new/);

    // 3. Remplissage du formulaire de campagne (Étape 1)
    await page.fill('input[name="name"]', 'Campagne de Test E2E');
    await page.selectOption('select[name="sector"]', 'BANQUE');
    await page.fill('textarea[name="brief"]', 'Ceci est un test de bout en bout pour valider la création de campagne via Playwright.');
    
    // Étape suivante
    await page.click('button:has-text("Suivant")');

    // Étape 2: Scénario et Voix
    // On sélectionne une voix au hasard si la liste est présente, ou on laisse la valeur par défaut
    // Le bouton de génération de prompt IA peut être testé si on mocke, mais ici on va juste remplir le prompt manuellement
    await page.fill('textarea[name="aiPrompt"]', 'Vous êtes un assistant bancaire. Posez des questions sur la satisfaction.');
    await page.click('button:has-text("Suivant")');

    // Étape 3: Contacts
    // Puisqu'on ne peut pas uploader facilement un CSV sans fichier en CI, on va voir si un bouton "Générer 5 contacts de démo" existe
    // S'il n'existe pas, l'upload de fichier Playwright est possible.
    // Créons un faux CSV en mémoire pour l'upload.
    const csvContent = "Nom,Prénom,Téléphone,Ville\nKouassi,Jean,+2250708234567,Abidjan\nBamba,Ali,+2250585215962,Bouaké";
    await page.setInputFiles('input[type="file"]', {
      name: 'contacts.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    // Attendre que l'upload soit validé (souvent un bouton Importer ou un état)
    await expect(page.locator('text=2 contacts valides trouvés')).toBeVisible();

    // Étape 4: Lancement
    await page.click('button:has-text("Lancer la campagne")');

    // Vérifier le succès et la redirection
    await expect(page).toHaveURL(/\/dashboard\/campaigns/);
    await expect(page.locator('text=Campagne de Test E2E')).toBeVisible();
  });
});
