/**
 * Custom toolbar plugin for our page editor with Save/Cancel functionality
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useState } from 'react';

// Import the original toolbar plugin
import OriginalToolbarPlugin from './PageEditor/plugins/ToolbarPlugin';

interface CustomToolbarPluginProps {
  onSave: (content: string) => void;
  onCancel: () => void;
}

export default function CustomToolbarPlugin({ onSave, onCancel }: CustomToolbarPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [currentContent, setCurrentContent] = useState<string>('');

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      const serialized = JSON.stringify(editorState.toJSON());
      setCurrentContent(serialized);
    });
  }, [editor]);

  const handleSave = () => {
    console.log('Saving content:', currentContent);
    onSave(currentContent);
  };

  return (
    <div className="toolbar-wrapper flex flex-col">
      {/* Original playground toolbar */}
      <OriginalToolbarPlugin 
        editor={editor}
        activeEditor={activeEditor}
        setActiveEditor={setActiveEditor}
        setIsLinkEditMode={() => {}}
        onCancel={onCancel}
        handleSave={handleSave}
      />
      
      {/* Custom save/cancel actions */}
      {/* <div className="toolbar-actions border-t p-4 bg-gray-50 flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="h-8 px-2"
        >
          <X className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          className="h-8 px-2"
        >
          <Save className="h-4 w-4" />
        </Button>
      </div> */}
    </div>
  );
}