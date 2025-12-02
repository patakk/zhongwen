const toneMarks = {
  'ā': 0, 'ē': 0, 'ī': 0, 'ō': 0, 'ū': 0, 'ǖ': 0,
  'á': 1, 'é': 1, 'í': 1, 'ó': 1, 'ú': 1, 'ǘ': 1,
  'ǎ': 2, 'ě': 2, 'ǐ': 2, 'ǒ': 2, 'ǔ': 2, 'ǚ': 2,
  'à': 3, 'è': 3, 'ì': 3, 'ò': 3, 'ù': 3, 'ǜ': 3
};

export function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function getTonePalette(palette = 'default') {
  const base = ['var(--first-t)', 'var(--second-t)', 'var(--third-t)', 'var(--fourth-t)', 'var(--neutral-t)'];
  const alt = ['var(--first-t-p)', 'var(--second-t-p)', 'var(--third-t-p)', 'var(--fourth-t-p)', 'var(--neutral-t-p)'];
  return palette === 'alt' ? alt : base;
}

export function getToneFromPinyin(pinyin) {
  if (!pinyin) return 4;
  for (const char of pinyin) {
    if (char in toneMarks) return toneMarks[char];
  }
  const toneNumber = String(pinyin).match(/[1-5]/);
  if (toneNumber) {
    const num = Number(toneNumber[0]);
    if (num >= 1 && num <= 4) return num - 1;
    if (num === 5) return 4;
  }
  return 4;
}

export function getToneColor(pinyin, palette = getTonePalette()) {
  const tone = getToneFromPinyin(pinyin);
  return palette[tone] || 'var(--fg)';
}

export function colorizePinyin(pinyin, { enabled = true, palette = 'default' } = {}) {
  const text = String(pinyin || '');
  const syllables = text.trim().split(/\s+/).filter(Boolean);
  if (!syllables.length) return escapeHtml(text);
  const colors = getTonePalette(palette);
  return syllables.map(syllable => {
    if (!enabled) return escapeHtml(syllable);
    const color = getToneColor(syllable, colors);
    return `<span style="color:${color}">${escapeHtml(syllable)}</span>`;
  }).join(' ');
}

export function colorizeHanzi(hanzi, pinyin, { enabled = true, palette = 'default' } = {}) {
  const chars = Array.from(hanzi || '');
  if (!chars.length) return escapeHtml(hanzi || '');
  const syllables = String(pinyin || '').trim().split(/\s+/).filter(Boolean);
  const colors = getTonePalette(palette);
  return chars.map((ch, idx) => {
    const syllable = syllables.length ? (syllables[idx] || syllables[syllables.length - 1]) : '';
    if (!enabled) return escapeHtml(ch);
    const color = getToneColor(syllable, colors);
    return `<span class="hanzi-link-char" style="color:${color}; font-family: var(--main-word-font)">${escapeHtml(ch)}</span>`;
  }).join('');
}
