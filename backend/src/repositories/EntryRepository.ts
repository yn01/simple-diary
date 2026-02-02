import Database from 'better-sqlite3';
import { z } from 'zod';
import { Entry, CreateEntryRequest, UpdateEntryRequest } from '../models/Entry';

// ============================================================================
// Validation Schemas using Zod
// These schemas ensure data integrity and prevent invalid data from being stored
// ============================================================================

/**
 * Validates date strings in YYYY-MM-DD format
 * Also validates that the date is a real calendar date (e.g., no Feb 30th)
 */
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format',
  })
  .refine(
    (date) => {
      // Validate that the date is a real date
      const [year, month, day] = date.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      return (
        dateObj.getFullYear() === year &&
        dateObj.getMonth() === month - 1 &&
        dateObj.getDate() === day
      );
    },
    {
      message: 'Invalid date',
    }
  );

/**
 * Validates content strings
 * Must be non-empty and not only whitespace
 */
export const contentSchema = z
  .string()
  .min(1, {
    message: 'Content must not be empty',
  })
  .refine((content) => content.trim().length > 0, {
    message: 'Content must not be only whitespace',
  });

/**
 * Schema for creating a new entry
 */
export const createEntrySchema = z.object({
  date: dateSchema,
  content: contentSchema,
});

/**
 * Schema for updating an existing entry
 */
export const updateEntrySchema = z.object({
  date: dateSchema,
  content: contentSchema,
});

/**
 * Validates entry IDs
 * Must be an integer and not NaN
 */
export const idSchema = z
  .number()
  .int({
    message: 'ID must be an integer',
  })
  .refine((id) => !Number.isNaN(id), {
    message: 'ID must be a valid number',
  });

/**
 * Validates search keywords
 * Must be a string (null/undefined not allowed)
 */
export const searchKeywordSchema = z.string({
  required_error: 'Search keyword is required',
  invalid_type_error: 'Search keyword must be a string',
});

export class EntryRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Creates a new entry
   * @param request The entry data to create
   * @returns The created entry
   * @throws ZodError if validation fails
   */
  create(request: CreateEntryRequest): Entry {
    // Validate input
    const validatedData = createEntrySchema.parse(request);

    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO entries (date, content, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(validatedData.date, validatedData.content, now, now);

    return {
      id: result.lastInsertRowid as number,
      date: validatedData.date,
      content: validatedData.content,
      created_at: now,
      updated_at: now,
    };
  }

  /**
   * Retrieves all entries sorted by date descending
   * @returns Array of all entries
   */
  findAll(): Entry[] {
    const stmt = this.db.prepare(`
      SELECT id, date, content, created_at, updated_at
      FROM entries
      ORDER BY date DESC, id DESC
    `);

    return stmt.all() as Entry[];
  }

  /**
   * Finds an entry by its ID
   * @param id The entry ID
   * @returns The entry if found, null otherwise
   * @throws ZodError if id is not a valid integer
   */
  findById(id: number): Entry | null {
    // Validate ID
    idSchema.parse(id);

    if (id <= 0) {
      return null;
    }

    const stmt = this.db.prepare(`
      SELECT id, date, content, created_at, updated_at
      FROM entries
      WHERE id = ?
    `);

    const entry = stmt.get(id) as Entry | undefined;
    return entry || null;
  }

  /**
   * Updates an existing entry
   * @param id The entry ID
   * @param request The updated entry data
   * @returns The updated entry if found, null otherwise
   * @throws ZodError if validation fails
   */
  update(id: number, request: UpdateEntryRequest): Entry | null {
    // Validate input
    idSchema.parse(id);
    const validatedData = updateEntrySchema.parse(request);

    // Check if entry exists
    const existing = this.findById(id);
    if (!existing) {
      return null;
    }

    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      UPDATE entries
      SET date = ?, content = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(validatedData.date, validatedData.content, now, id);

    return {
      id: existing.id,
      date: validatedData.date,
      content: validatedData.content,
      created_at: existing.created_at,
      updated_at: now,
    };
  }

  /**
   * Deletes an entry by its ID
   * @param id The entry ID
   * @returns true if entry was deleted, false if not found
   */
  delete(id: number): boolean {
    if (typeof id !== 'number' || Number.isNaN(id) || id <= 0) {
      return false;
    }

    const stmt = this.db.prepare(`
      DELETE FROM entries
      WHERE id = ?
    `);

    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Searches entries by keyword using LIKE (case-insensitive)
   * @param keyword The search keyword
   * @returns Array of matching entries sorted by date descending
   * @throws ZodError if keyword is null or undefined
   */
  search(keyword: string): Entry[] {
    // Validate keyword
    searchKeywordSchema.parse(keyword);

    // Escape special LIKE characters to prevent SQL pattern matching issues
    const escapedKeyword = keyword.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');

    const stmt = this.db.prepare(`
      SELECT id, date, content, created_at, updated_at
      FROM entries
      WHERE content LIKE ? ESCAPE '\\'
      ORDER BY date DESC, id DESC
    `);

    // Use parameterized query to prevent SQL injection
    const searchPattern = `%${escapedKeyword}%`;
    return stmt.all(searchPattern) as Entry[];
  }
}
