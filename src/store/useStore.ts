'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/mock/data';

interface ExamStore {
  // Auth
  currentUser: User | null;
  setUser: (user: User) => void;
  logout: () => void;

  // Exam answering state
  currentAnswers: Record<string, string>;
  currentQuestionIndex: number;
  setAnswer: (questionId: string, answer: string) => void;
  setQuestionIndex: (index: number) => void;
  clearAnswers: () => void;
}

export const useStore = create<ExamStore>()(
  persist(
    (set) => ({
      currentUser: null,
      setUser: (user) => set({ currentUser: user }),
      logout: () => set({ currentUser: null }),

      currentAnswers: {},
      currentQuestionIndex: 0,
      setAnswer: (questionId, answer) =>
        set((state) => ({
          currentAnswers: { ...state.currentAnswers, [questionId]: answer },
        })),
      setQuestionIndex: (index) => set({ currentQuestionIndex: index }),
      clearAnswers: () => set({ currentAnswers: {}, currentQuestionIndex: 0 }),
    }),
    {
      name: 'exam-system-store',
      partialize: (state) => ({ currentUser: state.currentUser }),
    }
  )
);
