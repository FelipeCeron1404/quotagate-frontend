import { QuotaApiClient } from './QuotaApiClient'

const DEFAULT_API_BASE_URL = 'http://localhost:8080'

export const apiBaseUrl: string = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL

export const quotaApiClient = new QuotaApiClient(apiBaseUrl)
