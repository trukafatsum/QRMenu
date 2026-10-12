export interface Badge {
  label: string;
  type: 'popular' | 'spicy' | 'vegetarian' | 'new' | 'gluten-free';
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  image: string;
  available: boolean;
  badges: Badge[];
  sortOrder: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  sortOrder: number;
}

export interface RestaurantInfo {
  name: string;
  tagline: string;
  description: string;
  coverImage: string;
  backgroundImage?: string;
  logoText: string;
  address: string;
  phone: string;
  hours: string;
  wifiPassword: string;
  instagram: string;
  mapsUrl: string;
}

export interface MenuState {
  restaurant: RestaurantInfo;
  categories: Category[];
  items: MenuItem[];
}
