import { ipcMain } from 'electron'
import type { SubscriptionFilters, SubscriptionInput } from '../../../shared/types.ts'
import {
  createSubscription,
  deleteSubscription,
  getSubscription,
  listSubscriptions,
  updateSubscription,
} from '../db/subscriptions.ts'

export function registerSubscriptionHandlers(): void {
  ipcMain.handle('subscriptions:list', (_event, filters?: SubscriptionFilters) => {
    return listSubscriptions(filters ?? {})
  })

  ipcMain.handle('subscriptions:get', (_event, id: string) => {
    return getSubscription(id)
  })

  ipcMain.handle('subscriptions:create', (_event, input: SubscriptionInput) => {
    validateInput(input)
    return createSubscription(input)
  })

  ipcMain.handle('subscriptions:update', (_event, id: string, input: SubscriptionInput) => {
    validateInput(input)
    return updateSubscription(id, input)
  })

  ipcMain.handle('subscriptions:delete', (_event, id: string) => {
    deleteSubscription(id)
  })
}

function validateInput(input: SubscriptionInput): void {
  if (!input.name?.trim()) {
    throw new Error('Name is required')
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error('Amount must be greater than zero')
  }
  if (!input.renewal_date || Number.isNaN(Date.parse(input.renewal_date))) {
    throw new Error('Valid renewal date is required')
  }
  if (!input.category?.trim()) {
    throw new Error('Category is required')
  }
  if (!['weekly', 'monthly', 'yearly'].includes(input.billing_cycle)) {
    throw new Error('Invalid billing cycle')
  }
}
