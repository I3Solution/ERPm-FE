import systemDictionary from '../../../assets/i18n/system.json';
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Language {
  code: string;
  name: string;
  flagIcon: string;
}

const DEFAULT_FALLBACK_DICTIONARY: Record<string, Record<string, string>> = systemDictionary;

@Injectable({
  providedIn: 'root'
})
export class LocalizationService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/v1/localization`;
  private readonly currentLangSignal = signal<'vi' | 'en'>('vi');

  // In-memory dual-dictionary cache for instant 0ms switching
  private inMemoryCache: Record<'vi' | 'en', Record<string, string>> = {
    vi: { ...DEFAULT_FALLBACK_DICTIONARY['vi'], ...systemDictionary.vi },
    en: { ...DEFAULT_FALLBACK_DICTIONARY['en'], ...systemDictionary.en }
  };

  private readonly dictionarySignal = signal<Record<string, string>>(this.inMemoryCache['vi']);

  public currentLang = computed(() => this.currentLangSignal());
  public dictionary = computed(() => this.dictionarySignal());

  public languages = signal<Language[]>([
    { code: 'vi', name: 'Tiếng Việt', flagIcon: '🇻🇳' },
    { code: 'en', name: 'English', flagIcon: '🇺🇸' }
  ]);

  constructor(private http: HttpClient) {
    // 1. Hydrate memory cache from localStorage if previously stored
    this.hydrateFromStorage('vi');
    this.hydrateFromStorage('en');

    // 2. Read saved user language preference
    const savedLang = localStorage.getItem('erpm_lang') as 'vi' | 'en' | null;
    const initialLang: 'vi' | 'en' = (savedLang === 'vi' || savedLang === 'en') ? savedLang : 'vi';

    this.currentLangSignal.set(initialLang);
    this.dictionarySignal.set(this.inMemoryCache[initialLang]);

    // 3. Preload/Sync in background silently without blocking the UI
    this.syncBackground('vi');
    this.syncBackground('en');
  }

  /**
   * Switch language immediately (0ms instant UI update)
   */
  public setLanguage(lang: 'vi' | 'en'): void {
    if (this.currentLangSignal() === lang && Object.keys(this.dictionarySignal()).length > 0) {
      return;
    }

    this.currentLangSignal.set(lang);
    localStorage.setItem('erpm_lang', lang);

    // Synchronous immediate switch from in-memory cache (< 1ms)
    const activeDict = this.inMemoryCache[lang] || DEFAULT_FALLBACK_DICTIONARY[lang];
    this.dictionarySignal.set(activeDict);

    // Sync updates in background (Stale-While-Revalidate)
    this.syncBackground(lang);
  }

  public translate(key: string, defaultText?: string): string {
    const current = this.currentLangSignal();
    const activeDict = this.dictionarySignal();

    if (activeDict && activeDict[key]) {
      return activeDict[key];
    }

    const fallback = DEFAULT_FALLBACK_DICTIONARY[current];
    if (fallback && fallback[key]) {
      return fallback[key];
    }

    return defaultText || key;
  }

  private hydrateFromStorage(lang: 'vi' | 'en'): void {
    try {
      const stored = localStorage.getItem(`erpm_dict_${lang}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.inMemoryCache[lang] = { ...this.inMemoryCache[lang], ...parsed };
      }
    } catch {
      // Ignore parse errors, use in-memory fallback
    }
  }

  private lastSyncTime: Record<'vi' | 'en', number> = { vi: 0, en: 0 };
  private readonly SYNC_COOLDOWN_MS = 5 * 60 * 1000;

  private syncBackground(lang: 'vi' | 'en', force = false): void {
    const now = Date.now();

    if (!force && (now - this.lastSyncTime[lang] < this.SYNC_COOLDOWN_MS)) {
      return;
    }

    const fallback = { ...DEFAULT_FALLBACK_DICTIONARY[lang], ...systemDictionary[lang] };
    this.http.get<{ success: boolean; data: { languageCode: string; entries: Record<string, string> } }>(`${this.apiUrl}/${lang}`)
      .pipe(
        catchError(() => of({ success: false, data: { languageCode: lang, entries: {} } }))
      )
      .subscribe({
        next: (res) => {
          this.lastSyncTime[lang] = Date.now();
          if (res && res.data && Object.keys(res.data.entries).length > 0) {
            const merged = { ...fallback, ...res.data.entries };
            this.inMemoryCache[lang] = merged;


            try {
              localStorage.setItem(`erpm_dict_${lang}`, JSON.stringify(res.data.entries));
            } catch { }


            if (this.currentLangSignal() === lang) {
              this.dictionarySignal.set(merged);
            }
          }
        }
      });
  }




  public forceRefreshTranslations(): void {
    this.syncBackground('vi', true);
    this.syncBackground('en', true);
  }
}
