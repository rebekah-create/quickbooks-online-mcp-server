import { QuickbooksClient } from "../clients/quickbooks-client.js";
import { ToolResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";

export interface BalanceSheetOptions {
  start_date?: string;
  end_date?: string;
  accounting_method?: "Cash" | "Accrual";
  summarize_column_by?: "Total" | "Month" | "Week" | "Days";
}

export async function getQuickbooksBalanceSheet(options: BalanceSheetOptions): Promise<ToolResponse<any>> {
  try {
    // Use getInstance() so token freshness is checked on every call
    const quickbooks = await QuickbooksClient.getInstance();

    // Balance Sheet is a point-in-time ("as of") report. QBO silently ignores
    // end_date unless start_date is also present — passing only end_date always
    // returns the default "this calendar year-to-date" sheet. When end_date is
    // supplied without start_date we default start_date to Jan 1 of the same
    // year, which is the conventional Balance Sheet reporting window.
    const params: Record<string, any> = {};
    if (options.end_date) {
      params.end_date = options.end_date;
      params.start_date = options.start_date || `${options.end_date.substring(0, 4)}-01-01`;
    } else if (options.start_date) {
      params.start_date = options.start_date;
    }
    if (options.accounting_method) params.accounting_method = options.accounting_method;
    if (options.summarize_column_by) params.summarize_column_by = options.summarize_column_by;

    return new Promise((resolve) => {
      (quickbooks as any).reportBalanceSheet(params, (err: any, report: any) => {
        if (err) {
          resolve({ result: null, isError: true, error: formatError(err) });
        } else {
          resolve({ result: report, isError: false, error: null });
        }
      });
    });
  } catch (error) {
    return { result: null, isError: true, error: formatError(error) };
  }
}
