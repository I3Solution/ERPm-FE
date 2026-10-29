import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';

export interface BranchDto {
  id: number;
  code: string;
  name: string;
  parentId?: number | null;
  parentName?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  isDefault: boolean;
  isActive: boolean;
  children?: BranchDto[];
}

export interface CreateBranchRequest {
  code: string;
  name: string;
  parentId?: number | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}

// Special Global Scope Branch option (All company branches)
export const ALL_BRANCHES_OPTION: BranchDto = {
  id: 0,
  code: 'ALL',
  name: '🌐 Toàn hệ thống (Tất cả chi nhánh)',
  isDefault: false,
  isActive: true,
  children: []
};

@Injectable({
  providedIn: 'root'
})
export class BranchService {
  private readonly apiUrl = '/api/v1/branches';
  private readonly STORAGE_KEY = 'erpm_selected_branch_id';

  public branches = signal<BranchDto[]>([]);
  public branchTree = signal<BranchDto[]>([]);
  public currentBranch = signal<BranchDto | null>(null);
  public isLoading = signal<boolean>(false);

  constructor(private http: HttpClient) {
    this.initSavedBranch();

  }

  private initSavedBranch(): void {
    const savedIdStr = localStorage.getItem(this.STORAGE_KEY);
    if (savedIdStr !== null) {
      const savedId = Number(savedIdStr);
      if (savedId === ALL_BRANCHES_OPTION.id) {
        this.currentBranch.set(ALL_BRANCHES_OPTION);
      } else if (!Number.isNaN(savedId)) {
        const found = this.findBranchInTree(this.branchTree(), savedId);
        if (found) {
          this.currentBranch.set(found);
        }
      }
    }
  }

  public loadBranches(): void {
    this.isLoading.set(true);

    // Load Flat list
    this.http.get<{ success: boolean; data: BranchDto[] }>(this.apiUrl)
      .subscribe({
        next: (res) => {
          if (res && res.success && res.data && res.data.length > 0) {
            this.branches.set(res.data);
          }
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        }
      });

    // Load Tree list
    this.http.get<{ success: boolean; data: BranchDto[] }>(`${this.apiUrl}/tree`)
      .subscribe({
        next: (res) => {
          if (res && res.success && res.data && res.data.length > 0) {
            this.branchTree.set(res.data);
            const savedIdStr = localStorage.getItem(this.STORAGE_KEY);
            const savedId = savedIdStr !== null ? Number(savedIdStr) : null;
            if (savedId !== null && !Number.isNaN(savedId) && savedId !== ALL_BRANCHES_OPTION.id) {
              const matched = this.findBranchInTree(res.data, savedId);
              if (matched) {
                this.currentBranch.set(matched);
                return;
              }
            }
            if (!this.currentBranch() || this.currentBranch()?.id !== ALL_BRANCHES_OPTION.id) {
              this.currentBranch.set(res.data[0] ?? null);
            }
          }
        },
        error: () => {
          // Keep the last confirmed scope; never invent branch IDs.
        }
      });
  }

  public selectBranch(branch: BranchDto): void {
    this.currentBranch.set(branch);
    localStorage.setItem(this.STORAGE_KEY, String(branch.id));
  }

  public getActiveBranchIdForQuery(): number | null {
    const current = this.currentBranch();
    if (!current || current.id === ALL_BRANCHES_OPTION.id || current.code === 'ALL') {
      return null; // Return null so backend queries all branches
    }
    return current.id;
  }

  public findBranchInTree(nodes: BranchDto[], id: number): BranchDto | null {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children && node.children.length > 0) {
        const found = this.findBranchInTree(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  public createBranch(request: CreateBranchRequest): Observable<BranchDto> {
    return this.http.post<{ success: boolean; data: BranchDto }>(this.apiUrl, request)
      .pipe(
        map(res => res.data),
        tap(created => {
          this.branches.set([...this.branches(), created]);
          this.loadBranches();
        })
      );
  }
}
