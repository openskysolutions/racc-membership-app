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
  draft: EventDraft | null;
  
  saveDraft: (draft: EventDraft) => void;
  getDraft: () => EventDraft | null;
  clearDraft: () => void;
}

export const useEventDraftStore = create<EventDraftStore>()(
  persist(
    (set, get) => ({
      draft: null,
      
      saveDraft: (draft) => {
        set({
          draft: {
            ...draft,
            lastUpdated: Date.now()
          }
        });
      },
      
      getDraft: () => {
        const draft = get().draft;
        
        // Auto-expire drafts older than 24 hours
        if (draft && Date.now() - draft.lastUpdated > 24 * 60 * 60 * 1000) {
          get().clearDraft();
          return null;
        }
        
        return draft;
      },
      
      clearDraft: () => {
        set({ draft: null });
      }
    }),
    {
      name: 'event-draft-storage',
    }
  )
);
