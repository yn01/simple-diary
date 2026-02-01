import { EntryRepository } from '../repositories/EntryRepository';
import { Entry, CreateEntryRequest, UpdateEntryRequest } from '../models/Entry';

/**
 * EntryService - Business logic layer for diary entries
 *
 * This service encapsulates all business logic related to diary entries,
 * delegating data access to the EntryRepository.
 */
export class EntryService {
  private repository: EntryRepository;

  constructor(repository: EntryRepository) {
    this.repository = repository;
  }

  /**
   * Creates a new entry
   * @param request The entry data to create
   * @returns The created entry
   * @throws ZodError if validation fails
   */
  createEntry(request: CreateEntryRequest): Entry {
    return this.repository.create(request);
  }

  /**
   * Retrieves all entries sorted by date descending
   * @returns Array of all entries
   */
  getAllEntries(): Entry[] {
    return this.repository.findAll();
  }

  /**
   * Finds an entry by its ID
   * @param id The entry ID
   * @returns The entry if found, null otherwise
   * @throws ZodError if id is not a valid integer
   */
  getEntryById(id: number): Entry | null {
    return this.repository.findById(id);
  }

  /**
   * Updates an existing entry
   * @param id The entry ID
   * @param request The updated entry data
   * @returns The updated entry if found, null otherwise
   * @throws ZodError if validation fails
   */
  updateEntry(id: number, request: UpdateEntryRequest): Entry | null {
    return this.repository.update(id, request);
  }

  /**
   * Deletes an entry by its ID
   * @param id The entry ID
   * @returns true if entry was deleted, false if not found
   */
  deleteEntry(id: number): boolean {
    return this.repository.delete(id);
  }

  /**
   * Searches entries by keyword
   * @param keyword The search keyword
   * @returns Array of matching entries sorted by date descending
   * @throws ZodError if keyword is null or undefined
   */
  searchEntries(keyword: string): Entry[] {
    return this.repository.search(keyword);
  }
}
