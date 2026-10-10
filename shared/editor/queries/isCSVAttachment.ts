import type { Node as ProsemirrorNode } from "prosemirror-model";
import { NodeSelection } from "prosemirror-state";
import type { EditorState } from "prosemirror-state";
import { isPDFAttachment } from "./isPDFAttachment";

/**
 * Determines whether an attachment node represents a CSV file. Falls back to
 * the filename extension when the contentType is missing or generic, as some
 * browsers report CSV files as application/vnd.ms-excel or octet-stream.
 *
 * @param node The attachment node to check.
 * @returns true if the attachment is a CSV file.
 */
export function isCSVAttachment(node: ProsemirrorNode): boolean {
  if (node.attrs.contentType === "text/csv") {
    return true;
  }

  return /\.csv$/i.test(node.attrs.title ?? "");
}

/**
 * Determines whether an attachment node can be previewed inline.
 *
 * @param node The attachment node to check.
 * @returns true if the attachment is a PDF or CSV file.
 */
export function isPreviewableAttachment(node: ProsemirrorNode): boolean {
  return isPDFAttachment(node) || isCSVAttachment(node);
}

/**
 * Determines whether the current selection is an attachment that can be
 * previewed inline.
 *
 * @param state The editor state.
 * @returns true if a previewable attachment is selected.
 */
export function isPreviewableAttachmentActive(state: EditorState): boolean {
  const { selection } = state;
  return (
    selection instanceof NodeSelection &&
    selection.node.type === state.schema.nodes.attachment &&
    isPreviewableAttachment(selection.node)
  );
}
