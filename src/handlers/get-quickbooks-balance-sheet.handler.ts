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
    const quickbooks = await QuickbooksClient.getInstance();

    // Balance Sheet is a point-in-time report. The QBO API uses "date" (not
    // "end_date") for the as-of date. Passing "end_date" is silently ignored
    // by QBO and causes the report to always return today's balance sheet.
    const params: Record<string, any> = {};
    if (options.end_date) params.date = options.end_date;
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
