const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

// Usage: UISTD_PASSWORD=<admin password> node measure.js <out dir>   (needs playwright-core and Chrome; FE on :4243, API on :5243)
const BASE = 'http://127.0.0.1:4243';
const OUT = process.argv[2];            // docs/ui-std
const SHOTS = path.join(OUT, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

const ROUTES = [
  'dashboard', 'catalog', 'catalog/new', 'sales/price-lists', 'sales/quotations', 'sales/orders', 'sales/orders/new',
  'sales/returns', 'inventory', 'crm/partners', 'crm/partners/new', 'org', 'department-levels', 'job-positions',
  'employees', 'employees/new', 'employees/1', 'employees/1/work-history', 'users', 'roles', 'admin', 'more',
  'notifications', 'notifications/preferences', 'notifications/templates'
];
const VIEWS = [
  { key: 'desktop-light', width: 1366, height: 768, scheme: 'light' },
  { key: 'desktop-dark', width: 1366, height: 768, scheme: 'dark' },
  { key: 'mobile-light', width: 390, height: 844, scheme: 'light' }
];

function measure() {
  const px = (v) => Math.round(parseFloat(v) * 10) / 10;
  const box = (el) => { const r = el.getBoundingClientRect(); return { w: px(r.width), h: px(r.height), top: px(r.top), bottom: px(r.bottom) }; };
  const cs = (el) => getComputedStyle(el);
  const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const main = document.querySelector('main, .app-content, router-outlet + *') || document.body;
  const out = {};

  const h1 = [...document.querySelectorAll('h1, .erpm-page-title')].filter(visible)[0];
  out.title = h1 ? { text: h1.textContent.trim().slice(0, 40), size: px(cs(h1).fontSize), weight: cs(h1).fontWeight, h: box(h1).h } : null;

  const primary = [...document.querySelectorAll('.erpm-btn-primary')].filter(visible).filter(b => !b.closest('tbody'))[0];
  out.primaryBtn = primary ? { text: primary.textContent.trim().slice(0, 24), h: box(primary).h, size: px(cs(primary).fontSize), padY: px(cs(primary).paddingTop), padX: px(cs(primary).paddingLeft), right: px(primary.getBoundingClientRect().right) } : null;

  const rowBtns = [...document.querySelectorAll('tbody button, tbody a.erpm-btn, tbody .erpm-btn')].filter(visible);
  if (rowBtns.length) {
    const hs = rowBtns.map(b => box(b).h), fs = rowBtns.map(b => px(cs(b).fontSize));
    const perRow = {};
    rowBtns.forEach(b => { const tr = b.closest('tr'); perRow[tr ? [...tr.parentNode.children].indexOf(tr) : -1] = (perRow[tr ? [...tr.parentNode.children].indexOf(tr) : -1] || 0) + 1; });
    out.rowBtns = { count: rowBtns.length, hMin: Math.min(...hs), hMax: Math.max(...hs), fontMin: Math.min(...fs), fontMax: Math.max(...fs), maxPerRow: Math.max(...Object.values(perRow)), withText: rowBtns.filter(b => b.textContent.trim().length > 2).length };
  }

  const search = [...document.querySelectorAll('input[type=text], input[type=search], input:not([type])')].filter(visible)[0];
  out.firstInput = search ? { h: box(search).h, size: px(cs(search).fontSize), ph: (search.placeholder || '').slice(0, 20) } : null;

  const tr = [...document.querySelectorAll('tbody tr')].filter(visible)[0];
  const th = [...document.querySelectorAll('thead th')].filter(visible)[0];
  const td = tr ? tr.querySelector('td') : null;
  out.table = (tr || th) ? { rowH: tr ? box(tr).h : null, tdSize: td ? px(cs(td).fontSize) : null, tdPadY: td ? px(cs(td).paddingTop) : null, thH: th ? box(th).h : null, thSize: th ? px(cs(th).fontSize) : null, rows: document.querySelectorAll('tbody tr').length, isDataTable: !!document.querySelector('app-data-table'), rawTable: !!document.querySelector('table') && !document.querySelector('app-data-table') } : null;

  const tableEl = document.querySelector('table');
  if (tableEl) {
    const card = tableEl.closest('.erpm-card, .erpm-table-container, .table-card, [class*=card]');
    out.tableFrame = { overflowX: tableEl.scrollWidth > (tableEl.parentElement ? tableEl.parentElement.clientWidth + 1 : 0), cardBorder: card ? cs(card).borderTopWidth : null };
  }

  out.frames = { listPage: !!document.querySelector('app-list-page'), detailPage: !!document.querySelector('app-detail-page') };
  out.pageOverflowX = document.documentElement.scrollWidth > window.innerWidth + 1;
  out.bodyFont = cs(document.body).fontFamily.split(',')[0] + ' ' + px(cs(document.body).fontSize);
  return out;
}

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const result = [];
  for (const view of VIEWS) {
    const ctx = await browser.newContext({ viewport: { width: view.width, height: view.height }, colorScheme: view.scheme, locale: 'vi-VN' });
    const page = await ctx.newPage();
    await page.goto(BASE + '/login');
    await page.fill('input[type=text], input:not([type])', 'admin');
    await page.fill('input[type=password]', process.env.UISTD_PASSWORD);
    await page.click('button[type=submit]');
    await page.waitForTimeout(2500);
    for (const route of ROUTES) {
      let data;
      try {
        await page.goto(`${BASE}/${route}`, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(900);
        data = await page.evaluate(measure);
        await page.screenshot({ path: path.join(SHOTS, `${route.replace(/\//g, '_')}.${view.key}.png`) });
      } catch (e) { data = { error: String(e).slice(0, 120) }; }
      result.push({ route, view: view.key, url: page.url().replace(BASE, ''), ...data });
      process.stdout.write('.');
    }
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'measurements.json'), JSON.stringify(result, null, 1));
  console.log('\ndone', result.length);
})();
