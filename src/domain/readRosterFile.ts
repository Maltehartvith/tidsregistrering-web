import { readSheet } from "read-excel-file/browser";

export type RosterFilePerson = {
  name: string;
  email: string;
};

export async function readRosterFile(file: File): Promise<RosterFilePerson[]> {
  const records = isCsv(file) ? parseCsv(await file.text()) : await recordsFromSheet(file);
  const people = records
    .map(personFromRecord)
    .filter((person) => person.name || person.email);
  if (people.length === 0) throw new Error("Ingen rækker.");
  return people;
}

function isCsv(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".csv") || file.type === "text/csv" || file.type === "application/csv";
}

async function recordsFromSheet(file: File): Promise<Record<string, string>[]> {
  const rows = await readSheet(file);
  if (rows.length < 2) return [];
  const headers = rows[0].map((cell) => cellText(cell).toLowerCase());
  return rows.slice(1).map((row) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (!header) return;
      record[header] = cellText(row[index]);
    });
    return record;
  });
}

function cellText(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

function personFromRecord(record: Record<string, string>): RosterFilePerson {
  const fields = Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key.trim().toLowerCase(), value.trim()]),
  );
  return {
    name: fields.navn || fields.name || "",
    email: fields.email || fields["e-mail"] || fields.mail || "",
  };
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];
  const delimiter = delimiterFor(lines[0]);
  const headers = splitCsvLine(lines[0], delimiter).map((cell) => cell.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line, delimiter);
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (!header) return;
      record[header] = (cells[index] ?? "").trim();
    });
    return record;
  });
}

function delimiterFor(header: string): "," | ";" {
  const commas = splitCsvLine(header, ",").length;
  const semicolons = splitCsvLine(header, ";").length;
  return semicolons > commas ? ";" : ",";
}

function splitCsvLine(line: string, delimiter: "," | ";"): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index++;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (char === delimiter && !quoted) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells;
}
