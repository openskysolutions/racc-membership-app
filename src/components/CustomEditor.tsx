/**
 * Custom Editor component that wraps the playground editor with our save/cancel functionality
 */

import { useState } from 'react';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';

// Import playground components we need
import { useSettings } from './PageEditor/context/SettingsContext';
import { useSharedHistoryContext } from './PageEditor/context/SharedHistoryContext';
import CustomToolbarPlugin from './CustomToolbarPlugin';

// Import all the plugins from the original editor
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin';
import { ClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';

// Import additional plugins
import DragDropPaste from './PageEditor/plugins/DragDropPastePlugin';
import AutoEmbedPlugin from './PageEditor/plugins/AutoEmbedPlugin';
import AutoLinkPlugin from './PageEditor/plugins/AutoLinkPlugin';
import CollapsiblePlugin from './PageEditor/plugins/CollapsiblePlugin';
import ComponentPickerPlugin from './PageEditor/plugins/ComponentPickerPlugin';
import ImagesPlugin from './PageEditor/plugins/ImagesPlugin';
import KeywordsPlugin from './PageEditor/plugins/KeywordsPlugin';
import { LayoutPlugin } from './PageEditor/plugins/LayoutPlugin/LayoutPlugin';
import LinkPlugin from './PageEditor/plugins/LinkPlugin';
import MarkdownShortcutPlugin from './PageEditor/plugins/MarkdownShortcutPlugin';
import MentionsPlugin from './PageEditor/plugins/MentionsPlugin';
import PageBreakPlugin from './PageEditor/plugins/PageBreakPlugin';
import PollPlugin from './PageEditor/plugins/PollPlugin';
import EquationsPlugin from './PageEditor/plugins/EquationsPlugin';
import ExcalidrawPlugin from './PageEditor/plugins/ExcalidrawPlugin';
import TwitterPlugin from './PageEditor/plugins/TwitterPlugin';
import YouTubePlugin from './PageEditor/plugins/YouTubePlugin';
import FigmaPlugin from './PageEditor/plugins/FigmaPlugin';

import ContentEditable from './PageEditor/ui/ContentEditable';
import FloatingLinkEditorPlugin from './PageEditor/plugins/FloatingLinkEditorPlugin';
import TableCellActionMenuPlugin from './PageEditor/plugins/TableActionMenuPlugin';
import DraggableBlockPlugin from './PageEditor/plugins/DraggableBlockPlugin';
import CodeActionMenuPlugin from './PageEditor/plugins/CodeActionMenuPlugin';
import TableHoverActionsPlugin from './PageEditor/plugins/TableHoverActionsPlugin';
import FloatingTextFormatToolbarPlugin from './PageEditor/plugins/FloatingTextFormatToolbarPlugin';

interface CustomEditorProps {
  onSave: (content: string) => void;
  onCancel: () => void;
}

export default function CustomEditor({ onSave, onCancel }: CustomEditorProps) {
  const { historyState } = useSharedHistoryContext();
  const {
    settings: {
      hasLinkAttributes,
      tableCellMerge,
      tableCellBackgroundColor,
      tableHorizontalScroll,
    },
  } = useSettings();
  
  const isEditable = useLexicalEditable();
  const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLDivElement | null>(null);

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  const placeholder = 'Start typing your page content. You can add headings, paragraphs, lists, tables, and more...';

  return (
    <>
      {/* Custom Toolbar with Save/Cancel */}
      <CustomToolbarPlugin onSave={onSave} onCancel={onCancel} />
      
      <div className="editor-container h-full flex flex-col flex-grow">
        {/* Core Plugins */}
        <DragDropPaste />
        <AutoFocusPlugin />
        <ClearEditorPlugin />
        <ComponentPickerPlugin />
        <AutoEmbedPlugin />
        <MentionsPlugin />
        <HashtagPlugin />
        <KeywordsPlugin />
        <AutoLinkPlugin />

        {/* Rich Text Editor */}
        <HistoryPlugin externalHistoryState={historyState} />
        <RichTextPlugin
          contentEditable={
            <div className="editor-scroller">
              <div className="editor" ref={onRef}>
                <ContentEditable placeholder={placeholder} />
              </div>
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        
        {/* Content Plugins */}
        <MarkdownShortcutPlugin />
        <ListPlugin />
        <CheckListPlugin />
        <TablePlugin
          hasCellMerge={tableCellMerge}
          hasCellBackgroundColor={tableCellBackgroundColor}
          hasHorizontalScroll={tableHorizontalScroll}
        />
        <ImagesPlugin />
        <LinkPlugin hasLinkAttributes={hasLinkAttributes} />
        <PollPlugin />
        <TwitterPlugin />
        <YouTubePlugin />
        <FigmaPlugin />
        <ClickableLinkPlugin disabled={isEditable} />
        <HorizontalRulePlugin />
        <EquationsPlugin />
        <ExcalidrawPlugin />
        <TabIndentationPlugin maxIndent={7} />
        <CollapsiblePlugin />
        <PageBreakPlugin />
        <LayoutPlugin />

        {/* Floating Plugins */}
        {floatingAnchorElem && (
          <>
            <FloatingLinkEditorPlugin
              anchorElem={floatingAnchorElem}
              isLinkEditMode={false}
              setIsLinkEditMode={() => {}}
            />
            <TableCellActionMenuPlugin
              anchorElem={floatingAnchorElem}
              cellMerge={true}
            />
          </>
        )}
        {floatingAnchorElem && (
          <>
            <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
            <CodeActionMenuPlugin anchorElem={floatingAnchorElem} />
            <TableHoverActionsPlugin anchorElem={floatingAnchorElem} />
            <FloatingTextFormatToolbarPlugin
              anchorElem={floatingAnchorElem}
              setIsLinkEditMode={() => {}}
            />
          </>
        )}
      </div>
    </>
  );
}