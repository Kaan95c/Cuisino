// Script de test pour diagnostiquer les problèmes de connexion
import { apiService } from './api';

export const testConnection = async () => {
  console.log('🔍 Test de connexion API...');
  
  // Test avec votre IP locale
  try {
    console.log('📡 Test 1: Ping du serveur avec votre IP locale (192.168.1.28)...');
    const response = await fetch('http://192.168.1.146:8000/api/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      console.log('✅ Serveur accessible via votre IP locale !');
      const data = await response.json();
      console.log('📄 Réponse:', data);
      return; // Si ça marche, on s'arrête là
    } else {
      console.log('❌ Serveur répond mais avec erreur:', response.status);
    }
  } catch (error) {
    console.log('❌ Erreur de connexion avec IP locale:', error);
  }
  
  // Test avec localhost (au cas où)
  try {
    console.log('📡 Test 2: Essai avec localhost...');
    const response2 = await fetch('http://localhost:8000/api/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response2.ok) {
      console.log('✅ Serveur accessible via localhost !');
      console.log('💡 Solution: Changez l\'URL dans api.ts vers localhost');
    }
  } catch (error2) {
    console.log('❌ localhost aussi inaccessible:', error2);
  }
  
  // Test avec 10.0.2.2 (Android emulator)
  try {
    console.log('📡 Test 3: Essai avec 10.0.2.2 (Android emulator)...');
    const response3 = await fetch('http://10.0.2.2:8000/api/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response3.ok) {
      console.log('✅ Serveur accessible via 10.0.2.2 !');
      console.log('💡 Solution: Changez l\'URL dans api.ts vers 10.0.2.2');
    }
  } catch (error3) {
    console.log('❌ 10.0.2.2 aussi inaccessible:', error3);
  }
  
  // Test 3: Test d'inscription
  console.log('📡 Test 3: Test d\'inscription...');
  try {
    const testUser = {
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser123',
      email: 'test@example.com',
      phone: '+33123456789',
      password: 'password123'
    };
    
    const result = await apiService.register(testUser);
    console.log('✅ Inscription réussie !', result);
  } catch (error) {
    console.log('❌ Erreur d\'inscription:', error);
  }
};

// Fonction pour obtenir l'IP locale
export const getLocalIP = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    console.log('🌐 Votre IP publique:', data.ip);
    console.log('💡 Pour un appareil physique, utilisez votre IP locale (ex: 192.168.1.XXX)');
  } catch (error) {
    console.log('❌ Impossible d\'obtenir l\'IP:', error);
  }
};
