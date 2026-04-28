/**
 * Prototype-shape contract test for search_budgets.
 *
 * Exercises the handler against the real node-quickbooks prototype (not the
 * hand-rolled mock) so any future drift between the handler's method name and
 * the library's prototype method name fails loudly in CI without needing
 * network or credentials.
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import QuickBooks from 'node-quickbooks';

const mockGetInstance = jest.fn<() => Promise<QuickBooks>>();

const MockQuickbooksClient = {
  getInstance: mockGetInstance,
};

jest.unstable_mockModule('../../../src/clients/quickbooks-client', () => ({
  QuickbooksClient: MockQuickbooksClient,
}));

const { searchQuickbooksBudgets } = await import('../../../src/handlers/search-quickbooks-budgets.handler');

describe('search_budgets prototype-shape contract', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('node-quickbooks exposes findBudgets on its prototype', () => {
    expect(typeof (QuickBooks.prototype as any).findBudgets).toBe('function');
  });

  it('handler invokes a method that exists on the real QuickBooks prototype', async () => {
    const qb = Object.create(QuickBooks.prototype) as QuickBooks;
    mockGetInstance.mockResolvedValue(qb);

    const spy = jest
      .spyOn(QuickBooks.prototype as any, 'findBudgets')
      .mockImplementation(function (this: unknown, _criteria: any, cb: any) {
        cb(null, { QueryResponse: { Budget: [{ Id: '1', Name: 'FY26', BudgetType: 'ProfitAndLoss' }] } });
      });

    const result = await searchQuickbooksBudgets({ name: 'FY26' });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(result.isError).toBe(false);
    expect(result.result).toEqual([{ Id: '1', Name: 'FY26', BudgetType: 'ProfitAndLoss' }]);
  });
});
