// Apocalypse (ดินแดนหายนะ) season bosses. Each season is its own detached island.
// Bosses that also exist as regular MVPs reuse that MVP's element, race, size and card data
// (`from` = source id). A boss with no MVP twin is derived as A − B + C (`from` = [A, B, C]):
// A gives race and size, C gives element, B has A's element and C's race. This reproduces all
// 24 checkable combinations in the dataset exactly. Bosses with no source are marked as pending.
(() => {
  const SEASONS = {
    // S1 แดนสุสานคำสาปมรณะ · 2026/10/3 – 2027/1/1. Names and portraits from the in-game season
    // screen; level is the source MVP's. Anubis = Pharaoh − Baphomet + Dark Lord, level unknown.
    S1: { bosses: [
      [90001, 'Amon Ra', 'เซ็นย์ตื่นบรรทม', 'a1', 80014],
      [90002, 'Pharaoh', 'ทราของราชาสุสา', 'a3', 80016],
      [90003, 'Bloody Knight', 'เงาโลหิตพิโรธ', 'a2', 80022],
      [90004, 'Dark Lord', 'จ้าวแห่งอเวจี', 'a4', 80018],
      [90005, 'Anubis', 'นัขยมโลกกลืนวิญ', 'a5', [80016, 40023, 80018]],
    ] },
    // S2 冰封海淵 (Frozen Abyss) · Taiwan server, 360 days, Lv100 bosses. Names follow the
    // matching MVP; Crystal Queen (幻晶女王) and Ancient Sea God (遠古海神) are translated.
    // Crystal Queen = Dracula − Atroce + Garm (Owl Baron − Phreeoni + Garm gives the same cards).
    S2: { lv: 100, bosses: [
      [90006, 'Stormy Knight', null, 'b1', 80025],
      [90007, 'Crystal Queen', null, 'b2', [80010, 80019, 80024]],
      [90008, 'Ancient Sea God', null, 'b3', 80008],
      [90009, 'Kraken', null, 'b4', 80008],
      [90010, 'Garm', null, 'b5', 80024],
    ] },
  };
  const byId = id => window.RO_DATA.find(b => b.id === id);
  const isElementTag = t => ['vs element', 'element taken', 'neutral rule'].includes(t) || t.startsWith('armor→') || t.endsWith(' dmg');
  function derive(A, B, C) {
    const slots = {};
    for (const s of Object.keys(A.slots)) {
      const cards = boss => new Map((boss.slots[s] || []).map(c => [c.name, c]));
      const a = cards(A), b = cards(B), c = cards(C), list = [];
      for (const name of new Set([...c.keys(), ...a.keys(), ...b.keys()])) {
        const ca = a.get(name), cb = b.get(name), cc = c.get(name);
        const score = k => Math.round(((ca?.[k] || 0) - (cb?.[k] || 0) + (cc?.[k] || 0)) * 10) / 10;
        const lo = score('lo'), hi = score('hi');
        if (!lo && !hi) continue;
        const why = [...new Set([...(ca?.why || []).filter(t => !isElementTag(t)), ...(cc?.why || []).filter(t => isElementTag(t) || !ca)])];
        list.push({ ...(ca || cc || cb), lo, hi, tier: hi < 0 ? 'bad' : 'alt', why });
      }
      slots[s] = list;
    }
    return { lv: null, race: A.race, el: C.el, size: A.size, col: C.col, best_el: C.best_el, el_bonus: C.el_bonus, slots };
  }
  const KEEP = ['lv', 'race', 'el', 'size', 'col', 'best_el', 'el_bonus', 'sum_lo', 'sum_hi', 'slots'];
  for (const [season, { lv, bosses }] of Object.entries(SEASONS)) for (const [id, name, th, file, from] of bosses) {
    const img = 'apoc_' + file, src = Array.isArray(from) ? derive(...from.map(byId)) : byId(from);
    window.RO_TEX[img] = 'assets/apocalypse/' + file + '.webp';
    const boss = { id, name, th, img, region: 'Apocalypse', season, from };
    if (src) KEEP.forEach(k => { boss[k] = src[k]; });
    else Object.assign(boss, { pending: true, col: {}, slots: {} });
    if (lv) boss.lv = lv;
    window.RO_DATA.push(boss);
  }
})();
