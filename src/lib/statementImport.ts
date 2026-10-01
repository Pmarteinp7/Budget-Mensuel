import type { Transaction } from '../types';
import { extractPdfLines } from './pdfTextExtraction';

export interface ParsedStatementTransaction {
  id: string; // local id for the review table, not a real Transaction id
  date: string; // ISO yyyy-mm-dd
  description: string;
  amount: number;
  type: 'income' | 'expense';
  raw: string;
  confidence: 'high' | 'low';
}

const DATE_RE = /^(\d{1,2})[/.](\d{1,2})(?:[/.](\d{2,4}))?$/;
const AMOUNT_RE = /^-?\d{1,3}(?:[\s  ]\d{3})*,\d{2}$|^-?\d+,\d{2}$/;
const DEBIT_HEADER_RE = /d[ée]bit/i;
const CREDIT_HEADER_RE = /cr[ée]dit/i;

// Lines that are statement furniture, not transactions, even though they may
// contain date-like or amount-like tokens (balances, totals, page footers).
const SKIP_LINE_RE =
  /solde|total|report|relev[ée]|page\s*\d|iban|bic|siret|www\.|la\s*banque\s*postale|^date\s|^nature|^libell[ée]/i;

function parseAmount(token: string): number {
  const cleaned = token.replace(/[\s  ]/g, '').replace(',', '.');
  return Math.abs(parseFloat(cleaned));
}

function parseDate(token: string, statementYear: number): string | null {
  const m = DATE_RE.exec(token);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;
  let year = m[3] ? Number(m[3]) : statementYear;
  if (year < 100) year += 2000;
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/**
 * Parses a bank statement PDF (built against La Banque Postale's "relevé de
 * compte" layout: Date / Nature de l'opération / Débit euros / Crédit euros
 * columns) into candidate transactions. Column membership for amounts is
 * resolved from each page's actual Débit/Crédit header position rather than
 * assumed, since pdf.js's text stream doesn't preserve table structure on
 * its own.
 *
 * This is best-effort: statement layouts vary and change over time, so
 * every result is meant to be reviewed before import, never written
 * straight to the store.
 */
export async function parseLaBanquePostaleStatement(
  file: File,
  statementYear: number = new Date().getFullYear(),
): Promise<ParsedStatementTransaction[]> {
  const pages = await extractPdfLines(file);
  const results: ParsedStatementTransaction[] = [];
  let debitX: number | null = null;
  let creditX: number | null = null;
  let counter = 0;

  for (const lines of pages) {
    for (const line of lines) {
      const debitItem = line.items.find((it) => DEBIT_HEADER_RE.test(it.text));
      const creditItem = line.items.find((it) => CREDIT_HEADER_RE.test(it.text));
      if (debitItem) debitX = debitItem.x;
      if (creditItem) creditX = creditItem.x;
    }

    for (const line of lines) {
      const lineText = line.items.map((it) => it.text).join(' ');
      if (SKIP_LINE_RE.test(lineText)) continue;

      const dateItem = line.items[0];
      if (!dateItem) continue;
      const date = parseDate(dateItem.text, statementYear);
      if (!date) continue;

      const amountItems = line.items.filter((it) => AMOUNT_RE.test(it.text));
      if (amountItems.length === 0) continue;

      // Description: everything between the date and the first amount.
      const firstAmountX = amountItems[0].x;
      const descriptionItems = line.items.filter(
        (it) => it !== dateItem && it.x < firstAmountX && !DATE_RE.test(it.text),
      );
      const description = descriptionItems.map((it) => it.text).join(' ').trim();
      if (!description) continue;

      let type: 'income' | 'expense';
      let amount: number;
      let confidence: 'high' | 'low';

      if (amountItems.length >= 2 && debitX !== null && creditX !== null) {
        // Two amount tokens on the line: classify each by which column header it's closest to.
        const classified = amountItems.map((it) => ({
          it,
          isCredit: Math.abs(it.x - creditX!) < Math.abs(it.x - debitX!),
        }));
        const credit = classified.find((c) => c.isCredit);
        const debit = classified.find((c) => !c.isCredit);
        if (credit) {
          type = 'income';
          amount = parseAmount(credit.it.text);
        } else {
          type = 'expense';
          amount = parseAmount(debit!.it.text);
        }
        confidence = 'high';
      } else if (debitX !== null && creditX !== null) {
        const only = amountItems[0];
        const isCredit = Math.abs(only.x - creditX) < Math.abs(only.x - debitX);
        type = isCredit ? 'income' : 'expense';
        amount = parseAmount(only.text);
        confidence = 'high';
      } else {
        // No column calibration available on this page: fall back to sign,
        // defaulting to expense (the common case) and flagging for review.
        const only = amountItems[0];
        type = only.text.trim().startsWith('-') ? 'expense' : 'expense';
        amount = parseAmount(only.text);
        confidence = 'low';
      }

      if (amount <= 0) continue;

      results.push({
        id: `row-${counter++}`,
        date,
        description,
        amount,
        type,
        raw: lineText,
        confidence,
      });
    }
  }

  return results;
}

export interface DuplicateMatch {
  existingId: string;
}

/**
 * Flags parsed rows that look like they're already in the store (same date,
 * same amount, same type) so the review screen can warn before re-importing.
 */
export function findLikelyDuplicate(
  row: ParsedStatementTransaction,
  existing: Transaction[],
): DuplicateMatch | null {
  const match = existing.find(
    (t) => t.date === row.date && t.type === row.type && Math.abs(t.amount - row.amount) < 0.005,
  );
  return match ? { existingId: match.id } : null;
}
