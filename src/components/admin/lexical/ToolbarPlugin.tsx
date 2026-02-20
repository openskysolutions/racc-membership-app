import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback, useEffect, useState } from 'react';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
} from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import { $createHeadingNode, $createQuoteNode, HeadingTagType } from '@lexical/rich-text';
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { $createColumnContainerNode } from './ColumnNodes';
import { $insertNodeToNearestRoot } from '@lexical/utils';

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrike, setIsStrike] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrike(selection.hasFormat('strikethrough'));
    }
  }, []);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  const formatHeading = (headingSize: HeadingTagType) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(headingSize));
      }
    });
  };

  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode());
      }
    });
  };

  const insertColumns = (count: 2 | 3) => {
    editor.update(() => {
      const columnContainer = $createColumnContainerNode(count);
      $insertNodeToNearestRoot(columnContainer);
    });
  };

  return (
    <div className="lexical-toolbar">
      <button
        type="button"
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        className="toolbar-btn"
        aria-label="Undo"
      >
        ↶
      </button>
      <button
        type="button"
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        className="toolbar-btn"
        aria-label="Redo"
      >
        ↷
      </button>
      
      <div className="toolbar-divider" />
      
      <select
        className="toolbar-select"
        onChange={(e) => {
          const value = e.target.value;
          if (value === 'h1') formatHeading('h1');
          else if (value === 'h2') formatHeading('h2');
          else if (value === 'h3') formatHeading('h3');
          else if (value === 'h4') formatHeading('h4');
          else if (value === 'h5') formatHeading('h5');
          else if (value === 'h6') formatHeading('h6');
          e.target.value = '';
        }}
      >
        <option value="">Format</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
        <option value="h4">Heading 4</option>
        <option value="h5">Heading 5</option>
        <option value="h6">Heading 6</option>
      </select>
      
      <div className="toolbar-divider" />
      
      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
        className={`toolbar-btn ${isBold ? 'active' : ''}`}
        aria-label="Bold"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
        className={`toolbar-btn ${isItalic ? 'active' : ''}`}
        aria-label="Italic"
      >
        <em>I</em>
      </button>
      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
        className={`toolbar-btn ${isUnderline ? 'active' : ''}`}
        aria-label="Underline"
      >
        <u>U</u>
      </button>
      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
        className={`toolbar-btn ${isStrike ? 'active' : ''}`}
        aria-label="Strikethrough"
      >
        <s>S</s>
      </button>
      
      <div className="toolbar-divider" />
      
      <button
        type="button"
        onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
        className="toolbar-btn"
        aria-label="Bullet List"
      >
        • List
      </button>
      <button
        type="button"
        onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
        className="toolbar-btn"
        aria-label="Numbered List"
      >
        1. List
      </button>
      
      <div className="toolbar-divider" />
      
      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')}
        className="toolbar-btn"
        aria-label="Align Left"
      >
        ⫪
      </button>
      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')}
        className="toolbar-btn"
        aria-label="Align Center"
      >
        ≡
      </button>
      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')}
        className="toolbar-btn"
        aria-label="Align Right"
      >
        ⫫
      </button>
      
      <div className="toolbar-divider" />
      
      <button
        type="button"
        onClick={() => insertColumns(2)}
        className="toolbar-btn"
        aria-label="2 Columns"
      >
        ⫼ 2 Cols
      </button>
      <button
        type="button"
        onClick={() => insertColumns(3)}
        className="toolbar-btn"
        aria-label="3 Columns"
      >
        ⫼ 3 Cols
      </button>

      <style>{`
        .lexical-toolbar {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.5rem;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          flex-wrap: wrap;
        }
        
        .toolbar-btn {
          padding: 0.375rem 0.75rem;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 0.25rem;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.15s;
        }
        
        .toolbar-btn:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }
        
        .toolbar-btn.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
        
        .toolbar-select {
          padding: 0.375rem 0.5rem;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 0.25rem;
          cursor: pointer;
          font-size: 14px;
        }
        
        .toolbar-divider {
          width: 1px;
          height: 24px;
          background: #d1d5db;
          margin: 0 0.25rem;
        }
      `}</style>
    </div>
  );
}
