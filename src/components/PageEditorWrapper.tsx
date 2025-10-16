/**
 * Wrapper component to integrate Lexical Playground Editor into our project
 */

import './PageEditor/excalidraw-isolation.css';
import { LexicalExtensionComposer } from '@lexical/react/LexicalExtensionComposer';
import { LexicalCollaboration } from '@lexical/react/LexicalCollaborationContext';
import { $createParagraphNode, $createTextNode, $getRoot, defineExtension } from 'lexical';
import { useMemo } from 'react';

// Import playground components
import { SettingsContext } from './PageEditor/context/SettingsContext';
import { SharedHistoryContext } from './PageEditor/context/SharedHistoryContext';
import { ToolbarContext } from './PageEditor/context/ToolbarContext';
import { FlashMessageContext } from './PageEditor/context/FlashMessageContext';
import { TableContext } from './PageEditor/plugins/TablePlugin';
import CustomEditor from './CustomEditor';
import PlaygroundNodes from './PageEditor/nodes/PlaygroundNodes';
import PlaygroundEditorTheme from './PageEditor/themes/PlaygroundEditorTheme';
import { buildHTMLConfig } from './PageEditor/buildHTMLConfig';

// Import playground CSS
import './PageEditor/index.css';

interface PageEditorWrapperProps {
  initialContent?: string;
  onSave: (content: string) => void;
  onCancel: () => void;
}

function $prepopulateFromContent(content: string) {
  const root = $getRoot();
  if (root.getFirstChild() === null && content) {
    try {
      // Try to parse as JSON first (Lexical format)
      JSON.parse(content);
      // If it's valid JSON, let the editor handle it via parseEditorState
      return;
    } catch {
      // If not JSON, treat as plain text
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode(content));
      root.append(paragraph);
    }
  }
}

export default function PageEditorWrapper({ 
  initialContent = '', 
  onSave, 
  onCancel 
}: PageEditorWrapperProps) {
  
  const extension = useMemo(
    () =>
      defineExtension({
        $initialEditorState: initialContent ? () => $prepopulateFromContent(initialContent) : undefined,
        html: buildHTMLConfig(),
        name: '@lexical/page-editor',
        namespace: 'PageEditor',
        nodes: PlaygroundNodes,
        theme: PlaygroundEditorTheme,
      }),
    [initialContent],
  );

  return (
    <SettingsContext>
      <LexicalCollaboration>
        <LexicalExtensionComposer extension={extension} contentEditable={null}>
          <SharedHistoryContext>
            <TableContext>
              <FlashMessageContext>
                <ToolbarContext>
                  <div className="editor-shell page-editor-container h-full flex flex-col rounded-lg very good shadow-lg flex-grow mx-4 mb-4">
                    <CustomEditor onSave={onSave} onCancel={onCancel} />
                  </div>
                </ToolbarContext>
              </FlashMessageContext>
            </TableContext>
          </SharedHistoryContext>
        </LexicalExtensionComposer>
      </LexicalCollaboration>
    </SettingsContext>
  );
}