import { parse } from 'csv-parse/sync';
import { ParsedTicket } from '../types';

interface CsvRow {
  [key: string]: string;
}

export function parseJiraCsv(csvContent: string): ParsedTicket[] {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvRow[];

  const tickets: ParsedTicket[] = [];

  for (const row of records) {
    const key = findColumn(row, ['Issue key', 'Key', 'Issue Key', 'key']);
    const summary = findColumn(row, ['Summary', 'Title', 'summary', 'title']);

    if (key && summary) {
      tickets.push({ key, summary });
    }
  }

  return tickets;
}

function findColumn(row: CsvRow, possibleNames: string[]): string | null {
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name].trim() !== '') {
      return row[name].trim();
    }
  }
  return null;
}

export function validateCsvContent(csvContent: string): { valid: boolean; error?: string } {
  if (!csvContent || csvContent.trim() === '') {
    return { valid: false, error: 'CSV content is empty' };
  }

  try {
    const tickets = parseJiraCsv(csvContent);
    if (tickets.length === 0) {
      return {
        valid: false,
        error: 'No valid tickets found. Make sure your CSV has "Issue key" and "Summary" columns.',
      };
    }
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: `Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
