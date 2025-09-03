import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration de l'URL de l'API selon l'environnement
// Android emulator: 10.0.2.2
// iOS simulator: localhost
// Physical device: votre IP locale

// IMPORTANT: Changez cette IP si votre ordinateur change de réseau
// Pour trouver votre IP: ipconfig (Windows) ou ifconfig (Mac/Linux)
const API_BASE_URL = 'http://192.168.1.146:8000/api';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  bio?: string;
  avatar?: string;
  createdAt: string;
  isActive: boolean;
}

export interface UserCreate {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  avatar?: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserUpdate {
  firstName?: string;
  lastName?: string;
  username?: string;
  bio?: string;
  avatar?: string;
  phone?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

class ApiService {
  private async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem('auth_token');
  }

  private async setAuthToken(token: string): Promise<void> {
    await AsyncStorage.setItem('auth_token', token);
  }

  private async removeAuthToken(): Promise<void> {
    await AsyncStorage.removeItem('auth_token');
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Authentication methods
  async register(userData: UserCreate): Promise<User> {
    return this.makeRequest<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: UserLogin): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    await this.setAuthToken(response.access_token);
    return response;
  }

  async logout(): Promise<void> {
    await this.removeAuthToken();
  }

  async getCurrentUser(): Promise<User> {
    return this.makeRequest<User>('/users/me');
  }

  async updateUser(userData: UserUpdate): Promise<User> {
    return this.makeRequest<User>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async getUserById(userId: string): Promise<User> {
    return this.makeRequest<User>(`/users/${userId}`);
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAuthToken();
    if (!token) return false;

    try {
      await this.getCurrentUser();
      return true;
    } catch {
      await this.removeAuthToken();
      return false;
    }
  }

  // Recipe methods
  async createRecipe(recipeData: any): Promise<any> {
    return this.makeRequest('/recipes', {
      method: 'POST',
      body: JSON.stringify(recipeData),
    });
  }

  async getRecipes(): Promise<any[]> {
    return this.makeRequest('/recipes');
  }

  async getRecipeById(id: string): Promise<any> {
    return this.makeRequest(`/recipes/${id}`);
  }

  async toggleLike(recipeId: string): Promise<any> {
    return this.makeRequest(`/recipes/${recipeId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'toggle_like' }),
    });
  }

  async toggleSave(recipeId: string): Promise<any> {
    return this.makeRequest(`/recipes/${recipeId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'toggle_save' }),
    });
  }

  async getUserRecipes(): Promise<any[]> {
    return this.makeRequest('/users/me/recipes');
  }

  async getLikedRecipes(): Promise<any[]> {
    return this.makeRequest('/users/me/liked-recipes');
  }

  async getSavedRecipes(): Promise<any[]> {
    return this.makeRequest('/users/me/saved-recipes');
  }

  async deleteRecipe(recipeId: string): Promise<any> {
    return this.makeRequest(`/recipes/${recipeId}`, {
      method: 'DELETE',
    });
  }

  // Comment methods
  async getComments(recipeId: string): Promise<any[]> {
    return this.makeRequest(`/recipes/${recipeId}/comments`);
  }

  async addComment(commentData: any): Promise<any> {
    return this.makeRequest('/comments', {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
  }

  // User methods
  async getUsers(): Promise<any[]> {
    return this.makeRequest('/users');
  }

  async followUser(userId: string): Promise<any> {
    return this.makeRequest(`/users/${userId}/follow`, {
      method: 'POST',
    });
  }

  async unfollowUser(userId: string): Promise<any> {
    return this.makeRequest(`/users/${userId}/unfollow`, {
      method: 'POST',
    });
  }

  async getFollowers(): Promise<any[]> {
    return this.makeRequest('/users/me/followers');
  }

  async getFollowing(): Promise<any[]> {
    return this.makeRequest('/users/me/following');
  }

  // Messaging methods
  async getConversations(): Promise<any[]> {
    return this.makeRequest('/conversations');
  }

  async getMessages(conversationId: string): Promise<any[]> {
    return this.makeRequest(`/conversations/${conversationId}/messages`);
  }

  async sendMessage(conversationId: string, content: string): Promise<any> {
    return this.makeRequest(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async createConversation(userId: string): Promise<any> {
    return this.makeRequest('/conversations', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async getConversation(conversationId: string): Promise<any> {
    return this.makeRequest(`/conversations/${conversationId}`);
  }
}

export const apiService = new ApiService();
