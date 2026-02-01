import { Router } from 'express';
import { EntryController } from '../controllers/EntryController';
import { EntryService } from '../services/EntryService';
import { EntryRepository } from '../repositories/EntryRepository';
import { db } from '../database';
import {
  validateRequest,
  createEntryBodySchema,
  updateEntryBodySchema,
} from '../middlewares/validateRequest';

// Initialize dependencies
const repository = new EntryRepository(db);
const service = new EntryService(repository);
const controller = new EntryController(service);

// Create router
const router = Router();

/**
 * GET /api/entries/search - Search entries
 * Must be defined before :id route to prevent 'search' being treated as an id
 */
router.get('/search', controller.search);

/**
 * POST /api/entries - Create a new entry
 */
router.post('/', validateRequest(createEntryBodySchema), controller.create);

/**
 * GET /api/entries - Get all entries
 */
router.get('/', controller.getAll);

/**
 * GET /api/entries/:id - Get entry by ID
 */
router.get('/:id', controller.getById);

/**
 * PUT /api/entries/:id - Update an entry
 */
router.put('/:id', validateRequest(updateEntryBodySchema), controller.update);

/**
 * DELETE /api/entries/:id - Delete an entry
 */
router.delete('/:id', controller.delete);

export default router;
