import type { DialogService } from '../../core/services/dialog.service';
import { handleModalEscape } from './modal-escape';

describe('handleModalEscape', () => {
  let host: HTMLElement;
  let closed: number;
  let ask: jasmine.Spy;
  let dialogs: DialogService;
  const esc = () => new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });

  beforeEach(() => {
    closed = 0;
    ask = jasmine.createSpy('confirmDanger').and.resolveTo(false);
    dialogs = { current: () => null, confirmDanger: ask } as unknown as DialogService;
    host = document.createElement('div');
    host.className = 'erpm-modal-backdrop';
    host.innerHTML = '<button class="modal-close-btn"></button><input>';
    host.querySelector('.modal-close-btn')!.addEventListener('click', () => closed++);
    document.body.appendChild(host);
  });
  afterEach(() => host.remove());

  it('closes a pristine modal at once', () => {
    handleModalEscape(esc(), () => dialogs);
    expect(closed).toBe(1);
    expect(ask).not.toHaveBeenCalled();
  });

  it('asks before closing a modal with edited fields and closes only on yes', async () => {
    host.querySelector('input')!.className = 'ng-dirty';
    handleModalEscape(esc(), () => dialogs);
    await Promise.resolve();
    expect(ask).toHaveBeenCalledTimes(1);
    expect(closed).toBe(0);
    ask.and.resolveTo(true);
    handleModalEscape(esc(), () => dialogs);
    await Promise.resolve(); await Promise.resolve();
    expect(closed).toBe(1);
  });

  it('leaves a confirm dialog on screen to handle Escape itself', () => {
    dialogs = { current: () => ({}), confirmDanger: ask } as unknown as DialogService;
    handleModalEscape(esc(), () => dialogs);
    expect(closed).toBe(0);
  });
});
