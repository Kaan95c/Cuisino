import { Recipe, User } from '../types';

// Default placeholder images as base64 (small 1x1 pixel images for demo)
const DEFAULT_RECIPE_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
const DEFAULT_AVATAR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAFCtFMYTwAAAABJRU5ErkJggg==';

export const mockCurrentUser: User = {
  id: '1',
  name: 'Marie Chef',
  bio: 'Passionate home cook sharing family recipes 👩‍🍳',
  avatar: DEFAULT_AVATAR,
  recipesCount: 12,
};

export const mockRecipes: Recipe[] = [
  {
    id: '1',
    title: 'Chocolate Chip Cookies',
    description: 'Classic homemade chocolate chip cookies that are crispy on the outside and chewy on the inside.',
    ingredients: [
      '2 1/4 cups all-purpose flour',
      '1 tsp baking soda',
      '1 tsp salt',
      '1 cup butter, softened',
      '3/4 cup granulated sugar',
      '3/4 cup brown sugar',
      '2 large eggs',
      '2 tsp vanilla extract',
      '2 cups chocolate chips'
    ],
    instructions: [
      'Preheat oven to 375°F (190°C)',
      'Mix flour, baking soda, and salt in a bowl',
      'Cream butter and sugars until fluffy',
      'Beat in eggs and vanilla',
      'Gradually mix in flour mixture',
      'Stir in chocolate chips',
      'Drop rounded tablespoons onto ungreased baking sheets',
      'Bake 9-11 minutes until golden brown',
      'Cool on baking sheet for 2 minutes, then transfer to wire rack'
    ],
    image: DEFAULT_RECIPE_IMAGE,
    author: mockCurrentUser,
    likes: 124,
    createdAt: '2024-01-15T10:30:00Z',
    isLiked: true,
    isSaved: false,
  },
  {
    id: '2',
    title: 'Avocado Toast',
    description: 'Simple and delicious avocado toast with a perfect poached egg on top.',
    ingredients: [
      '2 slices sourdough bread',
      '1 ripe avocado',
      '2 eggs',
      '1 tbsp white vinegar',
      'Salt and pepper to taste',
      'Red pepper flakes',
      'Lemon juice'
    ],
    instructions: [
      'Toast the sourdough bread slices',
      'Mash avocado with lemon juice, salt, and pepper',
      'Fill a pot with water and bring to a gentle simmer',
      'Add vinegar to the water',
      'Crack eggs into separate small bowls',
      'Create a whirlpool in the water and gently drop eggs in',
      'Poach for 3-4 minutes',
      'Spread avocado mixture on toast',
      'Top with poached eggs and sprinkle with red pepper flakes'
    ],
    image: DEFAULT_RECIPE_IMAGE,
    author: {
      id: '2',
      name: 'Alex Green',
      avatar: DEFAULT_AVATAR
    },
    likes: 89,
    createdAt: '2024-01-14T08:15:00Z',
    isLiked: false,
    isSaved: true,
  },
  {
    id: '3',
    title: 'Spaghetti Carbonara',
    description: 'Authentic Italian carbonara with crispy pancetta and creamy egg sauce.',
    ingredients: [
      '400g spaghetti',
      '200g pancetta, diced',
      '4 large eggs',
      '1 cup Pecorino Romano, grated',
      '1 cup Parmesan, grated',
      'Black pepper',
      'Salt'
    ],
    instructions: [
      'Cook spaghetti in salted boiling water until al dente',
      'Cook pancetta in a large pan until crispy',
      'Whisk eggs with both cheeses and black pepper',
      'Reserve 1 cup pasta water before draining',
      'Add hot pasta to pancetta pan',
      'Remove from heat and quickly toss with egg mixture',
      'Add pasta water gradually to create creamy sauce',
      'Serve immediately with extra cheese and pepper'
    ],
    image: DEFAULT_RECIPE_IMAGE,
    author: {
      id: '3',
      name: 'Marco Rossi',
      avatar: DEFAULT_AVATAR
    },
    likes: 203,
    createdAt: '2024-01-13T19:45:00Z',
    isLiked: true,
    isSaved: true,
  },
  {
    id: '4',
    title: 'Berry Smoothie Bowl',
    description: 'Healthy and colorful smoothie bowl topped with fresh fruits and granola.',
    ingredients: [
      '1 frozen banana',
      '1/2 cup frozen mixed berries',
      '1/4 cup almond milk',
      '1 tbsp honey',
      'Fresh berries for topping',
      'Granola',
      'Chia seeds',
      'Coconut flakes'
    ],
    instructions: [
      'Blend frozen banana, berries, almond milk, and honey until thick',
      'Pour into a bowl',
      'Arrange fresh berries on top',
      'Sprinkle with granola, chia seeds, and coconut flakes',
      'Serve immediately'
    ],
    image: DEFAULT_RECIPE_IMAGE,
    author: {
      id: '4',
      name: 'Emma Wellness',
      avatar: DEFAULT_AVATAR
    },
    likes: 156,
    createdAt: '2024-01-12T07:20:00Z',
    isLiked: false,
    isSaved: false,
  },
  {
    id: '5',
    title: 'Homemade Pizza',
    description: 'Wood-fired style pizza with fresh basil and mozzarella.',
    ingredients: [
      '500g pizza flour',
      '325ml warm water',
      '7g active dry yeast',
      '2 tsp salt',
      '2 tbsp olive oil',
      'Pizza sauce',
      'Fresh mozzarella',
      'Fresh basil leaves'
    ],
    instructions: [
      'Mix yeast with warm water and let sit for 5 minutes',
      'Combine flour and salt in a large bowl',
      'Add yeast mixture and olive oil',
      'Knead for 10 minutes until smooth',
      'Let rise for 1 hour',
      'Preheat oven to 500°F (260°C)',
      'Roll out dough and add toppings',
      'Bake for 10-12 minutes until golden',
      'Add fresh basil before serving'
    ],
    image: DEFAULT_RECIPE_IMAGE,
    author: mockCurrentUser,
    likes: 278,
    createdAt: '2024-01-11T18:30:00Z',
    isLiked: true,
    isSaved: false,
  },
];