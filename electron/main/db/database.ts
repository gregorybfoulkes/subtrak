import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'node:path'

let db: Database.Database | null = null

function migrate(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      billing_cycle TEXT NOT NULL,
      category TEXT NOT NULL,
      renewal_date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `)
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function seedDemoData(database: Database.Database): void {
  const count = database.prepare('SELECT COUNT(*) as count FROM subscriptions').get() as {
    count: number
  }

  if (count.count > 0) return

  const now = new Date().toISOString()
  const today = now.slice(0, 10)

  const seeds = [
    {
      name: 'Netflix',
      amount: 15.99,
      billing_cycle: 'monthly',
      category: 'Streaming',
      renewal_date: addDays(today, 5),
      notes: 'Standard plan',
    },
    {
      name: 'Spotify',
      amount: 9.99,
      billing_cycle: 'monthly',
      category: 'Streaming',
      renewal_date: addDays(today, 12),
      notes: null,
    },
    {
      name: 'Adobe Creative Cloud',
      amount: 54.99,
      billing_cycle: 'monthly',
      category: 'Software',
      renewal_date: addDays(today, 20),
      notes: 'All apps',
    },
    {
      name: 'GitHub Copilot',
      amount: 10,
      billing_cycle: 'monthly',
      category: 'Software',
      renewal_date: addDays(today, 3),
      notes: null,
    },
    {
      name: 'Xbox Game Pass',
      amount: 119.99,
      billing_cycle: 'yearly',
      category: 'Gaming',
      renewal_date: addDays(today, 45),
      notes: 'Ultimate',
    },
    {
      name: 'iCloud+',
      amount: 2.99,
      billing_cycle: 'monthly',
      category: 'Utilities',
      renewal_date: addDays(today, 8),
      notes: '200GB storage',
    },
    {
      name: 'Peloton',
      amount: 44,
      billing_cycle: 'monthly',
      category: 'Fitness',
      renewal_date: addDays(today, 15),
      notes: null,
    },
    {
      name: 'The Economist',
      amount: 12,
      billing_cycle: 'weekly',
      category: 'Other',
      renewal_date: addDays(today, 2),
      notes: 'Digital edition',
    },
  ]

  const insert = database.prepare(`
    INSERT INTO subscriptions (
      id, name, amount, currency, billing_cycle, category, renewal_date, notes, created_at, updated_at
    ) VALUES (
      @id, @name, @amount, @currency, @billing_cycle, @category, @renewal_date, @notes, @created_at, @updated_at
    )
  `)

  const insertMany = database.transaction((rows: typeof seeds) => {
    for (const row of rows) {
      insert.run({
        id: crypto.randomUUID(),
        name: row.name,
        amount: row.amount,
        currency: 'USD',
        billing_cycle: row.billing_cycle,
        category: row.category,
        renewal_date: row.renewal_date,
        notes: row.notes,
        created_at: now,
        updated_at: now,
      })
    }
  })

  insertMany(seeds)
}

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = path.join(app.getPath('userData'), 'subtrak.db')
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    migrate(db)
    seedDemoData(db)
  }
  return db
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}
