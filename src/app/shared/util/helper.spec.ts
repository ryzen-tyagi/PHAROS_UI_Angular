import { dateTimeFormatter, modeStyles } from './helper';

describe('dateTimeFormatter', () => {
  it('returns "-" for empty/falsy input', () => {
    expect(dateTimeFormatter('')).toBe('-');
    expect(dateTimeFormatter(null)).toBe('-');
    expect(dateTimeFormatter(undefined)).toBe('-');
  });

  it('formats a known UTC ISO time to a PST string', () => {
    // 2024-01-15T20:30:00Z → PST (UTC-8) is 2024-01-15 12:30:00
    const out = dateTimeFormatter('2024-01-15T20:30:00Z');
    expect(out).toContain('01/15/2024');
    expect(out).toContain('12:30:00');
  });
});

describe('modeStyles', () => {
  it('has the four expected mode keys', () => {
    expect(Object.keys(modeStyles)).toContain('Simulation');
    expect(Object.keys(modeStyles)).toContain('Live');
    expect(Object.keys(modeStyles)).toContain('Maintenance');
    expect(Object.keys(modeStyles)).toContain('Safety Bypass');
  });

  it('each style exposes text/border/bg', () => {
    for (const key of Object.keys(modeStyles)) {
      const s = modeStyles[key];
      expect(s.text).toBeTruthy();
      expect(s.border).toBeTruthy();
      expect(s.bg).toBeTruthy();
    }
  });
});
