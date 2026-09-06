import { contextBridge, ipcRenderer } from 'electron'
import type { SubscriptionFilters, SubscriptionInput } from '../../shared/types.ts'

contextBridge.exposeInMainWorld('subtrak', {
  subscriptions: {
    list: (filters?: SubscriptionFilters) =>
      ipcRenderer.invoke('subscriptions:list', filters),
    get: (id: string) => ipcRenderer.invoke('subscriptions:get', id),
    create: (input: SubscriptionInput) =>
      ipcRenderer.invoke('subscriptions:create', input),
    update: (id: string, input: SubscriptionInput) =>
      ipcRenderer.invoke('subscriptions:update', id, input),
    delete: (id: string) => ipcRenderer.invoke('subscriptions:delete', id),
  },
})
