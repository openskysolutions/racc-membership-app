import React, { useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

/**
 * Renders a plain-text bio with paragraph and bullet-point support.
 * - Double newlines = paragraph break
 * - Lines starting with •, - or * = bullet list item
 */
export function BioDisplay({ text }: { text: string }) {
  if (!text) return null;

  const paragraphs = text.split(/\n\n+/);

  return (
    <div className="text-muted-foreground leading-relaxed space-y-3">
      {paragraphs.map((para, i) => {
        const lines = para.split('\n');
        const resultNodes: React.ReactNode[] = [];
        let bulletGroup: string[] = [];

        const flushBullets = (key: string) => {
          if (bulletGroup.length === 0) return;
          resultNodes.push(
            <ul key={key} className="list-disc list-inside space-y-0.5">
              {bulletGroup.map((item, k) => <li key={k}>{item}</li>)}
            </ul>
          );
          bulletGroup = [];
        };

        lines.forEach((line, j) => {
          const match = line.match(/^[•\-\*]\s(.*)$/);
          if (match) {
            bulletGroup.push(match[1]);
          } else {
            flushBullets(`b-${j}`);
            if (line.trim()) resultNodes.push(<p key={j}>{line}</p>);
          }
        });
        flushBullets('b-end');

        return (
          <div key={i} className={resultNodes.length > 1 ? 'space-y-1' : ''}>
            {resultNodes}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Textarea with a simple formatting toolbar.
 * Supports inserting bullet points (•) and uses double-newline for paragraphs.
 */
export function BioEditor({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // After React re-renders from an onChange call, restore scroll + cursor position.
  // Using a ref (not state) so it doesn't trigger an extra render.
  const pendingRestore = useRef<{ scrollTop: number; selStart: number; selEnd: number; scrollToEnd?: boolean } | null>(null);

  // Runs after every render; only acts when a restore is pending.
  React.useEffect(() => {
    const restore = pendingRestore.current;
    if (!restore || !textareaRef.current) return;
    pendingRestore.current = null;
    const textarea = textareaRef.current;
    // scrollToEnd: new content added past the visible bottom — scroll down to show cursor.
    // Otherwise: restore the exact saved position to prevent jump-to-top.
    textarea.scrollTop = restore.scrollToEnd ? textarea.scrollHeight : restore.scrollTop;
    textarea.focus();
    textarea.setSelectionRange(restore.selStart, restore.selEnd);
  });

  const insertBullet = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = value;

    if (start !== end) {
      // Selection: prefix each selected line with a bullet
      const before = text.substring(0, start);
      const selected = text.substring(start, end);
      const after = text.substring(end);
      const newSelected = selected
        .split('\n')
        .map(line => (/^[•\-\*]\s/.test(line) ? line : `• ${line}`))
        .join('\n');
      pendingRestore.current = { scrollTop: textarea.scrollTop, selStart: start, selEnd: start + newSelected.length };
      onChange(before + newSelected + after);
    } else {
      // No selection
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      const lineEnd = text.indexOf('\n', start);
      const currentLine = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd);

      if (currentLine.trim() === '' || /^[•\-\*]\s/.test(currentLine)) {
        // Empty or already-bulleted line: append a new bullet line
        const insertPos = lineEnd === -1 ? text.length : lineEnd;
        const prefix = text.length === 0 || text[insertPos - 1] === '\n' ? '• ' : '\n• ';
        const newCursor = insertPos + prefix.length;
        pendingRestore.current = { scrollTop: textarea.scrollTop, selStart: newCursor, selEnd: newCursor };
        onChange(text.substring(0, insertPos) + prefix + text.substring(insertPos));
      } else {
        // Non-empty, non-bulleted line: prefix it
        const newCursor = start + 2;
        pendingRestore.current = { scrollTop: textarea.scrollTop, selStart: newCursor, selEnd: newCursor };
        onChange(text.substring(0, lineStart) + '• ' + text.substring(lineStart));
      }
    }
  }, [value, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter') return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart: pos, selectionEnd: selEnd } = textarea;
    const text = value;

    const lineStart = text.lastIndexOf('\n', pos - 1) + 1;
    const lineEnd = text.indexOf('\n', pos);
    const currentLine = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd);
    const bulletMatch = currentLine.match(/^([•\-\*])\s(.*)$/);

    if (!bulletMatch) return; // not a bullet line — let the browser handle it normally

    e.preventDefault();

    const contentAfterBullet = bulletMatch[2];

    if (contentAfterBullet === '' && pos === lineStart + bulletMatch[0].length) {
      // Empty bullet line: remove the bullet and end the list (plain newline)
      const newCursor = lineStart + 1;
      pendingRestore.current = { scrollTop: textarea.scrollTop, selStart: newCursor, selEnd: newCursor };
      onChange(text.substring(0, lineStart) + '\n' + text.substring(lineEnd === -1 ? text.length : lineEnd));
    } else {
      // Non-empty bullet line: insert a new bullet on the next line
      const insertPos = pos < (lineEnd === -1 ? text.length : lineEnd) ? pos : (lineEnd === -1 ? text.length : lineEnd);
      const newCursor = insertPos + 3; // past \n, •, space
      // If cursor is on the last line (lineEnd === -1), the new bullet is below the fold — scroll to end.
      pendingRestore.current = { scrollTop: textarea.scrollTop, selStart: newCursor, selEnd: newCursor, scrollToEnd: lineEnd === -1 };
      onChange(text.substring(0, insertPos) + '\n• ' + text.substring(selEnd));
    }
  }, [value, onChange]);

  return (
    <div>
      <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-t-md border border-border border-b-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs font-normal border border-border"
          onClick={insertBullet}
          title="Add bullet point (•) to the current or selected lines"
        >
          • Bullet Point
        </Button>
        <span className="text-xs text-muted-foreground ml-auto">
          Press Enter twice to add a new paragraph or end a bullet list
        </span>
      </div>
      <Textarea
        ref={textareaRef}
        id="bio"
        name="bio"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={`Tell us about yourself or your business...\n\nTip: Click "• Bullet Point" above for bullet lists.\nPress Enter twice to end the list and start a new paragraph.`}
        rows={6}
        className="rounded-t-none font-mono text-sm"
      />
    </div>
  );
}
