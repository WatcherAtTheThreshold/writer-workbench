// Export utilities for Writer Workbench
import { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak } from 'docx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import { collectChaptersInOrder, countWords } from './helpers';
import { mdToPlainText } from './markdown';

// Export as Markdown
export function exportAsMarkdown(node, filename) {
  let md = "";

  if (node.type === "chapter") {
    md = `# ${node.title}\n\n${node.content || ""}`;
  } else if (node.type === "folder") {
    const chapters = collectChaptersInOrder(node);
    md = chapters.map(ch => `# ${ch.title}\n\n${ch.content || ""}`).join("\n\n---\n\n");
  }

  if (!md.trim()) {
    alert("Nothing to export - the selected item has no content.");
    return;
  }

  const blob = new Blob([md], { type: "text/markdown" });
  saveAs(blob, filename || `${node.title.replace(/\s+/g, "_")}.md`);
}

// Export as JSON (full project backup)
export function exportAsJSON(project) {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
  saveAs(blob, `${project.name.replace(/\s+/g, "_")}.writer.json`);
}

// Export as DOCX (Word document) - great for Google Docs
export async function exportAsDocx(node, filename) {
  const chapters = node.type === "chapter" ? [node] : collectChaptersInOrder(node);

  if (!chapters.length) {
    alert("Nothing to export - no chapters found.");
    return;
  }

  const children = [];

  // Add title page for books
  if (node.type === "folder") {
    children.push(
      new Paragraph({
        text: node.title,
        heading: HeadingLevel.TITLE,
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `${chapters.length} chapters • ${chapters.reduce((sum, ch) => sum + countWords(ch.content || ''), 0).toLocaleString()} words`,
            italics: true,
            color: "666666",
          }),
        ],
        spacing: { after: 800 },
      }),
      new Paragraph({ children: [new PageBreak()] })
    );
  }

  // Add each chapter
  chapters.forEach((ch, idx) => {
    // Chapter number
    if (chapters.length > 1) {
      children.push(
        new Paragraph({
          text: `Chapter ${idx + 1}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 100 },
        })
      );
    }

    // Chapter title
    children.push(
      new Paragraph({
        text: ch.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 300 },
      })
    );

    // Chapter content - convert markdown to paragraphs
    const plainText = mdToPlainText(ch.content || "");
    const paragraphs = plainText.split(/\n\n+/);

    paragraphs.forEach(para => {
      if (para.trim()) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: para.trim() })],
            spacing: { after: 200 },
          })
        );
      }
    });

    // Add page break between chapters (except last one)
    if (idx < chapters.length - 1) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename || `${node.title.replace(/\s+/g, "_")}.docx`);
}

// Export as PDF
export async function exportAsPdf(node, filename) {
  const chapters = node.type === "chapter" ? [node] : collectChaptersInOrder(node);

  if (!chapters.length) {
    alert("Nothing to export - no chapters found.");
    return;
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  const addText = (text, fontSize, isBold = false, color = '#000000') => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    pdf.setTextColor(color);

    const lines = pdf.splitTextToSize(text, maxWidth);
    const lineHeight = fontSize * 0.5;

    lines.forEach(line => {
      if (yPosition + lineHeight > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.text(line, margin, yPosition);
      yPosition += lineHeight;
    });

    return lines.length * lineHeight;
  };

  const addSpace = (space) => {
    yPosition += space;
    if (yPosition > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }
  };

  // Add title page for books
  if (node.type === "folder") {
    yPosition = pageHeight / 3;
    addText(node.title, 28, true);
    addSpace(10);
    const wordCount = chapters.reduce((sum, ch) => sum + countWords(ch.content || ''), 0);
    addText(`${chapters.length} chapters • ${wordCount.toLocaleString()} words`, 12, false, '#666666');
    pdf.addPage();
    yPosition = margin;
  }

  // Add each chapter
  chapters.forEach((ch, idx) => {
    if (idx > 0) {
      pdf.addPage();
      yPosition = margin;
    }

    // Chapter number
    if (chapters.length > 1) {
      addText(`Chapter ${idx + 1}`, 10, false, '#999999');
      addSpace(3);
    }

    // Chapter title
    addText(ch.title, 18, true);
    addSpace(8);

    // Chapter content
    const plainText = mdToPlainText(ch.content || "");
    const paragraphs = plainText.split(/\n\n+/);

    paragraphs.forEach(para => {
      if (para.trim()) {
        addText(para.trim(), 11);
        addSpace(5);
      }
    });
  });

  pdf.save(filename || `${node.title.replace(/\s+/g, "_")}.pdf`);
}
