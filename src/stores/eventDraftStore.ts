import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface EventDraft {
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  appointmentStatus: 'new' | 'scheduled' | 'confirmed' | 'cancelled';
  toNotify: boolean;
  internalNote: string;
  pageUrl: string;
  coverImageUrl: string;
  downloadFileUrl: string;
  isMultiDay: boolean;
  lastUpdated: number;
}

interface EventDraftStore {
  drafts: Record<string, EventDraft>; // Key: 'new' or event ID
  
  saveDraft: (key: string, draft: EventDraft) => void;
  getDraft: (key: string) => EventDraft | null;
  clearDraft: (key: string) => void;
  clearAllDrafts: () => void;
}

export const useEventDraftStore = create<EventDraftStore>()(
  persist(
    (set, get) => ({
      drafts: {},
      
      saveDraft: (key, draft) => {
        set((state) => ({
          drafts: {
            ...state.drafts,
            [key]: {
              ...draft,
              lastUpdated: Date.now()
            }
          }
        }));
      },
      
      getDraft: (key) => {
        const draft = get().drafts[key];
        
        // Auto-expire drafts older than 24 hours
        if (draft && Date.now() - draft.lastUpdated > 24 * 60 * 60 * 1000) {
          get().clearDraft(key);
          return null;
        }
        
        return draft || null;
      },
      
      clearDraft: (key) => {
        set((state) => {
          const newDrafts = { ...state.drafts };
          delete newDrafts[key];
          return { drafts: newDrafts };
        });
      },
      
      clearAllDrafts: () => {
        set({ drafts: {} });
      }
    }),
    {
      name: 'event-drafts-storage',
    }
  )
);
