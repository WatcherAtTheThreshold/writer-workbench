// Markdown utilities using the 'marked' library
import { marked } from 'marked';

// Configure marked for better output
marked.setOptions({
  breaks: true, // Convert \n to <br>
  gfm: true,    // GitHub Flavored Markdown
});

// Convert Markdown to HTML with Tailwind-friendly classes
export function mdToHtml(md) {
  if (!md) return "";

  // Use marked for parsing, then we'll rely on Tailwind typography plugin
  // for styling via prose classes
  try {
    return marked.parse(md);
  } catch (e) {
    console.error('Markdown parsing error:', e);
    return md;
  }
}

// Convert Markdown to plain text (for exports)
export function mdToPlainText(md) {
  if (!md) return "";
  // Strip markdown formatting for plain text
  return md
    .replace(/#{1,6}\s?/g, '')           // Remove headings
    .replace(/\*\*(.+?)\*\*/g, '$1')     // Remove bold
    .replace(/\*(.+?)\*/g, '$1')         // Remove italic
    .replace(/`([^`]+)`/g, '$1')         // Remove inline code
    .replace(/\[(.+?)\]\([^)]+\)/g, '$1') // Remove links, keep text
    .replace(/^[-*]\s+/gm, '• ')         // Convert list markers
    .trim();
}
