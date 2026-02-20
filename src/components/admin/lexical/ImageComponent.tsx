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
import { useCallback, useEffect, useRef } from 'react';

interface ImageComponentProps {
  src: string;
  alt: string;
  nodeKey: NodeKey;
  format: string;
}

export default function ImageComponent({
  src,
  alt,
  nodeKey,
  format,
}: ImageComponentProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);

  const onDelete = useCallback(
    (payload: KeyboardEvent) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        payload.preventDefault();
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
          if (event.target === imageRef.current) {
            if (!event.shiftKey) {
              clearSelection();
            }
            setSelected(true);
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW
      )
    );
  }, [clearSelection, editor, isSelected, nodeKey, onDelete, setSelected]);

  const alignment = format === 'left' ? 'left' : 
                   format === 'center' ? 'center' : 
                   format === 'right' ? 'right' : 'left';

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
        width: '100%',
        textAlign: alignment as any,
      }}
    >
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        draggable="false"
        style={{
          maxWidth: '100%',
          height: 'auto',
          display: 'inline-block',
          margin: '0.5rem auto',
          cursor: 'pointer',
          outline: isSelected ? '2px solid #3b82f6' : 'none',
          outlineOffset: '2px',
          transition: 'outline 0.2s',
        }}
      />
    </div>
  );
}
