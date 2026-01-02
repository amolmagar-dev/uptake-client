import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FavoriteItem {
  id: string;
  type: 'dashboard' | 'chart' | 'dataset' | 'connection';
  name: string;
  path: string;
  addedAt: number;
}

export interface RecentItem {
  id: string;
  type: 'dashboard' | 'chart' | 'dataset' | 'connection';
  name: string;
  path: string;
  viewedAt: number;
}

interface FavoritesState {
  favorites: FavoriteItem[];
  recentItems: RecentItem[];
  addFavorite: (item: Omit<FavoriteItem, 'addedAt'>) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (item: Omit<FavoriteItem, 'addedAt'>) => void;
  addRecentItem: (item: Omit<RecentItem, 'viewedAt'>) => void;
  clearRecentItems: () => void;
}

const MAX_RECENT_ITEMS = 10;

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      recentItems: [],

      addFavorite: (item) => {
        set((state) => ({
          favorites: [
            { ...item, addedAt: Date.now() },
            ...state.favorites.filter((f) => f.id !== item.id),
          ],
        }));
      },

      removeFavorite: (id) => {
        set((state) => ({
          favorites: state.favorites.filter((f) => f.id !== id),
        }));
      },

      isFavorite: (id) => {
        return get().favorites.some((f) => f.id === id);
      },

      toggleFavorite: (item) => {
        const state = get();
        if (state.isFavorite(item.id)) {
          state.removeFavorite(item.id);
        } else {
          state.addFavorite(item);
        }
      },

      addRecentItem: (item) => {
        set((state) => ({
          recentItems: [
            { ...item, viewedAt: Date.now() },
            ...state.recentItems.filter((r) => r.id !== item.id),
          ].slice(0, MAX_RECENT_ITEMS),
        }));
      },

      clearRecentItems: () => {
        set({ recentItems: [] });
      },
    }),
    {
      name: 'uptake-favorites',
    }
  )
);
