import { DestroyRef, Injectable, computed, inject, linkedSignal, signal } from '@angular/core';
import { AuthService } from './auth.service';

export const NAVIGATION_PREFERENCE_STORAGE_PREFIX = 'erpm_nav_expanded:account:';
export const NAVIGATION_PREFERENCE_VERSION = 1;

interface StoredNavigationPreferenceV1 {
  version: typeof NAVIGATION_PREFERENCE_VERSION;
  expanded: string[];
}

interface SuppressedActiveGroup {
  accountId: number | null;
  groupId: string;
}

/** Builds the account-scoped localStorage key for navigation group preferences. */
export function navigationPreferenceKey(accountId: number): string {
  return `${NAVIGATION_PREFERENCE_STORAGE_PREFIX}${accountId}`;
}

/**
 * Account-scoped, versioned preference store for expanded navigation groups.
 * Shared across the desktop sidebar and mobile "More" module menu so both views stay in sync.
 * Separates manually persisted user choices from ephemeral active-route expansion.
 */
@Injectable({ providedIn: 'root' })
export class NavigationPreferenceService {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly accountId = computed(() => this.auth.account()?.id ?? null);

  private readonly persistedState = linkedSignal<number | null, ReadonlySet<string>>({
    source: this.accountId,
    computation: (accountId) => accountId === null ? new Set<string>() : this.read(accountId)
  });

  private readonly suppressedActive = signal<SuppressedActiveGroup | null>(null);

  /** Persisted manual expansion state for the signed-in account. */
  public readonly expandedGroups = this.persistedState.asReadonly();

  constructor() {
    if (typeof window !== 'undefined') {
      const onStorage = (event: StorageEvent): void => {
        const accountId = this.accountId();
        if (accountId === null) return;
        if (event.key === null || event.key === navigationPreferenceKey(accountId)) {
          this.persistedState.set(this.read(accountId));
        }
      };
      window.addEventListener('storage', onStorage);
      this.destroyRef.onDestroy(() => window.removeEventListener('storage', onStorage));
    }
  }

  /**
   * Applies an explicit user expand/collapse action for a navigation group.
   * Only manual user toggles update persisted storage; collapsing the currently active
   * route group also suppresses ephemeral auto-expansion for the current route visit.
   */
  public setGroupExpanded(
    groupId: string,
    expanded: boolean,
    validGroupIds?: ReadonlySet<string>,
    activeGroup?: string
  ): void {
    if (validGroupIds && !validGroupIds.has(groupId)) return;

    const current = this.persistedState();
    const next = new Set<string>();
    for (const id of current) {
      if (!validGroupIds || validGroupIds.has(id)) {
        next.add(id);
      }
    }
    const pruned = next.size !== current.size;

    if (expanded) {
      const changed = !next.has(groupId) || pruned;
      next.add(groupId);
      if (this.suppressedActive()?.groupId === groupId) {
        this.suppressedActive.set(null);
      }
      if (changed) {
        this.persistedState.set(next);
        this.write(next);
      }
      return;
    }

    const removed = next.delete(groupId);
    if (activeGroup === groupId) {
      this.suppressedActive.set({ accountId: this.accountId(), groupId });
    }
    if (removed || pruned) {
      this.persistedState.set(next);
      this.write(next);
    }
  }

  /**
   * Returns true when the user explicitly collapsed the currently active route group
   * during the current visit (Option A ephemeral suppression).
   */
  public isActiveGroupSuppressed(activeGroup: string | undefined): boolean {
    if (!activeGroup) return false;
    const suppressed = this.suppressedActive();
    return suppressed !== null
      && suppressed.accountId === this.accountId()
      && suppressed.groupId === activeGroup;
  }

  /**
   * Clears ephemeral active-group suppression once navigation moves away from that group
   * or the signed-in account changes.
   */
  public syncActiveGroup(activeGroup: string | undefined): void {
    const suppressed = this.suppressedActive();
    if (suppressed && (suppressed.accountId !== this.accountId() || suppressed.groupId !== activeGroup)) {
      this.suppressedActive.set(null);
    }
  }

  private read(accountId: number): ReadonlySet<string> {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(navigationPreferenceKey(accountId));
    } catch {
      return new Set<string>();
    }
    if (!raw) return new Set<string>();

    try {
      const parsed: unknown = JSON.parse(raw);
      if (!this.isStoredPreferenceV1(parsed)) return new Set<string>();
      const valid = parsed.expanded.filter((id): id is string => typeof id === 'string' && id.length > 0);
      return new Set<string>(valid);
    } catch {
      return new Set<string>();
    }
  }

  private write(expanded: ReadonlySet<string>): void {
    const accountId = this.accountId();
    if (accountId === null) return;
    const payload: StoredNavigationPreferenceV1 = {
      version: NAVIGATION_PREFERENCE_VERSION,
      expanded: Array.from(expanded)
    };
    try {
      localStorage.setItem(navigationPreferenceKey(accountId), JSON.stringify(payload));
    } catch {
      // Storage may be blocked or exceed quota; keep in-memory state functional.
    }
  }

  private isStoredPreferenceV1(value: unknown): value is StoredNavigationPreferenceV1 {
    if (value === null || typeof value !== 'object') return false;
    const record = value as Record<string, unknown>;
    return record['version'] === NAVIGATION_PREFERENCE_VERSION && Array.isArray(record['expanded']);
  }
}
