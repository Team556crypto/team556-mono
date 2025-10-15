import { apiClient } from './client'
import type { GetTransactionsRequest, GetTransactionsResponse } from './types'

const BASE = '/transactions'

export const transactionsApi = {
  getTransactions: (token: string | null, params: GetTransactionsRequest) =>
    apiClient<GetTransactionsResponse>({ method: 'GET', endpoint: `${BASE}`, token, params }),
}