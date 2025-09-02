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