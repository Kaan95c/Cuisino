// Script de test pour vérifier le flux complet des recettes
// À exécuter dans la console du navigateur ou dans l'app

console.log('🧪 Test du flux complet des recettes');

// Test 1: Vérifier que l'API est accessible
async function testApiConnection() {
  try {
    const response = await fetch('http://192.168.1.146:8000/api/');
    if (response.ok) {
      console.log('✅ API accessible');
      return true;
    } else {
      console.log('❌ API non accessible');
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur de connexion API:', error);
    return false;
  }
}

// Test 2: Créer une recette de test
async function testCreateRecipe() {
  try {
    const testRecipe = {
      title: "Recette de test",
      description: "Description de test",
      ingredients: ["Ingrédient 1", "Ingrédient 2"],
      instructions: ["Étape 1", "Étape 2"],
      image: "https://example.com/image.jpg",
      author: {
        id: "test-user-id",
        name: "Test User",
        avatar: "https://example.com/avatar.jpg"
      },
      servings: 4,
      prepTimeMinutes: 30,
      difficulty: "easy",
      tags: ["test"]
    };

    const response = await fetch('http://192.168.1.146:8000/api/recipes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // Remplacez par un vrai token
      },
      body: JSON.stringify(testRecipe)
    });

    if (response.ok) {
      const recipe = await response.json();
      console.log('✅ Recette créée:', recipe.id);
      return recipe.id;
    } else {
      console.log('❌ Erreur création recette:', response.status);
      return null;
    }
  } catch (error) {
    console.log('❌ Erreur création recette:', error);
    return null;
  }
}

// Test 3: Récupérer une recette
async function testGetRecipe(recipeId) {
  try {
    const response = await fetch(`http://192.168.1.146:8000/api/recipes/${recipeId}`);
    if (response.ok) {
      const recipe = await response.json();
      console.log('✅ Recette récupérée:', recipe.title);
      return recipe;
    } else {
      console.log('❌ Erreur récupération recette:', response.status);
      return null;
    }
  } catch (error) {
    console.log('❌ Erreur récupération recette:', error);
    return null;
  }
}

// Exécuter tous les tests
async function runAllTests() {
  console.log('🚀 Démarrage des tests...');
  
  const apiOk = await testApiConnection();
  if (!apiOk) {
    console.log('❌ Tests arrêtés - API non accessible');
    return;
  }
  
  const recipeId = await testCreateRecipe();
  if (recipeId) {
    await testGetRecipe(recipeId);
  }
  
  console.log('✅ Tests terminés');
}

// Exécuter les tests
runAllTests();
