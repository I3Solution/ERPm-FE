import { Injectable, signal } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class ApiErrorService { public message = signal<string | null>(null); }
