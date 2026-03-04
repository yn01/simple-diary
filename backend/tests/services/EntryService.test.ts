import Database from 'better-sqlite3';
import { EntryService } from '../../src/services/EntryService';
import { EntryRepository } from '../../src/repositories/EntryRepository';
import { CreateEntryRequest } from '../../src/models/Entry';

describe('EntryService', () => {
  let db: Database.Database;
  let repository: EntryRepository;
  let service: EntryService;

  beforeEach(() => {
    // Create in-memory database for testing
    db = new Database(':memory:');

    // Initialize schema
    db.exec(`
      CREATE TABLE entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    db.exec(`CREATE INDEX idx_entries_date ON entries(date DESC)`);

    repository = new EntryRepository(db);
    service = new EntryService(repository);
  });

  afterEach(() => {
    db.close();
  });

  describe('createEntry', () => {
    it('creates a new entry and returns it', () => {
      const request: CreateEntryRequest = {
        date: '2026-01-31',
        content: 'Test diary entry',
      };

      const result = service.createEntry(request);

      expect(result.id).toBe(1);
      expect(result.date).toBe('2026-01-31');
      expect(result.content).toBe('Test diary entry');
    });

    it('throws validation error for empty content', () => {
      const request: CreateEntryRequest = {
        date: '2026-01-31',
        content: '',
      };

      expect(() => service.createEntry(request)).toThrow();
    });

    it('throws validation error for invalid date format', () => {
      const request: CreateEntryRequest = {
        date: 'invalid-date',
        content: 'Test content',
      };

      expect(() => service.createEntry(request)).toThrow();
    });

    it('throws validation error for whitespace-only content', () => {
      const request: CreateEntryRequest = {
        date: '2026-01-31',
        content: '   ',
      };

      expect(() => service.createEntry(request)).toThrow();
    });
  });

  describe('getAllEntries', () => {
    it('returns empty array when no entries exist', () => {
      const result = service.getAllEntries();

      expect(result).toEqual([]);
    });

    it('returns all entries sorted by date descending', () => {
      service.createEntry({ date: '2026-01-29', content: 'Entry 1' });
      service.createEntry({ date: '2026-01-31', content: 'Entry 2' });
      service.createEntry({ date: '2026-01-30', content: 'Entry 3' });

      const result = service.getAllEntries();

      expect(result).toHaveLength(3);
      expect(result[0].date).toBe('2026-01-31');
      expect(result[1].date).toBe('2026-01-30');
      expect(result[2].date).toBe('2026-01-29');
    });
  });

  describe('getEntryById', () => {
    it('returns entry when found', () => {
      const created = service.createEntry({
        date: '2026-01-31',
        content: 'Test entry',
      });

      const result = service.getEntryById(created.id);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(created.id);
    });

    it('returns null when entry not found', () => {
      const result = service.getEntryById(999);

      expect(result).toBeNull();
    });

    it('returns null for invalid id (negative)', () => {
      const result = service.getEntryById(-1);

      expect(result).toBeNull();
    });

    it('returns null for invalid id (zero)', () => {
      const result = service.getEntryById(0);

      expect(result).toBeNull();
    });

    it('throws error for non-integer id', () => {
      expect(() => service.getEntryById(1.5)).toThrow();
    });

    it('throws error for NaN id', () => {
      expect(() => service.getEntryById(NaN)).toThrow();
    });
  });

  describe('updateEntry', () => {
    it('updates entry and returns it', () => {
      const created = service.createEntry({
        date: '2026-01-31',
        content: 'Original content',
      });

      const result = service.updateEntry(created.id, {
        date: '2026-01-31',
        content: 'Updated content',
      });

      expect(result).not.toBeNull();
      expect(result!.content).toBe('Updated content');
    });

    it('updates both date and content', () => {
      const created = service.createEntry({
        date: '2026-01-31',
        content: 'Original content',
      });

      const result = service.updateEntry(created.id, {
        date: '2026-02-01',
        content: 'Updated content',
      });

      expect(result).not.toBeNull();
      expect(result!.date).toBe('2026-02-01');
      expect(result!.content).toBe('Updated content');
    });

    it('returns null when entry not found', () => {
      const result = service.updateEntry(999, {
        date: '2026-01-31',
        content: 'Updated content',
      });

      expect(result).toBeNull();
    });

    it('throws validation error for empty content', () => {
      const created = service.createEntry({
        date: '2026-01-31',
        content: 'Original content',
      });

      expect(() =>
        service.updateEntry(created.id, {
          date: '2026-01-31',
          content: '',
        })
      ).toThrow();
    });

    it('throws validation error for invalid date format', () => {
      const created = service.createEntry({
        date: '2026-01-31',
        content: 'Original content',
      });

      expect(() =>
        service.updateEntry(created.id, {
          date: 'invalid-date',
          content: 'Updated content',
        })
      ).toThrow();
    });
  });

  describe('deleteEntry', () => {
    it('deletes entry and returns true', () => {
      const created = service.createEntry({
        date: '2026-01-31',
        content: 'To be deleted',
      });

      const result = service.deleteEntry(created.id);

      expect(result).toBe(true);
      expect(service.getEntryById(created.id)).toBeNull();
    });

    it('returns false when entry not found', () => {
      const result = service.deleteEntry(999);

      expect(result).toBe(false);
    });

    it('returns false for invalid id (negative)', () => {
      const result = service.deleteEntry(-1);

      expect(result).toBe(false);
    });

    it('returns false for invalid id (zero)', () => {
      const result = service.deleteEntry(0);

      expect(result).toBe(false);
    });
  });

  describe('searchEntries', () => {
    beforeEach(() => {
      service.createEntry({
        date: '2026-01-31',
        content: 'Today I learned about TypeScript',
      });
      service.createEntry({
        date: '2026-01-30',
        content: 'JavaScript is fun to learn',
      });
      service.createEntry({
        date: '2026-01-29',
        content: 'Python programming basics',
      });
    });

    it('returns matching entries sorted by date descending', () => {
      const result = service.searchEntries('learn');

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2026-01-31');
      expect(result[1].date).toBe('2026-01-30');
    });

    it('performs case-insensitive search', () => {
      const result = service.searchEntries('TYPESCRIPT');

      expect(result).toHaveLength(1);
      expect(result[0].content).toContain('TypeScript');
    });

    it('returns empty array when no matches found', () => {
      const result = service.searchEntries('Ruby');

      expect(result).toEqual([]);
    });

    it('returns all entries for empty search keyword', () => {
      const result = service.searchEntries('');

      expect(result).toHaveLength(3);
    });

    it('throws error for null keyword', () => {
      expect(() => service.searchEntries(null as unknown as string)).toThrow();
    });

    it('throws error for undefined keyword', () => {
      expect(() => service.searchEntries(undefined as unknown as string)).toThrow();
    });

    it('handles special SQL characters safely', () => {
      service.createEntry({
        date: '2026-01-28',
        content: 'Test with % and _ special chars',
      });

      const resultPercent = service.searchEntries('%');
      expect(resultPercent).toHaveLength(1);

      const resultUnderscore = service.searchEntries('_');
      expect(resultUnderscore).toHaveLength(1);
    });
  });

  describe('getEntriesByMonth', () => {
    beforeEach(() => {
      service.createEntry({ date: '2024-01-15', content: 'January entry' });
      service.createEntry({ date: '2024-03-01', content: 'March entry 1' });
      service.createEntry({ date: '2024-03-20', content: 'March entry 2' });
      service.createEntry({ date: '2024-12-31', content: 'December entry' });
    });

    it('returns entries for the specified month', () => {
      const entries = service.getEntriesByMonth(2024, 3);
      expect(entries).toHaveLength(2);
      entries.forEach((e) => expect(e.date.startsWith('2024-03')).toBe(true));
    });

    it('returns entries for month=1 (boundary)', () => {
      const entries = service.getEntriesByMonth(2024, 1);
      expect(entries).toHaveLength(1);
      expect(entries[0].content).toBe('January entry');
    });

    it('returns entries for month=12 (boundary)', () => {
      const entries = service.getEntriesByMonth(2024, 12);
      expect(entries).toHaveLength(1);
      expect(entries[0].content).toBe('December entry');
    });

    it('returns empty array when no entries match', () => {
      const entries = service.getEntriesByMonth(2024, 7);
      expect(entries).toHaveLength(0);
    });

    it('throws error for month=0', () => {
      expect(() => service.getEntriesByMonth(2024, 0)).toThrow(
        'month must be an integer between 1 and 12'
      );
    });

    it('throws error for month=13', () => {
      expect(() => service.getEntriesByMonth(2024, 13)).toThrow(
        'month must be an integer between 1 and 12'
      );
    });

    it('throws error for non-integer year', () => {
      expect(() => service.getEntriesByMonth(20.5, 3)).toThrow('year must be a 4-digit integer');
    });

    it('throws error for year < 1000', () => {
      expect(() => service.getEntriesByMonth(999, 3)).toThrow('year must be a 4-digit integer');
    });

    it('throws error for year > 9999', () => {
      expect(() => service.getEntriesByMonth(10000, 3)).toThrow('year must be a 4-digit integer');
    });
  });
});
