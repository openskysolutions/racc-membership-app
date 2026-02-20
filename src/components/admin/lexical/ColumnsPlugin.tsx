import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';

export default function ColumnsPlugin({ skipNextChange }: { skipNextChange?: React.MutableRefObject<number> }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Plugin is registered, column nodes handle their own rendering
    // Store the ref in the editor for the toolbar to access
    if (skipNextChange) {
      (editor as any)._skipNextChange = skipNextChange;
    }
    return () => {};
  }, [editor, skipNextChange]);

  return null;
}
