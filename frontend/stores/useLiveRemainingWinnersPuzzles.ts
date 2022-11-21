import create from "zustand";
import { hasuraClient } from "apiClients/hasuraClient";
import type { ModelsNS } from "types";

export interface ILiveRemainingWinnersPuzzlesStore {
  liveRemainingWinnersPuzzles: ModelsNS.RemainingWinnersPuzzle[];
  subscription?: ZenObservable.Subscription;
  subscribe: () => void;
  unsubscribe: () => void;
}

export const useLiveRemainingWinnersPuzzles =
  create<ILiveRemainingWinnersPuzzlesStore>((set, get) => ({
    liveRemainingWinnersPuzzles: [],
    subscribe: () => {
      const subscription = hasuraClient
        .subscribeToLivePuzzlesRemainingWinners()
        .subscribe((response) => {
          if (response.data) {
            set((state) => ({
              ...state,
              liveRemainingWinnersPuzzles: response.data.puzzles,
            }));
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
          liveRemainingWinnersPuzzles: [],
          subscription: undefined,
        }));
      }
    },
  }));
