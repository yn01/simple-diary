import request from 'supertest';
import express, { Express } from 'express';
import Database from 'better-sqlite3';
import { EntryController } from '../../src/controllers/EntryController';
import { EntryService } from '../../src/services/EntryService';
import { EntryRepository } from '../../src/repositories/EntryRepository';
import { errorHandler } from '../../src/middlewares/errorHandler';
import {
  validateRequest,
  createEntryBodySchema,
  updateEntryBodySchema,
} from '../../src/middlewares/validateRequest';
import { Router } from 'express';

describe('Entry API Integration Tests', () => {
  let app: Express;
  let db: Database.Database;

  beforeEach(() => {
    // Create in-memory database
    db = new Database(':memory:');
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

    // Setup dependencies
    const repository = new EntryRepository(db);
    const service = new EntryService(repository);
    const controller = new EntryController(service);

    // Setup router
    const router = Router();
    router.get('/search', controller.search);
    router.post('/', validateRequest(createEntryBodySchema), controller.create);
    router.get('/', controller.getAll);
    router.get('/:id', controller.getById);
    router.put('/:id', validateRequest(updateEntryBodySchema), controller.update);
    router.delete('/:id', controller.delete);

    // Setup app
    app = express();
    app.use(express.json());
    app.use('/api/entries', router);
    app.use(errorHandler);
  });

  afterEach(() => {
    db.close();
  });

  describe('POST /api/entries', () => {
    it('creates a new entry and returns 201', async () => {
      const response = await request(app)
        .post('/api/entries')
        .send({ date: '2026-01-31', content: 'Test diary entry' })
        .expect(201);

      expect(response.body).toMatchObject({
        id: 1,
        date: '2026-01-31',
        content: 'Test diary entry',
      });
      expect(response.body.created_at).toBeDefined();
      expect(response.body.updated_at).toBeDefined();
    });

    it('returns 400 for empty content', async () => {
      const response = await request(app)
        .post('/api/entries')
        .send({ date: '2026-01-31', content: '' })
        .expect(400);

      expect(response.body.message).toBe('Validation Error');
      expect(response.body.details).toBeDefined();
    });

    it('returns 400 for invalid date format', async () => {
      const response = await request(app)
        .post('/api/entries')
        .send({ date: 'invalid-date', content: 'Test content' })
        .expect(400);

      expect(response.body.message).toBe('Validation Error');
    });

    it('returns 400 for missing date', async () => {
      const response = await request(app)
        .post('/api/entries')
        .send({ content: 'Test content' })
        .expect(400);

      expect(response.body.message).toBe('Validation Error');
    });

    it('returns 400 for missing content', async () => {
      const response = await request(app)
        .post('/api/entries')
        .send({ date: '2026-01-31' })
        .expect(400);

      expect(response.body.message).toBe('Validation Error');
    });

    it('returns 400 for whitespace-only content', async () => {
      const response = await request(app)
        .post('/api/entries')
        .send({ date: '2026-01-31', content: '   ' })
        .expect(400);

      expect(response.body.message).toBe('Validation Error');
    });

    it('returns 400 for invalid date (Feb 30th)', async () => {
      const response = await request(app)
        .post('/api/entries')
        .send({ date: '2026-02-30', content: 'Test content' })
        .expect(400);

      expect(response.body.message).toBe('Validation Error');
    });

    it('handles special characters in content', async () => {
      const specialContent = '<script>alert("xss")</script> & "quotes"';
      const response = await request(app)
        .post('/api/entries')
        .send({ date: '2026-01-31', content: specialContent })
        .expect(201);

      expect(response.body.content).toBe(specialContent);
    });
  });

  describe('GET /api/entries', () => {
    it('returns empty array when no entries exist', async () => {
      const response = await request(app).get('/api/entries').expect(200);

      expect(response.body).toEqual([]);
    });

    it('returns all entries sorted by date descending', async () => {
      // Create entries in random order
      await request(app).post('/api/entries').send({ date: '2026-01-29', content: 'Entry 1' });
      await request(app).post('/api/entries').send({ date: '2026-01-31', content: 'Entry 3' });
      await request(app).post('/api/entries').send({ date: '2026-01-30', content: 'Entry 2' });

      const response = await request(app).get('/api/entries').expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0].date).toBe('2026-01-31');
      expect(response.body[1].date).toBe('2026-01-30');
      expect(response.body[2].date).toBe('2026-01-29');
    });
  });

  describe('GET /api/entries/:id', () => {
    it('returns entry when found', async () => {
      const createResponse = await request(app)
        .post('/api/entries')
        .send({ date: '2026-01-31', content: 'Test entry' });

      const id = createResponse.body.id;
      const response = await request(app).get(`/api/entries/${id}`).expect(200);

      expect(response.body.id).toBe(id);
      expect(response.body.content).toBe('Test entry');
    });

    it('returns 404 when entry not found', async () => {
      const response = await request(app).get('/api/entries/999').expect(404);

      expect(response.body.message).toBe('Entry not found');
    });

    it('returns 400 for invalid id format', async () => {
      const response = await request(app).get('/api/entries/invalid').expect(400);

      expect(response.body.message).toBe('Invalid ID format');
    });
  });

  describe('PUT /api/entries/:id', () => {
    it('updates entry and returns 200', async () => {
      const createResponse = await request(app)
        .post('/api/entries')
        .send({ date: '2026-01-31', content: 'Original content' });

      const id = createResponse.body.id;
      const response = await request(app)
        .put(`/api/entries/${id}`)
        .send({ date: '2026-01-31', content: 'Updated content' })
        .expect(200);

      expect(response.body.content).toBe('Updated content');
    });

    it('updates both date and content', async () => {
      const createResponse = await request(app)
        .post('/api/entries')
        .send({ date: '2026-01-31', content: 'Original content' });

      const id = createResponse.body.id;
      const response = await request(app)
        .put(`/api/entries/${id}`)
        .send({ date: '2026-02-01', content: 'Updated content' })
        .expect(200);

      expect(response.body.date).toBe('2026-02-01');
      expect(response.body.content).toBe('Updated content');
    });

    it('returns 404 when entry not found', async () => {
      const response = await request(app)
        .put('/api/entries/999')
        .send({ date: '2026-01-31', content: 'Updated content' })
        .expect(404);

      expect(response.body.message).toBe('Entry not found');
    });

    it('returns 400 for invalid id format', async () => {
      const response = await request(app)
        .put('/api/entries/invalid')
        .send({ date: '2026-01-31', content: 'Updated content' })
        .expect(400);

      expect(response.body.message).toBe('Invalid ID format');
    });

    it('returns 400 for empty content', async () => {
      const createResponse = await request(app)
        .post('/api/entries')
        .send({ date: '2026-01-31', content: 'Original content' });

      const id = createResponse.body.id;
      const response = await request(app)
        .put(`/api/entries/${id}`)
        .send({ date: '2026-01-31', content: '' })
        .expect(400);

      expect(response.body.message).toBe('Validation Error');
    });

    it('returns 400 for invalid date format', async () => {
      const createResponse = await request(app)
        .post('/api/entries')
        .send({ date: '2026-01-31', content: 'Original content' });

      const id = createResponse.body.id;
      const response = await request(app)
        .put(`/api/entries/${id}`)
        .send({ date: 'invalid-date', content: 'Updated content' })
        .expect(400);

      expect(response.body.message).toBe('Validation Error');
    });
  });

  describe('DELETE /api/entries/:id', () => {
    it('deletes entry and returns 204', async () => {
      const createResponse = await request(app)
        .post('/api/entries')
        .send({ date: '2026-01-31', content: 'To be deleted' });

      const id = createResponse.body.id;
      await request(app).delete(`/api/entries/${id}`).expect(204);

      // Verify deletion
      await request(app).get(`/api/entries/${id}`).expect(404);
    });

    it('returns 404 when entry not found', async () => {
      const response = await request(app).delete('/api/entries/999').expect(404);

      expect(response.body.message).toBe('Entry not found');
    });

    it('returns 400 for invalid id format', async () => {
      const response = await request(app).delete('/api/entries/invalid').expect(400);

      expect(response.body.message).toBe('Invalid ID format');
    });
  });

  describe('GET /api/entries/search', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/entries')
        .send({ date: '2026-01-31', content: 'Today I learned about TypeScript' });
      await request(app)
        .post('/api/entries')
        .send({ date: '2026-01-30', content: 'JavaScript is fun to learn' });
      await request(app)
        .post('/api/entries')
        .send({ date: '2026-01-29', content: 'Python programming basics' });
    });

    it('returns matching entries', async () => {
      const response = await request(app).get('/api/entries/search?q=learn').expect(200);

      expect(response.body).toHaveLength(2);
    });

    it('returns entries sorted by date descending', async () => {
      const response = await request(app).get('/api/entries/search?q=learn').expect(200);

      expect(response.body[0].date).toBe('2026-01-31');
      expect(response.body[1].date).toBe('2026-01-30');
    });

    it('performs case-insensitive search', async () => {
      const response = await request(app).get('/api/entries/search?q=TYPESCRIPT').expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].content).toContain('TypeScript');
    });

    it('returns empty array when no matches found', async () => {
      const response = await request(app).get('/api/entries/search?q=Ruby').expect(200);

      expect(response.body).toEqual([]);
    });

    it('returns 400 when query parameter is missing', async () => {
      const response = await request(app).get('/api/entries/search').expect(400);

      expect(response.body.message).toBe('Validation Error');
      expect(response.body.details).toContain("'q' parameter is required for search.");
    });

    it('returns all entries for empty query string', async () => {
      const response = await request(app).get('/api/entries/search?q=').expect(200);

      expect(response.body).toHaveLength(3);
    });

    it('handles special SQL characters safely', async () => {
      await request(app)
        .post('/api/entries')
        .send({ date: '2026-01-28', content: 'Test with % and _ special chars' });

      const responsePercent = await request(app).get('/api/entries/search?q=%').expect(200);

      expect(responsePercent.body).toHaveLength(1);

      const responseUnderscore = await request(app).get('/api/entries/search?q=_').expect(200);

      expect(responseUnderscore.body).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    it('handles validation errors with proper format', async () => {
      const response = await request(app)
        .post('/api/entries')
        .send({ date: 'bad-date', content: '' })
        .expect(400);

      expect(response.body.message).toBe('Validation Error');
      expect(response.body.details).toBeInstanceOf(Array);
      expect(response.body.details.length).toBeGreaterThan(0);
    });
  });
});
