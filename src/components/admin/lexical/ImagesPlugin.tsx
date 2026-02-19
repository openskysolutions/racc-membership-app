import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { 
  COMMAND_PRIORITY_EDITOR, 
  PASTE_COMMAND, 
  DROP_COMMAND, 
  createCommand, 
  LexicalCommand,
  $insertNodes,
  $isRootOrShadowRoot,
  $createParagraphNode,
  FORMAT_ELEMENT_COMMAND,
  $getSelection,
  $isNodeSelection,
  ElementFormatType,
  COMMAND_PRIORITY_CRITICAL,
} from 'lexical';
import { $createImageNode, $isImageNode } from './ImageNode';
import { $wrapNodeInElement } from '@lexical/utils';

export type InsertImagePayload = {
  src: string;
  altText?: string;
};

export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> =
  createCommand('INSERT_IMAGE_COMMAND');

export default function ImagesPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Register INSERT_IMAGE_COMMAND
    const removeInsertImageListener = editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (payload: InsertImagePayload) => {
        editor.update(() => {
          const imageNode = $createImageNode({ 
            src: payload.src, 
            alt: payload.altText || '' 
          });
          $insertNodes([imageNode]);
          if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
            $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd();
          }
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );

    // Handle paste
    const removePasteListener = editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            event.preventDefault();
            const file = items[i].getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = (e) => {
                const src = e.target?.result as string;
                editor.update(() => {
                  const imageNode = $createImageNode({ src });
                  $insertNodes([imageNode]);
                  if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
                    $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd();
                  }
                });
              };
              reader.readAsDataURL(file);
            }
            return true;
          }
        }
        return false;
      },
      COMMAND_PRIORITY_EDITOR
    );

    // Handle drop
    const removeDropListener = editor.registerCommand(
      DROP_COMMAND,
      (event: DragEvent) => {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;

        for (let i = 0; i < files.length; i++) {
          if (files[i].type.indexOf('image') !== -1) {
            event.preventDefault();
            const file = files[i];
            const reader = new FileReader();
            reader.onload = (e) => {
              const src = e.target?.result as string;
              editor.update(() => {
                const imageNode = $createImageNode({ src });
                $insertNodes([imageNode]);
                if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
                  $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd();
                }
              });
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
      COMMAND_PRIORITY_EDITOR
    );

    // Handle FORMAT_ELEMENT_COMMAND for image alignment
    const removeFormatListener = editor.registerCommand(
      FORMAT_ELEMENT_COMMAND,
      (format: ElementFormatType) => {
        console.log('FORMAT_ELEMENT_COMMAND received:', format);
        const selection = $getSelection();
        console.log('Selection type:', selection?.constructor.name);
        if ($isNodeSelection(selection)) {
          const nodes = selection.getNodes();
          console.log('Selected nodes:', nodes.map(n => n.getType()));
          let updated = false;
          for (const node of nodes) {
            if ($isImageNode(node)) {
              console.log('Updating image node format to:', format);
              const writableNode = node.getWritable();
              console.log('Current format:', writableNode.__format);
              writableNode.__format = format;
              console.log('New format:', writableNode.__format);
              updated = true;
            }
          }
          console.log('Image format updated:', updated);
          return updated;
        }
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );

    return () => {
      removeInsertImageListener();
      removePasteListener();
      removeDropListener();
      removeFormatListener();
    };
  }, [editor]);

  return null;
}
