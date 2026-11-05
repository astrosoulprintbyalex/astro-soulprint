const test = require('node:test');
const assert = require('node:assert');
const S = require('../studio/sales/sales.js');

const sale = (date, amount, status = 'paid', pkg = 'HD Love') => ({ id: date + amount, date, client: 'A', pkg, amount, status });

test('cleanSale rejects bad dates and amounts, defaults status', () => {
  assert.equal(S.cleanSale({ date: '2026-02-30', amount: 5 }), null);
  assert.equal(S.cleanSale({ date: '2026-11-05', amount: 'x' }), null);
  assert.equal(S.cleanSale({ date: '2026-11-05', amount: -1 }), null);
  const c = S.cleanSale({ date: '2026-11-05', amount: '444.4', client: '  Mya ', status: 'weird' });
  assert.equal(c.amount, 444);
  assert.equal(c.client, 'Mya');
  assert.equal(c.status, 'pending');
});

test('monthSummary splits paid from open and ignores other months', () => {
  const s = [sale('2026-11-01', 1000), sale('2026-11-09', 500, 'deposit'), sale('2026-10-30', 9999)];
  assert.deepEqual(S.monthSummary(s, '2026-11'), { count: 2, total: 1500, paid: 1000, open: 500 });
});

test('byPackage groups and sorts by total', () => {
  const s = [sale('2026-11-01', 444, 'paid', 'A'), sale('2026-11-02', 1222, 'paid', 'B'), sale('2026-11-03', 444, 'paid', 'A'), sale('2026-10-03', 5, 'paid', 'C')];
  assert.deepEqual(S.byPackage(s, '2026-11'), [
    { pkg: 'B', count: 1, total: 1222 }, { pkg: 'A', count: 2, total: 888 }]);
});

test('history is newest first and always includes the current month', () => {
  const h = S.history([sale('2026-09-01', 10), sale('2026-10-01', 20)], '2026-11', 12);
  assert.deepEqual(h.map(x => x.key), ['2026-11', '2026-10', '2026-09']);
  assert.equal(h[0].total, 0);
  assert.equal(S.history([], '2026-11', 12).length, 1);
});

test('ringOffset caps at full and handles zero', () => {
  assert.equal(S.ringOffset(0, 50000, 100), 100);
  assert.equal(S.ringOffset(25000, 50000, 100), 50);
  assert.equal(S.ringOffset(90000, 50000, 100), 0);
  assert.equal(S.ringOffset(5, 0, 100), 100);
});

test('parseBackup round-trips, accepts plain arrays, skips junk, rejects non-backups', () => {
  const sales = [sale('2026-11-01', 444)];
  const r = S.parseBackup(JSON.stringify({ goal: 60000, sales: [...sales, { nope: 1 }] }));
  assert.equal(r.sales.length, 1);
  assert.equal(r.skipped, 1);
  assert.equal(r.goal, 60000);
  assert.equal(S.parseBackup(JSON.stringify(sales)).sales.length, 1);
  assert.throws(() => S.parseBackup('not json'));
  assert.throws(() => S.parseBackup('{"a":1}'));
});

test('package list has valid unique names', () => {
  const names = S.PACKAGES.map(p => p.name);
  assert.equal(new Set(names).size, names.length);
});
