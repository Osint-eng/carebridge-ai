/**
 * Robust Client-Side Clinical Document Text Extractor
 * Supports: .txt, .md, .rtf, .docx, and digital .pdf files
 */

export async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  // 1. Plain text / Markdown / RTF / CSV
  if (
    fileName.endsWith('.txt') ||
    fileName.endsWith('.text') ||
    fileName.endsWith('.md') ||
    fileName.endsWith('.rtf') ||
    fileName.endsWith('.csv') ||
    file.type.startsWith('text/')
  ) {
    try {
      const text = await readFileAsText(file);
      if (text && text.trim().length > 0) {
        return cleanExtractedText(text);
      }
    } catch (err) {
      console.warn('Direct text read failed', err);
    }
  }

  // 2. Microsoft Word Document (.docx)
  if (fileName.endsWith('.docx')) {
    try {
      const text = await extractTextFromDocx(file);
      if (text && text.trim().length > 50) {
        return cleanExtractedText(text);
      }
    } catch (err) {
      console.warn('DOCX extraction error', err);
    }
  }

  // 3. PDF Document (.pdf)
  if (fileName.endsWith('.pdf') || file.type === 'application/pdf') {
    try {
      const text = await extractTextFromPdf(file);
      if (text && text.trim().length > 50) {
        return cleanExtractedText(text);
      }
    } catch (err) {
      console.warn('PDF extraction error', err);
    }
  }

  // 4. Fallback
  try {
    const raw = await readFileAsText(file);
    const cleaned = cleanExtractedText(raw);
    if (cleaned.length > 50) return cleaned;
  } catch {
    // ignore
  }

  throw new Error(
    `Unable to extract text from "${file.name}". If this is a scanned image, please paste the clinical text into the "Paste Discharge Text" tab.`
  );
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof file.text === 'function') {
      file.text().then(resolve).catch(reject);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, 'utf-8');
  });
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    if (typeof file.arrayBuffer === 'function') {
      file.arrayBuffer().then(resolve).catch(reject);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

async function extractTextFromPdf(file: File): Promise<string> {
  const buffer = await readFileAsArrayBuffer(file);
  const bytes = new Uint8Array(buffer);
  let binaryStr = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const sub = bytes.subarray(i, i + chunkSize);
    binaryStr += String.fromCharCode.apply(null, Array.from(sub));
  }

  const extractedLines: string[] = [];
  const tjRegex = /\(([^)]+)\)\s*(?:Tj|'|")/g;
  let match: RegExpExecArray | null;
  while ((match = tjRegex.exec(binaryStr)) !== null) {
    const cleaned = unescapePdfString(match[1]);
    if (cleaned && cleaned.trim().length > 1) extractedLines.push(cleaned.trim());
  }

  // Also try stream content
  const streamRegex = /stream[\r\n]+([\s\S]*?)endstream/g;
  while ((match = streamRegex.exec(binaryStr)) !== null) {
    const streamContent = match[1];
    const textMatches = streamContent.match(/\(([\x20-\x7E]{3,})\)/g);
    if (textMatches) {
      textMatches.forEach((t) => {
        const cleaned = t.slice(1, -1).replace(/\\n/g, ' ').replace(/\\r/g, '');
        if (cleaned.length > 2) extractedLines.push(cleaned);
      });
    }
  }

  return extractedLines.join(' ');
}

function unescapePdfString(s: string): string {
  return s
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\');
}

async function extractTextFromDocx(file: File): Promise<string> {
  // Minimal DOCX support: look for <w:t> tags in the zip XML
  const buffer = await readFileAsArrayBuffer(file);
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (let i = 0; i < Math.min(bytes.length, 500000); i++) {
    str += String.fromCharCode(bytes[i]);
  }
  const texts: string[] = [];
  const re = /<w:t[^>]*>([^<]+)<\/w:t>/g;
  let m;
  while ((m = re.exec(str)) !== null) {
    texts.push(m[1]);
  }
  return texts.join(' ');
}

function cleanExtractedText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
