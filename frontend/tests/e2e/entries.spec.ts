import { test, expect, Page } from '@playwright/test';

// Run tests serially to avoid data conflicts
test.describe.configure({ mode: 'serial' });

// API Base URL for direct API calls (test data setup/cleanup)
const API_BASE_URL = 'http://localhost:3000';

// Helper function to create an entry via API
async function createEntryViaAPI(page: Page, data: { date: string; content: string }) {
  const response = await page.request.post(`${API_BASE_URL}/api/entries`, {
    data,
  });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

// Helper function to delete an entry via API
async function deleteEntryViaAPI(page: Page, id: number) {
  const response = await page.request.delete(`${API_BASE_URL}/api/entries/${id}`);
  return response.ok();
}

// Helper function to delete all entries via API (for cleanup)
async function deleteAllEntriesViaAPI(page: Page) {
  const response = await page.request.get(`${API_BASE_URL}/api/entries`);
  if (response.ok()) {
    const entries = await response.json();
    for (const entry of entries) {
      await deleteEntryViaAPI(page, entry.id);
    }
  }
}

// Helper function to generate unique test content
function generateUniqueContent(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

// Helper function to get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

test.describe('Entry Creation Flow (FR-001)', () => {
  test.beforeEach(async ({ page }) => {
    // Clean up before each test
    await deleteAllEntriesViaAPI(page);
  });

  test('should create a new entry and display it in the list', async ({ page }) => {
    const testDate = getTodayDate();
    const testContent = generateUniqueContent('Test diary entry');

    // 1. Navigate to top page
    await page.goto('/');
    await expect(page).toHaveTitle(/Simple Diary/);
    await expect(page.locator('h1')).toContainText('Entries');

    // 2. Click "New Entry" button
    await page.click('text=New Entry');
    await expect(page).toHaveURL('/entries/new');
    await expect(page.locator('h1')).toContainText('New Entry');

    // 3. Fill date and content
    await page.fill('input[type="date"]', testDate);
    await page.fill('textarea#content', testContent);

    // 4. Click save button
    await page.click('button[type="submit"]:has-text("Save")');

    // 5. Verify redirect to entry list and created entry is displayed
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=' + testContent.substring(0, 50))).toBeVisible();
    await expect(page.locator(`time:has-text("${testDate}")`)).toBeVisible();
  });

  test('should show validation error when content is empty', async ({ page }) => {
    // Navigate to create page
    await page.goto('/entries/new');

    // Make sure content is empty and try to submit
    const contentTextarea = page.locator('textarea#content');
    await contentTextarea.fill('   '); // whitespace only
    await contentTextarea.blur();
    await page.click('button[type="submit"]:has-text("Save")');

    // Should show validation error (either "required" or "whitespace" message)
    const errorMessage = page.locator('text=/Content (is required|cannot be only whitespace)/');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    // Should stay on create page
    await expect(page).toHaveURL('/entries/new');
  });

  test('should have today date as default', async ({ page }) => {
    await page.goto('/entries/new');

    const dateInput = page.locator('input[type="date"]');
    const todayDate = getTodayDate();

    await expect(dateInput).toHaveValue(todayDate);
  });
});

test.describe('Entry Browse Flow (FR-002)', () => {
  let createdEntries: Array<{ id: number; date: string; content: string }> = [];

  test.beforeEach(async ({ page }) => {
    // Clean up and create test data
    await deleteAllEntriesViaAPI(page);
    createdEntries = [];

    // Create multiple entries with different dates
    const entries = [
      { date: '2024-01-15', content: generateUniqueContent('Entry from January 15') },
      { date: '2024-01-20', content: generateUniqueContent('Entry from January 20') },
      { date: '2024-01-10', content: generateUniqueContent('Entry from January 10') },
    ];

    for (const entry of entries) {
      const created = await createEntryViaAPI(page, entry);
      createdEntries.push({ ...entry, id: created.id });
    }
  });

  test.afterEach(async ({ page }) => {
    // Clean up
    for (const entry of createdEntries) {
      await deleteEntryViaAPI(page, entry.id);
    }
  });

  test('should display entries sorted by date in descending order', async ({ page }) => {
    // Navigate to top page
    await page.goto('/');

    // Wait for entries to load (entry cards, not the "New Entry" link)
    await page.waitForSelector('a[href^="/entries/"]:not([href="/entries/new"])');

    // Get all entry cards (excluding the "New Entry" link)
    const entryCards = page.locator('a[href^="/entries/"]:not([href="/entries/new"])');
    const count = await entryCards.count();
    expect(count).toBe(3);

    // Verify order (newest first: Jan 20, Jan 15, Jan 10)
    const dates: string[] = [];
    for (let i = 0; i < count; i++) {
      const dateText = await entryCards.nth(i).locator('time').textContent();
      dates.push(dateText || '');
    }

    expect(dates[0]).toBe('2024-01-20');
    expect(dates[1]).toBe('2024-01-15');
    expect(dates[2]).toBe('2024-01-10');
  });

  test('should display date and content preview for each entry', async ({ page }) => {
    await page.goto('/');

    // Wait for entry cards to load (not the "New Entry" link)
    await page.waitForSelector('a[href^="/entries/"]:not([href="/entries/new"])');

    const entryCards = page.locator('a[href^="/entries/"]:not([href="/entries/new"])');

    // Each entry should have date and content preview
    for (let i = 0; i < await entryCards.count(); i++) {
      const card = entryCards.nth(i);
      await expect(card.locator('time')).toBeVisible();
      await expect(card.locator('p')).toBeVisible();
    }
  });

  test('should navigate to entry detail when clicking an entry', async ({ page }) => {
    await page.goto('/');

    // Wait for entry cards to load (not the "New Entry" link)
    await page.waitForSelector('a[href^="/entries/"]:not([href="/entries/new"])');

    // Click the first entry card
    const firstEntry = page.locator('a[href^="/entries/"]:not([href="/entries/new"])').first();
    await firstEntry.click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/entries\/\d+$/);

    // Should display full content
    const detailContent = page.locator('.prose p');
    await expect(detailContent).toBeVisible();
  });

  test('should show empty state when no entries exist', async ({ page }) => {
    // Delete all entries
    await deleteAllEntriesViaAPI(page);

    await page.goto('/');

    // Should show empty state message
    await expect(page.locator('text=No entries')).toBeVisible();
    await expect(page.locator('text=Get started by creating a new entry')).toBeVisible();
  });
});

test.describe('Entry Edit Flow (FR-003)', () => {
  let testEntry: { id: number; date: string; content: string };

  test.beforeEach(async ({ page }) => {
    // Clean up and create test entry
    await deleteAllEntriesViaAPI(page);

    const entry = {
      date: '2024-01-15',
      content: generateUniqueContent('Original content'),
    };
    const created = await createEntryViaAPI(page, entry);
    testEntry = { ...entry, id: created.id };
  });

  test.afterEach(async ({ page }) => {
    if (testEntry?.id) {
      await deleteEntryViaAPI(page, testEntry.id);
    }
  });

  test('should edit an entry and display updated content', async ({ page }) => {
    const newDate = '2024-02-20';
    const newContent = generateUniqueContent('Updated content');

    // 1. Navigate to entry detail page
    await page.goto(`/entries/${testEntry.id}`);
    await expect(page.locator('h1.text-blue-600')).toContainText(testEntry.date);

    // 2. Click edit button
    await page.click('a:has-text("Edit")');
    await expect(page).toHaveURL(`/entries/${testEntry.id}/edit`);
    await expect(page.locator('h1')).toContainText('Edit Entry');

    // Wait for form to load with original values
    await page.waitForSelector('input[type="date"]');
    await expect(page.locator('input[type="date"]')).toHaveValue(testEntry.date);

    // 3. Change date and content - clear first then type
    const dateInput = page.locator('input[type="date"]');
    await dateInput.clear();
    await dateInput.fill(newDate);

    const contentTextarea = page.locator('textarea#content');
    await contentTextarea.clear();
    await contentTextarea.fill(newContent);

    // Verify inputs have new values before submitting
    await expect(dateInput).toHaveValue(newDate);
    await expect(contentTextarea).toHaveValue(newContent);

    // 4. Click save button (shows "Update" text in edit mode)
    await page.click('button[type="submit"]:has-text("Update")');

    // 5. Verify redirect to detail page with updated content
    await expect(page).toHaveURL(`/entries/${testEntry.id}`);
    // Wait for the page to load new data from API
    await page.waitForLoadState('networkidle');
    // Reload to ensure fresh data
    await page.reload();
    await page.waitForLoadState('networkidle');
    // Date is displayed in h1 with class text-blue-600
    await expect(page.locator('h1.text-blue-600')).toContainText(newDate, { timeout: 10000 });
    await expect(page.locator('.prose p')).toContainText(newContent);
  });

  test('should show original values when entering edit mode', async ({ page }) => {
    await page.goto(`/entries/${testEntry.id}/edit`);

    // Wait for form to load
    await page.waitForSelector('input[type="date"]');

    const dateInput = page.locator('input[type="date"]');
    const contentTextarea = page.locator('textarea#content');

    await expect(dateInput).toHaveValue(testEntry.date);
    await expect(contentTextarea).toHaveValue(testEntry.content);
  });

  test('should cancel edit and return to previous page', async ({ page }) => {
    await page.goto(`/entries/${testEntry.id}`);
    await page.click('a:has-text("Edit")');

    // Make some changes
    await page.fill('textarea#content', 'Some changed content');

    // Click cancel
    await page.click('button:has-text("Cancel")');

    // Should go back to detail page
    await expect(page).toHaveURL(`/entries/${testEntry.id}`);

    // Original content should be preserved
    await expect(page.locator('.prose p')).toContainText(testEntry.content);
  });
});

test.describe('Entry Delete Flow (FR-004)', () => {
  let testEntry: { id: number; date: string; content: string };

  test.beforeEach(async ({ page }) => {
    // Clean up and create test entry
    await deleteAllEntriesViaAPI(page);

    const entry = {
      date: '2024-01-15',
      content: generateUniqueContent('Entry to be deleted'),
    };
    const created = await createEntryViaAPI(page, entry);
    testEntry = { ...entry, id: created.id };
  });

  test('should delete an entry with confirmation', async ({ page }) => {
    // 1. Navigate to entry detail page
    await page.goto(`/entries/${testEntry.id}`);
    await expect(page.locator('.prose p')).toContainText(testEntry.content);

    // 2. Click delete button
    await page.click('button:has-text("Delete")');

    // 3. Verify confirmation dialog appears
    await expect(page.locator('text=Delete Entry')).toBeVisible();
    await expect(page.locator('text=Are you sure you want to delete this entry?')).toBeVisible();

    // 4. Click confirm button
    await page.click('button:has-text("Confirm")');

    // 5. Verify redirect to entry list and entry is not displayed
    await expect(page).toHaveURL('/');
    await expect(page.locator(`text=${testEntry.content.substring(0, 30)}`)).not.toBeVisible();
  });

  test('should cancel delete and stay on detail page', async ({ page }) => {
    await page.goto(`/entries/${testEntry.id}`);

    // Click delete button
    await page.click('button:has-text("Delete")');

    // Verify confirmation dialog
    await expect(page.locator('text=Delete Entry')).toBeVisible();

    // Click cancel
    await page.click('button:has-text("Cancel")');

    // Should stay on detail page
    await expect(page).toHaveURL(`/entries/${testEntry.id}`);
    await expect(page.locator('.prose p')).toContainText(testEntry.content);
  });

  test.afterEach(async ({ page }) => {
    // Try to clean up if entry still exists
    if (testEntry?.id) {
      await deleteEntryViaAPI(page, testEntry.id);
    }
  });
});

test.describe('Entry Search Flow (FR-005)', () => {
  let createdEntries: Array<{ id: number; date: string; content: string }> = [];

  test.beforeEach(async ({ page }) => {
    // Clean up and create test data with specific keywords
    await deleteAllEntriesViaAPI(page);
    createdEntries = [];

    const searchKeyword = 'uniquekeyword' + Date.now();
    const entries = [
      { date: '2024-01-20', content: `Entry with ${searchKeyword} here` },
      { date: '2024-01-15', content: `Another entry with ${searchKeyword} inside` },
      { date: '2024-01-10', content: 'Entry without the special word' },
    ];

    for (const entry of entries) {
      const created = await createEntryViaAPI(page, entry);
      createdEntries.push({ ...entry, id: created.id });
    }
  });

  test.afterEach(async ({ page }) => {
    // Clean up
    for (const entry of createdEntries) {
      await deleteEntryViaAPI(page, entry.id);
    }
  });

  test('should search entries by keyword', async ({ page }) => {
    // Extract the keyword from the first entry
    const keyword = createdEntries[0].content.match(/uniquekeyword\d+/)?.[0] || '';

    // 1. Navigate to top page
    await page.goto('/');
    await page.waitForSelector('a[href^="/entries/"]:not([href="/entries/new"])');

    // Initially should show all 3 entries
    let entryCards = page.locator('a[href^="/entries/"]:not([href="/entries/new"])');
    expect(await entryCards.count()).toBe(3);

    // 2. Enter keyword in search bar
    await page.fill('input[aria-label="Search entries"]', keyword);

    // 3. Click search button
    await page.click('button[aria-label="Search"]');

    // Wait for search results
    await page.waitForLoadState('networkidle');

    // 4. Verify search results
    entryCards = page.locator('a[href^="/entries/"]:not([href="/entries/new"])');
    expect(await entryCards.count()).toBe(2);

    // Both entries should contain the keyword
    for (let i = 0; i < await entryCards.count(); i++) {
      const text = await entryCards.nth(i).textContent();
      expect(text?.toLowerCase()).toContain(keyword.toLowerCase());
    }
  });

  test('should display search results sorted by date in descending order', async ({ page }) => {
    const keyword = createdEntries[0].content.match(/uniquekeyword\d+/)?.[0] || '';

    await page.goto('/');
    await page.waitForSelector('a[href^="/entries/"]:not([href="/entries/new"])');

    // Search for keyword
    await page.fill('input[aria-label="Search entries"]', keyword);
    await page.click('button[aria-label="Search"]');
    await page.waitForLoadState('networkidle');

    // Verify order (newest first)
    const entryCards = page.locator('a[href^="/entries/"]:not([href="/entries/new"])');
    const dates: string[] = [];

    for (let i = 0; i < await entryCards.count(); i++) {
      const dateText = await entryCards.nth(i).locator('time').textContent();
      dates.push(dateText || '');
    }

    // Jan 20 should come before Jan 15
    expect(dates[0]).toBe('2024-01-20');
    expect(dates[1]).toBe('2024-01-15');
  });

  test('should show no results message when search finds nothing', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('a[href^="/entries/"]:not([href="/entries/new"])');

    // Search for non-existent keyword
    await page.fill('input[aria-label="Search entries"]', 'nonexistentkeyword12345');
    await page.click('button[aria-label="Search"]');
    await page.waitForLoadState('networkidle');

    // Should show empty state
    await expect(page.locator('text=No entries')).toBeVisible();
  });

  test('should clear search and show all entries', async ({ page }) => {
    const keyword = createdEntries[0].content.match(/uniquekeyword\d+/)?.[0] || '';

    await page.goto('/');
    await page.waitForSelector('a[href^="/entries/"]:not([href="/entries/new"])');

    // Search for keyword
    await page.fill('input[aria-label="Search entries"]', keyword);
    await page.click('button[aria-label="Search"]');
    await page.waitForLoadState('networkidle');

    // Should have 2 results
    let entryCards = page.locator('a[href^="/entries/"]:not([href="/entries/new"])');
    expect(await entryCards.count()).toBe(2);

    // Clear search input manually and search with empty
    await page.fill('input[aria-label="Search entries"]', '');

    // Click clear button if visible or navigate back
    const clearButton = page.locator('button[aria-label="Clear search"]');
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await page.waitForLoadState('networkidle');
    } else {
      // Reload the page to reset
      await page.goto('/');
      await page.waitForSelector('a[href^="/entries/"]:not([href="/entries/new"])');
    }

    // Should show all 3 entries again
    entryCards = page.locator('a[href^="/entries/"]:not([href="/entries/new"])');
    await page.waitForTimeout(500); // Wait for state update
    expect(await entryCards.count()).toBe(3);
  });
});

test.describe('Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    // Create a test entry for responsive tests
    await deleteAllEntriesViaAPI(page);
    await createEntryViaAPI(page, {
      date: getTodayDate(),
      content: 'Responsive test entry content',
    });
  });

  test('should display correctly on desktop', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Run responsive tests only on Chromium');

    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // Header should be visible
    await expect(page.locator('text=Simple Diary')).toBeVisible();

    // New Entry button should be visible
    await expect(page.locator('text=New Entry')).toBeVisible();

    // Search bar should be visible
    await expect(page.locator('input[aria-label="Search entries"]')).toBeVisible();

    // Entry cards should be visible
    await expect(page.locator('a[href^="/entries/"]:not([href="/entries/new"])').first()).toBeVisible();
  });

  test('should display correctly on tablet', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Run responsive tests only on Chromium');

    // Set tablet viewport (iPad)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    // All elements should still be visible
    await expect(page.locator('text=Simple Diary')).toBeVisible();
    await expect(page.locator('text=New Entry')).toBeVisible();
    await expect(page.locator('input[aria-label="Search entries"]')).toBeVisible();
  });

  test('should display correctly on mobile', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Run responsive tests only on Chromium');

    // Set mobile viewport (iPhone)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // All elements should be visible
    await expect(page.locator('text=Simple Diary')).toBeVisible();
    await expect(page.locator('text=New Entry')).toBeVisible();

    // Test create entry form on mobile
    await page.click('text=New Entry');
    await expect(page.locator('input[type="date"]')).toBeVisible();
    await expect(page.locator('textarea#content')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should have working touch interactions on mobile', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Run responsive tests only on Chromium');

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Wait for entry card links to load (not the new entry link)
    await page.waitForSelector('a[href^="/entries/"]:not([href="/entries/new"])');

    // Click on entry card (tap requires hasTouch context, using click instead)
    await page.locator('a[href^="/entries/"]:not([href="/entries/new"])').first().click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/entries\/\d+$/);
  });
});

test.describe('Navigation Flow', () => {
  let testEntry: { id: number; date: string; content: string };

  test.beforeEach(async ({ page }) => {
    await deleteAllEntriesViaAPI(page);
    const entry = {
      date: getTodayDate(),
      content: generateUniqueContent('Navigation test entry'),
    };
    const created = await createEntryViaAPI(page, entry);
    testEntry = { ...entry, id: created.id };
  });

  test.afterEach(async ({ page }) => {
    if (testEntry?.id) {
      await deleteEntryViaAPI(page, testEntry.id);
    }
  });

  test('should navigate using header logo', async ({ page }) => {
    // Go to detail page
    await page.goto(`/entries/${testEntry.id}`);

    // Click on header logo/title
    await page.click('text=Simple Diary');

    // Should navigate to home
    await expect(page).toHaveURL('/');
  });

  test('should navigate using back link on detail page', async ({ page }) => {
    await page.goto(`/entries/${testEntry.id}`);

    // Click "Back to list" link
    await page.click('text=Back to list');

    // Should navigate to home
    await expect(page).toHaveURL('/');
  });

  test('should handle browser back button', async ({ page }) => {
    // Start at home
    await page.goto('/');

    // Wait for entry links to load (excluding /entries/new)
    await page.waitForSelector('a[href^="/entries/"]:not([href="/entries/new"])');

    // Navigate to detail - click on entry card link
    await page.locator('a[href^="/entries/"]:not([href="/entries/new"])').first().click();
    await expect(page).toHaveURL(/\/entries\/\d+$/);

    // Use browser back
    await page.goBack();

    // Should be back at home
    await expect(page).toHaveURL('/');
  });
});

test.describe('Error Handling', () => {
  test('should handle non-existent entry gracefully', async ({ page }) => {
    // Try to access a non-existent entry
    await page.goto('/entries/999999');

    // Should show error or redirect
    // Wait for either error message or redirect
    await page.waitForLoadState('networkidle');

    // Check if there's an error message or we're redirected
    const hasError = await page.locator('.bg-red-50').isVisible();
    const isRedirected = page.url() === 'http://localhost:5173/';

    expect(hasError || isRedirected).toBeTruthy();
  });

  test('should show error state when API is unavailable', async ({ page }) => {
    // Intercept API calls and make them fail
    await page.route('**/api/entries', (route) => {
      route.abort('failed');
    });

    await page.goto('/');

    // Should show error state
    await expect(page.locator('.bg-red-50')).toBeVisible({ timeout: 10000 });
  });
});
