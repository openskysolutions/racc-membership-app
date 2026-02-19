import { useEffect, useRef, useState } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { ClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $createParagraphNode, $createTextNode, ElementNode } from 'lexical';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { TRANSFORMERS } from '@lexical/markdown';

import './lexical/lexical-editor.css';
import ToolbarPlugin from '@/components/admin/lexical/ToolbarPluginEnhanced';
import ColumnsPlugin from '@/components/admin/lexical/ColumnsPlugin';
import { ColumnContainerNode, ColumnNode } from '@/components/admin/lexical/ColumnNodes';
import { ImageNode } from '@/components/admin/lexical/ImageNode';
import { VideoNode } from '@/components/admin/lexical/VideoNode';
import { FormButtonNode } from '@/components/admin/lexical/FormButtonNode';
import ImagesPlugin from '@/components/admin/lexical/ImagesPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { CustomHorizontalRuleNode } from '@/components/admin/lexical/nodes/CustomHorizontalRuleNode';
import { buildHTMLConfig } from '@/components/admin/lexical/buildHTMLConfig';

interface LexicalEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Component to handle onChange with debouncing
function OnChangePlugin({ onChange, skipNextChange }: { onChange: (html: string) => void; skipNextChange: React.MutableRefObject<number> }) {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    return editor.registerUpdateListener(({ editorState, tags }) => {
      console.log('Editor update:', { tags: Array.from(tags), skipUntil: skipNextChange.current, now: Date.now() });
      
      // Skip onChange for programmatic updates (like inserting columns)
      // Check if we're still in the skip window
      if (skipNextChange.current > Date.now()) {
        console.log('Skipping onChange - still in skip window');
        return;
      }
      
      // Debounce changes to prevent rapid firing
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log('Triggering onChange after debounce');
        editorState.read(() => {
          // Debug: Check what styles are on text nodes
          const root = $getRoot();
          let foundFontSize = false;
          root.getChildren().forEach((child, i) => {
            if (child instanceof ElementNode) {
              child.getChildren().forEach((textNode: any) => {
                if (textNode.getStyle) {
                  const style = textNode.getStyle();
                  console.log(`  Text node style:`, style);
                  if (style && style.includes('font-size')) {
                    foundFontSize = true;
                    console.log('✅ FOUND font-size in text node!');
                  }
                }
              });
            }
          });
          
          if (!foundFontSize) {
            console.warn('⚠️ NO font-size found in any text nodes!');
          }
          
          const html = $generateHtmlFromNodes(editor);
          console.log('Generated HTML sample:', html.substring(0, 500));
          
          // Check if font-size is in the HTML
          if (html.includes('font-size')) {
            console.log('✅ font-size IS in the generated HTML');
          } else {
            console.warn('⚠️ font-size NOT in the generated HTML');
          }
          
          onChange(html);
        });
      }, 1000); // 1 second debounce
    });
  }, [editor, onChange, skipNextChange]);
  
  return null;
}

// Component to set initial value
function InitialValuePlugin({ value }: { value: string }) {
  const [editor] = useLexicalComposerContext();
  const hasInitialized = useRef(false);
  
  useEffect(() => {
    // Only run once when we have a value
    if (!hasInitialized.current && value) {
      console.log('InitialValuePlugin: Initializing editor with HTML:', value.substring(0, 200));
      hasInitialized.current = true;
      
      editor.update(() => {
        const parser = new DOMParser();
        const dom = parser.parseFromString(value, 'text/html');
        
        // Log what we're parsing
        console.log('Parsed DOM body:', dom.body.innerHTML.substring(0, 200));
        
        // Check the actual span elements in the parsed DOM
        const spans = dom.body.querySelectorAll('span[style*="font-size"]');
        console.log(`Found ${spans.length} spans with font-size in parsed HTML`);
        spans.forEach((span, i) => {
          console.log(`  Span ${i}: style="${span.getAttribute('style')}"`);
        });
        
        // Generate nodes from DOM
        const nodes = $generateNodesFromDOM(editor, dom);
        
        console.log('Generated nodes:', nodes.length, nodes.map(n => n.getType()));
        
        const root = $getRoot();
        root.clear();
        
        if (nodes.length > 0) {
          nodes.forEach(node => root.append(node));
        } else {
          const paragraph = $createParagraphNode();
          paragraph.append($createTextNode(''));
          root.append(paragraph);
        }
        
        // Log the editor state after import
        const htmlAfter = $generateHtmlFromNodes(editor);
        console.log('Editor content after import:', htmlAfter.substring(0, 200));
        
        // Check if font-size survived
        const spansAfter = htmlAfter.match(/style="[^"]*font-size[^"]*"/g);
        console.log(`Font-size styles in output: ${spansAfter ? spansAfter.length : 0}`);
        if (spansAfter) {
          spansAfter.forEach((match, i) => console.log(`  Style ${i}: ${match}`));
        }
      });
    }
  }, [value, editor]); // Watch value so it can load when data arrives
  
  return null;
}

export default function LexicalEditor({ value, onChange, placeholder, className = '' }: LexicalEditorProps) {
  const skipNextChange = useRef(0); // Timestamp until which to skip onChange
  
  const initialConfig = {
    namespace: 'BlogEditor',
    html: buildHTMLConfig(),
    theme: {
      paragraph: 'lexical-paragraph',
      text: {
        bold: 'lexical-text-bold',
        italic: 'lexical-text-italic',
        underline: 'lexical-text-underline',
        strikethrough: 'lexical-text-strikethrough',
        code: 'lexical-text-code',
      },
      heading: {
        h1: 'lexical-h1',
        h2: 'lexical-h2',
        h3: 'lexical-h3',
        h4: 'lexical-h4',
        h5: 'lexical-h5',
        h6: 'lexical-h6',
      },
      list: {
        ul: 'lexical-ul',
        ol: 'lexical-ol',
        listitem: 'lexical-listitem',
        checklist: 'lexical-checklist',
        listitemChecked: 'lexical-listitem-checked',
        listitemUnchecked: 'lexical-listitem-unchecked',
      },
      quote: 'lexical-quote',
      code: 'lexical-code',
      link: 'lexical-link',
    },
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
      AutoLinkNode,
      CodeNode,
      CodeHighlightNode,
      ColumnContainerNode,
      ColumnNode,
      ImageNode,
      VideoNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      CustomHorizontalRuleNode,
      FormButtonNode,
    ],
    onError: (error: Error) => {
      console.error('Lexical error:', error);
    },
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <EditorWrapper 
        value={value} 
        onChange={onChange} 
        placeholder={placeholder} 
        className={className}
        skipNextChange={skipNextChange}
      />
    </LexicalComposer>
  );
}

// Separate component inside the composer context
function EditorWrapper({ value, onChange, placeholder, className, skipNextChange }: LexicalEditorProps & { skipNextChange: React.MutableRefObject<number> }) {
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [isLinkEditMode, setIsLinkEditMode] = useState(false);

  return (
    <div className={`lexical-editor-wrapper ${className}`}>
      <ToolbarPlugin 
        editor={editor}
        activeEditor={activeEditor}
        setActiveEditor={setActiveEditor}
        setIsLinkEditMode={setIsLinkEditMode}
      />
      <div className="lexical-editor-container">
        <RichTextPlugin
          contentEditable={<ContentEditable className="lexical-content-editable" />}
          placeholder={<div className="lexical-placeholder">{placeholder || 'Write your content here...'}</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <ListPlugin />
        <CheckListPlugin />
        <LinkPlugin />
        <ClickableLinkPlugin disabled={false} />
        <HorizontalRulePlugin />
        <TabIndentationPlugin />
        <TablePlugin 
          hasCellMerge={true}
          hasCellBackgroundColor={true}
        />
        <ColumnsPlugin skipNextChange={skipNextChange} />
        <ImagesPlugin />
        <OnChangePlugin onChange={onChange} skipNextChange={skipNextChange} />
        <InitialValuePlugin value={value} />
      </div>
    </div>
  );
}

