import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  NodeKey,
} from 'lexical';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function ColumnComponent({
  columnCount,
  nodeKey,
  children,
}: {
  columnCount: number;
  nodeKey: NodeKey;
  children: React.ReactNode;
}) {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const onDelete = useCallback(
    (event: KeyboardEvent) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        event.preventDefault();
        const node = $getNodeByKey(nodeKey);
        if (node) {
          node.remove();
        }
      }
      return false;
    },
    [isSelected, nodeKey]
  );

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        (event: MouseEvent) => {
          if (ref.current && ref.current.contains(event.target as Node)) {
            if (!isSelected) {
              setSelected(true);
            }
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(KEY_DELETE_COMMAND, onDelete, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_BACKSPACE_COMMAND, onDelete, COMMAND_PRIORITY_LOW)
    );
  }, [clearSelection, editor, isSelected, nodeKey, onDelete, setSelected]);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        outline: isSelected ? '2px solid #3b82f6' : isHovered ? '1px dashed #94a3b8' : 'none',
        borderRadius: '4px',
      }}
    >
      {(isHovered || isSelected) && (
        <div
          style={{
            position: 'absolute',
            top: '-24px',
            right: '0',
            background: '#3b82f6',
            color: 'white',
            fontSize: '12px',
            padding: '2px 8px',
            borderRadius: '4px',
            zIndex: 10,
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          <span>{columnCount} Columns</span>
          <button
            onClick={(e) => {
              e.preventDefault();
              editor.update(() => {
                const node = $getNodeByKey(nodeKey);
                if (node) {
                  node.remove();
                }
              });
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '0 4px',
              fontSize: '16px',
            }}
          >
            ×
          </button>
        </div>
      )}
      {children}
    </div>
  );
}
