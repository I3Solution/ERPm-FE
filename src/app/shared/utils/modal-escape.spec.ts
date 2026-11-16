import type { DialogService } from '../../core/services/dialog.service';
import { guardModalDismiss, handleModalEscape } from './modal-escape';

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
    await new Promise(r => setTimeout(r));
    expect(closed).toBe(1);
  });

  it('leaves a confirm dialog on screen to handle Escape itself', () => {
    dialogs = { current: () => ({}), confirmDanger: ask } as unknown as DialogService;
    handleModalEscape(esc(), () => dialogs);
    expect(closed).toBe(0);
  });
});

describe('guardModalDismiss', () => {
  let host: HTMLElement;
  let closed: number;
  let ask: jasmine.Spy;
  let listener: (e: MouseEvent) => void;

  const open = (html: string, cls = 'erpm-modal-backdrop') => {
    host = document.createElement('div');
    host.className = cls;
    host.innerHTML = html;
    host.addEventListener('click', () => closed++);
    document.body.appendChild(host);
  };
  const click = (el: Element) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

  beforeEach(() => {
    closed = 0;
    ask = jasmine.createSpy('confirmDanger').and.resolveTo(true);
    const dialogs = { current: () => null, confirmDanger: ask } as unknown as DialogService;
    listener = e => guardModalDismiss(e, () => dialogs);
    document.addEventListener('click', listener, true);
  });
  afterEach(() => { document.removeEventListener('click', listener, true); host.remove(); });

  it('ignores a backdrop click on an input modal', () => {
    open('<div><input></div>');
    click(host);
    expect(closed).toBe(0);
  });

  it('lets a modal without fields close from the backdrop', () => {
    open('<div>Sure?</div>');
    click(host);
    expect(closed).toBe(1);
  });

  it('lets the print preview close from the backdrop', () => {
    open('<input>', 'erpm-modal-backdrop print-dialog-backdrop');
    click(host);
    expect(closed).toBe(1);
  });

  it('closes a pristine input modal from X without asking', () => {
    open('<button class="modal-close-btn"></button><input>');
    click(host.querySelector('.modal-close-btn')!);
    expect(ask).not.toHaveBeenCalled();
    expect(closed).toBe(1);
  });

  it('asks before X/Cancel closes an edited input modal, and closes on yes', async () => {
    open('<button class="modal-close-btn"></button><div class="erpm-modal-footer"><button class="erpm-btn-secondary"></button></div><input class="ng-dirty">');
    click(host.querySelector('.erpm-btn-secondary')!);
    expect(closed).toBe(0);
    expect(ask).toHaveBeenCalledTimes(1);
    await new Promise(r => setTimeout(r));
    expect(closed).toBe(1);
  });

  it('keeps an edited modal open when the answer is no', async () => {
    ask.and.resolveTo(false);
    open('<button class="modal-close-btn"></button><input class="ng-dirty">');
    click(host.querySelector('.modal-close-btn')!);
    await new Promise(r => setTimeout(r));
    expect(closed).toBe(0);
  });
});
