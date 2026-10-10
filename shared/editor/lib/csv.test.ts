import { parseCsv } from "./csv";

describe("parseCsv", () => {
  it("parses simple rows", () => {
    expect(parseCsv("a,b,c\n1,2,3\n").rows).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("handles CRLF and a missing trailing newline", () => {
    expect(parseCsv("a,b\r\n1,2").rows).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("handles quoted fields with delimiters, newlines and escaped quotes", () => {
    expect(parseCsv('"a,b","line1\nline2","say ""hi"""\n').rows).toEqual([
      ["a,b", "line1\nline2", 'say "hi"'],
    ]);
  });

  it("keeps empty cells", () => {
    expect(parseCsv("a,,c\n,,\n").rows).toEqual([
      ["a", "", "c"],
      ["", "", ""],
    ]);
  });

  it("keeps blank lines as single empty cell rows", () => {
    expect(parseCsv("a\n\nb").rows).toEqual([["a"], [""], ["b"]]);
  });

  it("strips a byte order mark", () => {
    expect(parseCsv("﻿a,b").rows).toEqual([["a", "b"]]);
  });

  it("returns no rows for empty input", () => {
    expect(parseCsv("")).toEqual({ rows: [], truncated: false });
  });

  it("stops at maxRows and reports truncation", () => {
    const result = parseCsv("a\nb\nc\nd", 2);

    expect(result.rows).toEqual([["a"], ["b"]]);
    expect(result.truncated).toBe(true);
  });

  it("does not report truncation when rows fit exactly", () => {
    const result = parseCsv("a\nb\n", 2);

    expect(result.rows).toEqual([["a"], ["b"]]);
    expect(result.truncated).toBe(false);
  });
});
