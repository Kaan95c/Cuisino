export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  image: string; // base64 string
  author: {
    id: string;
    name: string;
    avatar: string; // base64 string
  };
  likes: number;
  createdAt: string;
  isLiked: boolean;
  isSaved: boolean;
  category?: string; // meal category (breakfast, lunch, dinner, snack, dessert, drink)
  servings?: number; // number of servings
  prepTimeMinutes?: number; // preparation time in minutes
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[]; // list of tags
}

export interface User {
  id: string;
  name: string;
  bio: string;
  avatar: string; // base64 string
  recipesCount: number;
}

export interface AppState {
  recipes: Recipe[];
  currentUser: User;
  likedRecipes: string[];
  savedRecipes: string[];
}