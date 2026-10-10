/**
 * Parses CSV text into rows of cells following RFC 4180: fields may be quoted,
 * quoted fields may contain delimiters, line breaks and escaped quotes ("").
 *
 * @param text The CSV text to parse.
 * @param maxRows The maximum number of rows to return, parsing stops after this.
 * @returns the parsed rows and whether more rows were available.
 */
export function parseCsv(
  text: string,
  maxRows = Infinity
): { rows: string[][]; truncated: boolean } {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  let hasContent = false;

  const endRow = () => {
    row.push(cell);
    rows.push(row);
    row = [];
    cell = "";
    hasContent = false;
  };

  // strip the byte order mark that spreadsheet apps commonly prepend.
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  for (let i = 0; i < input.length; i++) {
    if (rows.length >= maxRows) {
      return { rows, truncated: true };
    }

    const char = input[i];

    if (inQuotes) {
      if (char !== '"') {
        cell += char;
      } else if (input[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = false;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      hasContent = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
      hasContent = true;
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[i + 1] === "\n") {
        i++;
      }
      endRow();
    } else {
      cell += char;
      hasContent = true;
    }
  }

  if (hasContent) {
    if (rows.length >= maxRows) {
      return { rows, truncated: true };
    }
    endRow();
  }

  return { rows, truncated: false };
}
