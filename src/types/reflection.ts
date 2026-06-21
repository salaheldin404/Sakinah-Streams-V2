export type EmotionTag = 
  | 'anxious' 
  | 'sad' 
  | 'stressed' 
  | 'guilty' 
  | 'lonely' 
  | 'grateful' 
  | 'unmotivated' 
  | 'hopeful' 
  | 'angry' 
  | 'disconnected' 
  | 'peaceful';

export interface QuranVerse {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  text: string;
  tafsir?: string; 
}

export interface AthkarSuggestion {
  arabic: string;
  transliteration: string;
  translation: string;
  purpose: string;
  reference?: string;
}

export interface ReflectionResponse {
  emotionTag: string;
  themes: string[];
  verses: QuranVerse[];
  athkar: AthkarSuggestion[];
  reflection: string;
  wirdPlan: string;
  motivationalMessage: string;
  uiColorTheme: string;
}

export interface EmotionLogEntry {
  id: string;
  userId: string;
  emotionTag: EmotionTag;
  userInput?: string;
  aiResponse: ReflectionResponse;
  createdAt: Date;
}


export interface HistoryItem {
  id: string;
  emotionTag: string;
  userInput: string | null;
  aiResponse: ReflectionResponse;
  createdAt: string;
}