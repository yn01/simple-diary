import { Request, Response, NextFunction } from 'express';
import { EntryService } from '../services/EntryService';

/**
 * EntryController - HTTP request/response handler for diary entries
 *
 * This controller handles all HTTP operations for diary entries,
 * delegating business logic to the EntryService.
 */
export class EntryController {
  private service: EntryService;

  constructor(service: EntryService) {
    this.service = service;
  }

  /**
   * Parses and validates an ID from request params
   * @param idString The ID string from request params
   * @returns The parsed ID or null if invalid
   */
  private parseId(idString: string): number | null {
    // Strict validation: only allow strings that consist entirely of digits
    if (!/^\d+$/.test(idString)) {
      return null;
    }
    const id = parseInt(idString, 10);
    if (!Number.isFinite(id) || id > Number.MAX_SAFE_INTEGER) {
      return null;
    }
    return id;
  }

  /**
   * POST /api/entries - Create a new entry
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { date, content } = req.body;
      const result = this.service.createEntry({ date, content });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/entries - Get all entries
   */
  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { year, month } = req.query;

      if (year !== undefined || month !== undefined) {
        if (year === undefined || month === undefined) {
          res.status(400).json({
            message: 'Validation error',
            details: ['Both year and month parameters are required'],
          });
          return;
        }

        const yearStr = String(year);
        const monthStr = String(month);

        if (!/^\d{4}$/.test(yearStr)) {
          res.status(400).json({
            message: 'Validation error',
            details: ['year must be a 4-digit integer'],
          });
          return;
        }

        if (!/^(0?[1-9]|1[0-2])$/.test(monthStr)) {
          res.status(400).json({
            message: 'Validation error',
            details: ['month must be an integer between 1 and 12'],
          });
          return;
        }

        const yearNum = parseInt(yearStr, 10);
        const monthNum = parseInt(monthStr, 10);

        const entries = this.service.getEntriesByMonth(yearNum, monthNum);
        res.status(200).json(entries);
        return;
      }

      const entries = this.service.getAllEntries();
      res.status(200).json(entries);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/entries/:id - Get entry by ID
   */
  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = this.parseId(req.params.id);
      if (id === null) {
        res.status(400).json({ message: 'Invalid ID format' });
        return;
      }

      const result = this.service.getEntryById(id);
      if (!result) {
        res.status(404).json({ message: 'Entry not found' });
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/entries/:id - Update an entry
   */
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = this.parseId(req.params.id);
      if (id === null) {
        res.status(400).json({ message: 'Invalid ID format' });
        return;
      }

      const { date, content } = req.body;
      const result = this.service.updateEntry(id, { date, content });
      if (!result) {
        res.status(404).json({ message: 'Entry not found' });
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/entries/:id - Delete an entry
   */
  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = this.parseId(req.params.id);
      if (id === null) {
        res.status(400).json({ message: 'Invalid ID format' });
        return;
      }

      const deleted = this.service.deleteEntry(id);
      if (!deleted) {
        res.status(404).json({ message: 'Entry not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/entries/search?q={keyword} - Search entries
   */
  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query.q;

      if (query === undefined) {
        res.status(400).json({
          message: 'Validation error',
          details: ["'q' parameter is required for search."],
        });
        return;
      }

      const entries = this.service.searchEntries(query as string);
      res.status(200).json(entries);
    } catch (error) {
      next(error);
    }
  };
}
