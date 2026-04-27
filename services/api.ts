const API_BASE = 'https://165-245-211-201.sslip.io/api';

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface Author {
  id: string;
  name: string;
  full_name?: string;
  arabic?: string;
  description?: string;
  photo_url?: string;
  tradition?: string;
  birth_year?: number;
  death_year?: number;
  bio?: string;
}

export interface Xassida {
  id: string;
  title: string;
  arabic_name?: string;
  author_id: string;
  author_name?: string;
  description?: string;
  verse_count: number;
  categorie?: string;
  is_fiqh?: boolean;
  chapters_json?: Record<string, { name: string; icon: string; arabic?: string }>;
}

export interface Verse {
  id: string;
  verse_number: number;
  chapter_number?: number;
  text_arabic: string;
  transcription?: string;
  translation_fr?: string;
  translation_wo?: string;
}

export interface XassidaAudio {
  id: string;
  xassida_id: string;
  reciter_name: string;
  audio_url?: string;
  youtube_id?: string;
  label?: string;
  chapter_number?: number;
  order_index: number;
}

export const api = {
  authors: {
    list: () => fetchApi<Author[]>('/authors'),
    get: (id: string) => fetchApi<Author & { xassidas: Xassida[] }>(`/authors/${id}`),
  },
  xassidas: {
    list: () => fetchApi<Xassida[]>('/xassidas'),
    get: (id: string) => fetchApi<Xassida>(`/xassidas/${id}`),
    verses: (id: string) => fetchApi<Verse[]>(`/xassidas/${id}/verses`),
    audios: (id: string) => fetchApi<XassidaAudio[]>(`/xassidas/${id}/audios`),
  },
};
