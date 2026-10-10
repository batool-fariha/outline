import * as React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { parseCsv } from "../lib/csv";
import type { ComponentProps } from "../types";
import { sanitizeUrl } from "../../utils/urls";
import Flex from "../../components/Flex";
import { s } from "../../styles";
import { EditorStyleHelper } from "../styles/EditorStyleHelper";
import { Preview, Subtitle, Title } from "./Widget";

/** Files larger than this are not previewed, in bytes. */
const MAX_PREVIEW_BYTES = 1024 * 1024;

/** The maximum number of rows rendered in the preview. */
const MAX_PREVIEW_ROWS = 200;

type Props = ComponentProps & {
  /** Icon to display on the left side of the widget */
  icon: React.ReactNode;
  /** Title of the widget */
  title: React.ReactNode;
  /** Context, displayed to right of title */
  context?: React.ReactNode;
  /** Rendered instead of the preview if the file cannot be previewed */
  fallback: React.ReactNode;
};

/**
 * Renders an inline, read-only table preview of a CSV attachment. The file is
 * parsed client side and the first rows are shown, if the file is too large or
 * fails to load then the fallback is rendered instead.
 */
export default function CsvViewer({ fallback, ...props }: Props) {
  const { t } = useTranslation();
  const { node, isSelected } = props;
  const { href, size } = node.attrs;
  const [data, setData] = React.useState<{
    rows: string[][];
    truncated: boolean;
  } | null>(null);
  const [failed, setFailed] = React.useState(false);
  const url = sanitizeUrl(href);
  const tooLarge = !url || Number(size) > MAX_PREVIEW_BYTES;

  React.useEffect(() => {
    if (!url || tooLarge) {
      return;
    }

    const controller = new AbortController();

    fetch(url, { signal: controller.signal, credentials: "same-origin" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load CSV: ${response.status}`);
        }
        return response.text();
      })
      .then((text) => {
        const result = parseCsv(
          text.slice(0, MAX_PREVIEW_BYTES),
          MAX_PREVIEW_ROWS
        );
        if (!result.rows.length) {
          throw new Error("CSV is empty");
        }
        setData(result);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setFailed(true);
        }
      });

    return () => controller.abort();
  }, [url, tooLarge]);

  if (failed || tooLarge) {
    return <>{fallback}</>;
  }

  const [header, ...body] = data?.rows ?? [];

  return (
    <Wrapper
      contentEditable={false}
      className={
        isSelected ? "csv-wrapper ProseMirror-selectednode" : "csv-wrapper"
      }
    >
      <Flex gap={6} align="center">
        {props.icon}
        <Preview>
          <Title>{props.title}</Title>
          <Subtitle>{props.context}</Subtitle>
        </Preview>
      </Flex>
      <Scroll>
        {data ? (
          <table>
            <thead>
              <tr>
                {header.map((cell, index) => (
                  <th key={index}>{cell}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, index) => (
                    <td key={index}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Note>{t("Loading")}…</Note>
        )}
      </Scroll>
      {data?.truncated && (
        <Note>
          {t("Showing the first {{ count }} rows", { count: MAX_PREVIEW_ROWS })}
        </Note>
      )}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  position: relative;
  margin: 0 auto;
  max-width: 100%;
  overflow: hidden;
  box-shadow: 0 0 0 1px ${s("divider")};
  border-radius: ${EditorStyleHelper.blockRadius};
  padding: ${EditorStyleHelper.blockRadius};
`;

const Scroll = styled.div`
  margin-top: 6px;
  max-height: 400px;
  overflow: auto;

  table {
    border-collapse: collapse;
    font-size: 14px;
    line-height: 1.4;
    width: 100%;
  }

  th,
  td {
    border: 1px solid ${s("divider")};
    padding: 4px 8px;
    text-align: left;
    white-space: nowrap;
  }

  th {
    background: ${s("backgroundSecondary")};
    font-weight: 600;
    position: sticky;
    top: 0;
  }
`;

const Note = styled.div`
  color: ${s("textTertiary")};
  font-size: 13px;
  margin-top: 6px;
`;
