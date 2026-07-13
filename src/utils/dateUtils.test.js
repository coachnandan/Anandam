import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import {
  getISTDateString,
  getISTTimeString,
  getISTDisplayDate,
  getDaysDifferenceIST,
  getStartOfWeekIST,
  getISTShortDisplayDate
} from './dateUtils';

describe('dateUtils', () => {
  beforeAll(() => {
    // Mock system time to a fixed UTC time so we can reliably test IST outputs
    // '2026-07-12T18:15:00.000Z' UTC is '2026-07-12T23:45:00.000+05:30' IST
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-12T18:15:00.000Z'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('getISTDateString formats current date to YYYY-MM-DD in IST', () => {
    expect(getISTDateString()).toBe('2026-07-12');
  });

  it('getISTDateString formats specific date to YYYY-MM-DD in IST', () => {
    // '2026-07-12T20:00:00.000Z' UTC is '2026-07-13T01:30:00.000+05:30' IST
    expect(getISTDateString(new Date('2026-07-12T20:00:00.000Z'))).toBe('2026-07-13');
  });

  it('getISTTimeString formats time correctly', () => {
    expect(getISTTimeString()).toMatch(/11:45 PM/i);
  });

  it('getISTDisplayDate formats display date correctly', () => {
    expect(getISTDisplayDate()).toBe('12 July 2026');
  });

  it('getDaysDifferenceIST calculates days accurately', () => {
    expect(getDaysDifferenceIST('2026-07-15')).toBe(3);
    expect(getDaysDifferenceIST('2026-07-10')).toBe(-2);
  });

  it('getStartOfWeekIST gets correct Sunday for a date', () => {
    // July 12, 2026 is a Sunday. The start of the week should be July 12.
    expect(getStartOfWeekIST()).toBe('2026-07-12');
    // July 15, 2026 is Wednesday. Start of week should be July 12.
    expect(getStartOfWeekIST(new Date('2026-07-15T12:00:00Z'))).toBe('2026-07-12');
  });

  it('getISTShortDisplayDate formats short display date', () => {
    expect(getISTShortDisplayDate()).toBe('12 Jul 2026');
  });
});
