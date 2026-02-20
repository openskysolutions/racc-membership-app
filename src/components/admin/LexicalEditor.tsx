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
function OnChangePlugin({ onChange, skipNextChange, isInternalEdit }: { onChange: (html: string) => void; skipNextChange: React.MutableRefObject<number>; isInternalEdit: React.MutableRefObject<boolean> }) {
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
      
      // Mark that we're making an internal edit
      isInternalEdit.current = true;
      
      // Debounce changes to prevent rapid firing
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log('Triggering onChange after debounce');
        editorState.read(() => {
          // Debug: Check what styles are on text nodes
          const root = $getRoot();
          let foundFontSize = false;
          root.getChildren().forEach((child) => {
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
          
          // Reset the internal edit flag after a short delay
          setTimeout(() => {
            isInternalEdit.current = false;
          }, 100);
        });
      }, 500); // 500ms debounce - reduced from 1000ms
    });
  }, [editor, onChange, skipNextChange, isInternalEdit]);
  
  return null;
}

// Component to set initial value
function InitialValuePlugin({ value, isInternalEdit }: { value: string; isInternalEdit: React.MutableRefObject<boolean> }) {
  const [editor] = useLexicalComposerContext();
  const initializedValue = useRef<string>('');
  const isFirstLoad = useRef(true);
  
  useEffect(() => {
    // Skip if this is an internal edit (from user typing)
    if (isInternalEdit.current && !isFirstLoad.current) {
      console.log('InitialValuePlugin: Skipping - internal edit');
      return;
    }
    
    // Only run when we have a new value that hasn't been initialized yet
    if (value && initializedValue.current !== value) {
      console.log('InitialValuePlugin: Initializing editor with HTML:', value.substring(0, 200));
      initializedValue.current = value;
      isFirstLoad.current = false;
      
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
          // Filter nodes - only append element and decorator nodes to root
          // Text nodes must be wrapped in a paragraph
          nodes.forEach(node => {
            if (node.getType() === 'text') {
              // Wrap text nodes in a paragraph
              const paragraph = $createParagraphNode();
              paragraph.append(node);
              root.append(paragraph);
            } else {
              root.append(node);
            }
          });
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
  const isInternalEdit = useRef(false); // Track if changes are from internal edits
  
  const initialConfig = {
    namespace: 'BlogEditor',
    html: buildHTMLConfig(),
    editorState: undefined,
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
        isInternalEdit={isInternalEdit}
      />
    </LexicalComposer>
  );
}

// Separate component inside the composer context
function EditorWrapper({ value, onChange, placeholder, className, skipNextChange, isInternalEdit }: LexicalEditorProps & { skipNextChange: React.MutableRefObject<number>; isInternalEdit: React.MutableRefObject<boolean> }) {
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);
  const focusPositionRef = useRef<any>(null);

  // Preserve scroll position during updates
  useEffect(() => {
    const wrapper = editorWrapperRef.current;
    if (!wrapper) return;

    const handleScroll = () => {
      scrollPositionRef.current = wrapper.scrollTop;
    };

    wrapper.addEventListener('scroll', handleScroll, { passive: true });
    return () => wrapper.removeEventListener('scroll', handleScroll);
  }, []);

  // Aggressively prevent scroll during content updates
  useEffect(() => {
    const wrapper = editorWrapperRef.current;
    if (!wrapper) return;
    
    let scrollLocked = false;
    let lockTimeout: NodeJS.Timeout;
    
    const preventScroll = (e: Event) => {
      if (scrollLocked) {
        e.preventDefault();
        e.stopPropagation();
        wrapper.scrollTop = scrollPositionRef.current;
        return false;
      }
    };
    
    const unregister = editor.registerUpdateListener(({ dirtyElements, dirtyLeaves, editorState }) => {
      if (dirtyElements.size > 0 || dirtyLeaves.size > 0) {
        // Save current scroll and focus position
        const savedScroll = wrapper.scrollTop;
        scrollPositionRef.current = savedScroll;
        
        // Save selection/focus state
        editorState.read(() => {
          const selection = editor.getEditorState().read(() => editor._editorState._selection);
          focusPositionRef.current = selection;
        });
        
        scrollLocked = true;
        
        clearTimeout(lockTimeout);
        
        // Keep scroll locked for a bit after the update
        lockTimeout = setTimeout(() => {
          scrollLocked = false;
        }, 150); // Increased from 100ms
        
        // Restore scroll immediately and after each frame
        const restore = () => {
          if (wrapper.scrollTop !== savedScroll) {
            wrapper.scrollTop = savedScroll;
          }
        };
        
        restore();
        requestAnimationFrame(restore);
        requestAnimationFrame(() => requestAnimationFrame(restore));
        requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(restore)));
      }
    });

    wrapper.addEventListener('scroll', preventScroll, { capture: true });
    
    return () => {
      clearTimeout(lockTimeout);
      wrapper.removeEventListener('scroll', preventScroll, { capture: true });
      unregister();
    };
  }, [editor]);

  // Prevent Lexical's built-in scroll behavior
  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    // Override scrollIntoView on the root element
    const originalScrollIntoView = rootElement.scrollIntoView;
    rootElement.scrollIntoView = () => {
      // Do nothing - prevent automatic scrolling
    };

    return () => {
      rootElement.scrollIntoView = originalScrollIntoView;
    };
  }, [editor]);

  // Scroll editor into view when it receives focus
  useEffect(() => {
    const rootElement = editor.getRootElement();
    const wrapper = editorWrapperRef.current;
    if (!rootElement || !wrapper) return;

    let isFocused = false;

    const handleFocusIn = () => {
      // Only scroll on initial focus, not when already focused
      if (!isFocused) {
        isFocused = true;
        console.log('Editor focused - scrolling into view');
        
        // Calculate scroll position with offset from top
        const rect = wrapper.getBoundingClientRect();
        const offset = 160; // 100px from the top of the viewport
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const targetPosition = rect.top + scrollTop - offset;
        
        // Smooth scroll to the calculated position
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    };

    const handleClick = (e: MouseEvent) => {
      // If clicking inside the editor content, scroll into view
      if (rootElement.contains(e.target as Node)) {
        if (!isFocused) {
          console.log('Editor clicked - scrolling into view');
          handleFocusIn();
        }
      }
    };

    const handleBlur = () => {
      // Use a small timeout to avoid rapid focus/blur cycles
      setTimeout(() => {
        if (!rootElement.contains(document.activeElement)) {
          isFocused = false;
          console.log('Editor blurred');
        }
      }, 100);
    };

    // Listen for both focus and click events
    rootElement.addEventListener('focusin', handleFocusIn, true);
    rootElement.addEventListener('click', handleClick);
    rootElement.addEventListener('blur', handleBlur);

    return () => {
      rootElement.removeEventListener('focusin', handleFocusIn, true);
      rootElement.removeEventListener('click', handleClick);
      rootElement.removeEventListener('blur', handleBlur);
    };
  }, [editor]);

  return (
    <div 
      ref={editorWrapperRef}
      className={`lexical-editor-wrapper ${className}`}
    >
      <ToolbarPlugin 
        editor={editor}
        activeEditor={activeEditor}
        setActiveEditor={setActiveEditor}
        setIsLinkEditMode={() => {}}
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
        <OnChangePlugin onChange={onChange} skipNextChange={skipNextChange} isInternalEdit={isInternalEdit} />
        <InitialValuePlugin value={value} isInternalEdit={isInternalEdit} />
      </div>
    </div>
  );
}

