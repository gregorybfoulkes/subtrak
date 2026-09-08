# Testing Strategy

## Current baseline

Subtrak uses Vitest 4 with TypeScript and native ES modules. The current automated suite covers billing calculations, currency conversion, formatting, and exchange-rate caching in `tests/lib`. The test environment is Node because the current tests target pure services rather than rendered React components or a running Electron process.

Run the checks locally:

```bash
npm test                 # Run all committed tests once
npm run test:watch       # Watch tests during development
npm run test:coverage    # Generate coverage/index.html and enforce thresholds
npm run typecheck        # Validate TypeScript
npm run build            # Validate renderer, Electron bundles, and packaging
```

## Test pyramid and targets

The long-term mix is approximately 70% unit, 20% integration, and 10% end-to-end tests. Percentages describe test count and feedback speed, not a requirement to force every module into one category.

| Layer | Scope | Target |
| --- | --- | --- |
| Unit | Billing, exchange-rate parsing/cache rules, input validation, date helpers | 80%+ lines/functions; 70%+ branches |
| Integration | IPC handlers with a temporary SQLite database; preload contract with mocked `ipcRenderer` | Every CRUD path, validation failure, filter, and persistence edge case |
| E2E | Packaged or development Electron app through the visible UI | Add, edit, delete, filter, currency fallback, and restart persistence |
| Performance | Only when data volume or startup latency becomes a concern | Establish a baseline before optimizing |

Coverage is initially collected for the tested `src/lib` service layer in `vitest.config.ts`. The current gate is a passing baseline of 75% lines/statements, 80% functions, and 70% branches. Increase the included surface and thresholds as integration and UI tests land rather than lowering thresholds to hide untested code.

## What to test

### Unit tests

- Weekly, monthly, and yearly normalization.
- Same-currency and cross-currency conversion.
- Missing-rate behavior and invalid ISO currency codes.
- Cache freshness, malformed cache entries, HTTP errors, and offline fallback.
- Renewal boundaries: today, seven days, and dates already passed.
- Input validation for empty names/categories, invalid amounts, dates, and billing cycles.

### Integration tests

Add these after making the database module accept an injected database or database path:

- Create, read, update, and delete against a temporary SQLite database.
- Search by name and notes, category filtering, billing-cycle filtering, and ordering.
- Validation rejection before any database write.
- Missing-record behavior for update and delete.
- Schema initialization and seed behavior on an empty database.
- IPC handler registration and return values with mocked `ipcMain`.

### End-to-end tests

Use Playwright with Electron (`_electron.launch`) once a deterministic test database/profile can be supplied:

- Launch with an empty profile and verify the seeded or empty state.
- Add a subscription and verify it appears in the list and dashboard.
- Edit and delete a subscription.
- Search and filter the list.
- Select a display currency and verify converted values.
- Start with a stored non-USD subscription while rates are unavailable and verify the UI remains usable.

## Test templates

### Unit template

```ts
import { describe, expect, it } from 'vitest'
import { functionUnderTest } from '../../src/path/to/module'

describe('functionUnderTest', () => {
  it('handles the expected input', () => {
    expect(functionUnderTest(input)).toEqual(expected)
  })

  it('handles the failure boundary', () => {
    expect(() => functionUnderTest(invalidInput)).toThrow('meaningful message')
  })
})
```

### IPC/database integration template

```ts
import { afterEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'

describe('subscription persistence', () => {
  let database: Database.Database

  afterEach(() => database.close())

  it('persists a subscription and returns it from a list', () => {
    database = new Database(':memory:')
    // Prefer a database factory passed to the production module over mocking SQL.
    // Initialize the schema, create a row, then assert the public repository API.
    expect(database).toBeDefined()
  })
})
```

The production database module currently owns the Electron `userData` path, so do not point tests at the real profile. Introduce a factory or explicit database path before implementing this suite.

### Electron E2E template

```ts
import { _electron as electron, test, expect } from '@playwright/test'

test('creates a subscription', async () => {
  const app = await electron.launch({ args: ['.'] })
  const window = await app.firstWindow()

  await window.getByRole('button', { name: /add sub/i }).click()
  await window.getByLabel('Name').fill('Example')
  await window.getByLabel('Amount').fill('12')
  await window.getByRole('button', { name: /add subscription/i }).click()

  await expect(window.getByText('Example')).toBeVisible()
  await app.close()
})
```

Add stable accessible labels and a disposable Electron profile before enabling this template in CI.

## CI policy

Every pull request should run:

1. `npm ci`
2. `npm test`
3. `npm run test:coverage`
4. `npm run typecheck`
5. `npm run build`

E2E tests should run in a separate job after the deterministic profile/database setup exists. Native Electron packaging is kept separate from unit tests so a packaging failure is visible without obscuring test failures.

## Next questions

- Is the desired coverage gate 80% overall, or should critical modules have a higher threshold?
- Should CI run on every push as well as pull requests?
- Is performance testing needed for large subscription collections or startup time?
- Should the Electron E2E job cover macOS, Windows, and Linux, or only the release platform?