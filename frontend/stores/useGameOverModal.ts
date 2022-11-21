import create from "zustand";
import { hasuraClient } from "apiClients/hasuraClient";
import { ModelsNS } from "types";

export interface IGameOverModalStore {
  open: boolean;
  loaded: boolean;
  subscription?: ZenObservable.Subscription;
  completedPuzzlesForGroup: ModelsNS.CompletedPuzzle[];
  puzzlesWon: ModelsNS.CompletedPuzzle[];
  close: () => void;
  subscribe: (groupId: number) => void;
  unsubscribe: () => void;
}

export const useGameOverModal = create<IGameOverModalStore>((set, get) => ({
  open: false,
  loaded: false,
  completedPuzzlesForGroup: [],
  puzzlesWon: [],
  close: () => set((state) => ({ ...state, open: false, puzzlesWon: [] })),
  subscribe: (groupId: number) => {
    // TODO: return early if we don't have an active drop
    // TODO: return early if we're already subscribed
    const subscription = hasuraClient
      .subscribeToCompletedPuzzlesForGroup(groupId)
      .subscribe((response) => {
        if (response.data) {
          if (!get().loaded) {
            set((state) => ({
              ...state,
              loaded: true,
              completedPuzzlesForGroup: response.data.puzzles,
            }));
            return;
          }
          const currentCompletedPuzzlesIds = get().completedPuzzlesForGroup.map(
            (p) => p.id
          );
          const newCompletedPuzzles = response.data.puzzles;
          if (newCompletedPuzzles.length > currentCompletedPuzzlesIds.length) {
            const puzzlesWon = newCompletedPuzzles.filter(
              (p) => !currentCompletedPuzzlesIds.includes(p.id)
            );
            set((state) => ({
              ...state,
              open: true,
              puzzlesWon,
              completedPuzzlesForGroup: newCompletedPuzzles,
            }));
          }
        }
      });
    set((state) => ({ ...state, subscription }));
  },
  unsubscribe: () => {
    const subscription = get().subscription;
    if (subscription) {
      subscription.unsubscribe();
      set((state) => ({
        ...state,
        open: false,
        completedPuzzlesForGroup: [],
        puzzlesWon: [],
        subscription: undefined,
      }));
    }
  },
}));
