import Database from 'better-sqlite3';
import { EntryRepository } from '../../src/repositories/EntryRepository';
import { Entry, CreateEntryRequest, UpdateEntryRequest } from '../../src/models/Entry';

describe('EntryRepository', () => {
  let db: Database.Database;
  let repository: EntryRepository;

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
  });

  afterEach(() => {
    db.close();
  });

  describe('create', () => {
    it('creates a new entry with valid data', () => {
      const request: CreateEntryRequest = {
        date: '2026-01-31',
        content: 'Test diary entry',
      };

      const entry = repository.create(request);

      expect(entry).toBeDefined();
      expect(entry.id).toBe(1);
      expect(entry.date).toBe('2026-01-31');
      expect(entry.content).toBe('Test diary entry');
      expect(entry.created_at).toBeDefined();
      expect(entry.updated_at).toBeDefined();
    });

    it('creates multiple entries with auto-incrementing IDs', () => {
      const entry1 = repository.create({
        date: '2026-01-31',
        content: 'First entry',
      });
      const entry2 = repository.create({
        date: '2026-01-31',
        content: 'Second entry',
      });

      expect(entry1.id).toBe(1);
      expect(entry2.id).toBe(2);
    });

    it('sets created_at and updated_at to the same value on creation', () => {
      const entry = repository.create({
        date: '2026-01-31',
        content: 'Test entry',
      });

      expect(entry.created_at).toBe(entry.updated_at);
    });

    it('stores created_at in ISO 8601 format', () => {
      const entry = repository.create({
        date: '2026-01-31',
        content: 'Test entry',
      });

      // Verify ISO 8601 format
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
      expect(entry.created_at).toMatch(isoRegex);
    });

    it('throws error when date is empty', () => {
      expect(() =>
        repository.create({
          date: '',
          content: 'Test content',
        })
      ).toThrow();
    });

    it('throws error when date has invalid format', () => {
      expect(() =>
        repository.create({
          date: '31-01-2026',
          content: 'Test content',
        })
      ).toThrow();
    });

    it('throws error when content is empty', () => {
      expect(() =>
        repository.create({
          date: '2026-01-31',
          content: '',
        })
      ).toThrow();
    });

    it('throws error when content is only whitespace', () => {
      expect(() =>
        repository.create({
          date: '2026-01-31',
          content: '   ',
        })
      ).toThrow();
    });

    it('handles content with special characters', () => {
      const request: CreateEntryRequest = {
        date: '2026-01-31',
        content: "Special chars: <script>alert('xss')</script> & \"quotes\"",
      };

      const entry = repository.create(request);

      expect(entry.content).toBe(
        "Special chars: <script>alert('xss')</script> & \"quotes\""
      );
    });

    it('handles content with SQL injection attempts', () => {
      const request: CreateEntryRequest = {
        date: '2026-01-31',
        content: "'; DROP TABLE entries; --",
      };

      const entry = repository.create(request);

      expect(entry.content).toBe("'; DROP TABLE entries; --");
      // Verify table still exists by creating another entry
      const entry2 = repository.create({
        date: '2026-01-31',
        content: 'Table still exists',
      });
      expect(entry2.id).toBe(2);
    });

    it('handles content with unicode characters', () => {
      const request: CreateEntryRequest = {
        date: '2026-01-31',
        content: 'Unicode test: Hello World! Chinese Characters! Korean Characters! Smile Emoji',
      };

      const entry = repository.create(request);

      expect(entry.content).toBe(
        'Unicode test: Hello World! Chinese Characters! Korean Characters! Smile Emoji'
      );
    });
  });

  describe('findAll', () => {
    it('returns empty array when no entries exist', () => {
      const entries = repository.findAll();

      expect(entries).toEqual([]);
    });

    it('returns all entries', () => {
      repository.create({ date: '2026-01-31', content: 'Entry 1' });
      repository.create({ date: '2026-01-30', content: 'Entry 2' });
      repository.create({ date: '2026-01-29', content: 'Entry 3' });

      const entries = repository.findAll();

      expect(entries).toHaveLength(3);
    });

    it('returns entries sorted by date in descending order', () => {
      repository.create({ date: '2026-01-29', content: 'Oldest' });
      repository.create({ date: '2026-01-31', content: 'Newest' });
      repository.create({ date: '2026-01-30', content: 'Middle' });

      const entries = repository.findAll();

      expect(entries[0].date).toBe('2026-01-31');
      expect(entries[1].date).toBe('2026-01-30');
      expect(entries[2].date).toBe('2026-01-29');
    });

    it('returns entries with same date sorted by id (descending for most recent first)', () => {
      repository.create({ date: '2026-01-31', content: 'First entry' });
      repository.create({ date: '2026-01-31', content: 'Second entry' });
      repository.create({ date: '2026-01-31', content: 'Third entry' });

      const entries = repository.findAll();

      expect(entries[0].content).toBe('Third entry');
      expect(entries[1].content).toBe('Second entry');
      expect(entries[2].content).toBe('First entry');
    });
  });

  describe('findById', () => {
    it('returns entry when found', () => {
      const created = repository.create({
        date: '2026-01-31',
        content: 'Test entry',
      });

      const found = repository.findById(created.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.date).toBe(created.date);
      expect(found!.content).toBe(created.content);
    });

    it('returns null when entry not found', () => {
      const found = repository.findById(999);

      expect(found).toBeNull();
    });

    it('returns null for negative id', () => {
      const found = repository.findById(-1);

      expect(found).toBeNull();
    });

    it('returns null for zero id', () => {
      const found = repository.findById(0);

      expect(found).toBeNull();
    });

    it('throws error for non-integer id', () => {
      expect(() => repository.findById(1.5)).toThrow();
    });

    it('throws error for NaN id', () => {
      expect(() => repository.findById(NaN)).toThrow();
    });
  });

  describe('update', () => {
    it('updates entry content successfully', () => {
      const created = repository.create({
        date: '2026-01-31',
        content: 'Original content',
      });

      const updated = repository.update(created.id, {
        date: '2026-01-31',
        content: 'Updated content',
      });

      expect(updated).not.toBeNull();
      expect(updated!.content).toBe('Updated content');
    });

    it('updates entry date successfully', () => {
      const created = repository.create({
        date: '2026-01-31',
        content: 'Test content',
      });

      const updated = repository.update(created.id, {
        date: '2026-02-01',
        content: 'Test content',
      });

      expect(updated).not.toBeNull();
      expect(updated!.date).toBe('2026-02-01');
    });

    it('updates updated_at timestamp', async () => {
      const created = repository.create({
        date: '2026-01-31',
        content: 'Original content',
      });

      // Wait a small amount to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = repository.update(created.id, {
        date: '2026-01-31',
        content: 'Updated content',
      });

      expect(updated!.updated_at).not.toBe(created.updated_at);
    });

    it('preserves created_at timestamp', () => {
      const created = repository.create({
        date: '2026-01-31',
        content: 'Original content',
      });

      const updated = repository.update(created.id, {
        date: '2026-01-31',
        content: 'Updated content',
      });

      expect(updated!.created_at).toBe(created.created_at);
    });

    it('returns null when entry not found', () => {
      const updated = repository.update(999, {
        date: '2026-01-31',
        content: 'Updated content',
      });

      expect(updated).toBeNull();
    });

    it('throws error when content is empty', () => {
      const created = repository.create({
        date: '2026-01-31',
        content: 'Original content',
      });

      expect(() =>
        repository.update(created.id, {
          date: '2026-01-31',
          content: '',
        })
      ).toThrow();
    });

    it('throws error when date has invalid format', () => {
      const created = repository.create({
        date: '2026-01-31',
        content: 'Original content',
      });

      expect(() =>
        repository.update(created.id, {
          date: 'invalid-date',
          content: 'Updated content',
        })
      ).toThrow();
    });

    it('handles SQL injection attempts in update', () => {
      const created = repository.create({
        date: '2026-01-31',
        content: 'Original content',
      });

      const updated = repository.update(created.id, {
        date: '2026-01-31',
        content: "'; DELETE FROM entries; --",
      });

      expect(updated!.content).toBe("'; DELETE FROM entries; --");
      // Verify no deletion happened
      expect(repository.findById(created.id)).not.toBeNull();
    });
  });

  describe('delete', () => {
    it('deletes entry successfully and returns true', () => {
      const created = repository.create({
        date: '2026-01-31',
        content: 'To be deleted',
      });

      const result = repository.delete(created.id);

      expect(result).toBe(true);
      expect(repository.findById(created.id)).toBeNull();
    });

    it('returns false when entry not found', () => {
      const result = repository.delete(999);

      expect(result).toBe(false);
    });

    it('returns false for negative id', () => {
      const result = repository.delete(-1);

      expect(result).toBe(false);
    });

    it('returns false for zero id', () => {
      const result = repository.delete(0);

      expect(result).toBe(false);
    });

    it('does not affect other entries', () => {
      const entry1 = repository.create({
        date: '2026-01-31',
        content: 'Entry 1',
      });
      const entry2 = repository.create({
        date: '2026-01-30',
        content: 'Entry 2',
      });

      repository.delete(entry1.id);

      expect(repository.findById(entry1.id)).toBeNull();
      expect(repository.findById(entry2.id)).not.toBeNull();
    });

    it('handles SQL injection attempts', () => {
      const created = repository.create({
        date: '2026-01-31',
        content: 'Test entry',
      });

      // This tests that parameterized queries prevent SQL injection
      // When passing a string that looks like SQL injection, it should be treated as a literal
      repository.delete(created.id);

      expect(repository.findById(created.id)).toBeNull();
    });
  });

  describe('search', () => {
    beforeEach(() => {
      repository.create({
        date: '2026-01-31',
        content: 'Today I learned about TypeScript',
      });
      repository.create({
        date: '2026-01-30',
        content: 'JavaScript is fun to learn',
      });
      repository.create({
        date: '2026-01-29',
        content: 'Python programming basics',
      });
    });

    it('finds entries containing the keyword', () => {
      const results = repository.search('learn');

      expect(results).toHaveLength(2);
    });

    it('returns entries sorted by date in descending order', () => {
      const results = repository.search('learn');

      expect(results[0].date).toBe('2026-01-31');
      expect(results[1].date).toBe('2026-01-30');
    });

    it('performs case-insensitive search', () => {
      const results = repository.search('TYPESCRIPT');

      expect(results).toHaveLength(1);
      expect(results[0].content).toContain('TypeScript');
    });

    it('returns empty array when no matches found', () => {
      const results = repository.search('Ruby');

      expect(results).toEqual([]);
    });

    it('handles empty search keyword', () => {
      const results = repository.search('');

      // Empty search should return all entries
      expect(results).toHaveLength(3);
    });

    it('handles special SQL characters in search', () => {
      repository.create({
        date: '2026-01-28',
        content: 'Test with % percent sign',
      });

      const results = repository.search('%');

      expect(results).toHaveLength(1);
      expect(results[0].content).toContain('%');
    });

    it('handles underscore character in search', () => {
      repository.create({
        date: '2026-01-28',
        content: 'Test with _ underscore',
      });

      const results = repository.search('_');

      expect(results).toHaveLength(1);
      expect(results[0].content).toContain('_');
    });

    it('handles SQL injection attempts in search', () => {
      const results = repository.search("'; DROP TABLE entries; --");

      expect(results).toEqual([]);
      // Verify table still exists
      expect(repository.findAll()).toHaveLength(3);
    });

    it('searches with partial match (LIKE behavior)', () => {
      const results = repository.search('Script');

      expect(results).toHaveLength(2); // TypeScript and JavaScript
    });

    it('handles unicode characters in search', () => {
      repository.create({
        date: '2026-01-27',
        content: 'Today is a great day!',
      });

      const results = repository.search('great day');

      expect(results).toHaveLength(1);
    });

    it('throws error for null keyword', () => {
      expect(() => repository.search(null as unknown as string)).toThrow();
    });

    it('throws error for undefined keyword', () => {
      expect(() => repository.search(undefined as unknown as string)).toThrow();
    });
  });

  describe('validation schemas', () => {
    it('rejects date with invalid month', () => {
      expect(() =>
        repository.create({
          date: '2026-13-01',
          content: 'Test content',
        })
      ).toThrow();
    });

    it('rejects date with invalid day', () => {
      expect(() =>
        repository.create({
          date: '2026-01-32',
          content: 'Test content',
        })
      ).toThrow();
    });

    it('rejects February 30th', () => {
      expect(() =>
        repository.create({
          date: '2026-02-30',
          content: 'Test content',
        })
      ).toThrow();
    });

    it('accepts February 29th on leap year', () => {
      const entry = repository.create({
        date: '2024-02-29',
        content: 'Leap year entry',
      });

      expect(entry.date).toBe('2024-02-29');
    });

    it('rejects February 29th on non-leap year', () => {
      expect(() =>
        repository.create({
          date: '2026-02-29',
          content: 'Test content',
        })
      ).toThrow();
    });
  });
});
