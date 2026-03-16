import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedElementNode,
  Spread,
} from 'lexical';

import { $applyNodeReplacement, $isElementNode, ElementNode } from 'lexical';
import { openExternalUrl } from '@/lib/externalBrowser';

export type SerializedFormButtonNode = Spread<
  {
    url: string;
    title?: string;
  },
  SerializedElementNode
>;

export class FormButtonNode extends ElementNode {
  __url: string;
  __title?: string;

  static getType(): string {
    return 'form-button';
  }

  static clone(node: FormButtonNode): FormButtonNode {
    return new FormButtonNode(node.__url, node.__title, node.__key);
  }

  constructor(url: string, title?: string, key?: NodeKey) {
    super(key);
    this.__url = url;
    this.__title = title;
  }

  createDOM(_config: EditorConfig): HTMLAnchorElement {
    const element = document.createElement('a');
    element.href = this.__url;
    if (this.__title) {
      element.title = this.__title;
    }
    element.className = 'lexical-form-button';
    
    // Single click handler for the entire button - capture phase to run first
    element.addEventListener('click', (e: MouseEvent) => {
      // Check if we're in an editable editor
      const editableParent = element.closest('[contenteditable="true"]');
      
      if (editableParent) {
        // In edit mode - only prevent default navigation
        // Don't stop propagation so Lexical can handle the click for selection
        e.preventDefault();
        console.log('FormButtonNode: In edit mode - preventing navigation, allowing selection');
        return;
      }
      
      // Not in edit mode - handle navigation
      e.preventDefault();
      e.stopPropagation();
      console.log('FormButtonNode: Navigating to', this.__url);
      (async () => {
        const wasHandledExternally = await openExternalUrl(this.__url);
        if (!wasHandledExternally) {
          window.location.href = this.__url;
        }
      })();
    }, true); // Use capture phase to run before other handlers
    
    return element;
  }

  updateDOM(
    prevNode: FormButtonNode,
    anchor: HTMLAnchorElement,
    _config: EditorConfig,
  ): boolean {
    const url = this.__url;
    const title = this.__title;
    if (url !== prevNode.__url) {
      anchor.href = url;
    }
    if (title !== prevNode.__title) {
      if (title) {
        anchor.title = title;
      } else {
        anchor.removeAttribute('title');
      }
    }
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      a: (_node: Node) => ({
        conversion: convertAnchorElement,
        priority: 1,
      }),
    };
  }

  static importJSON(serializedNode: SerializedFormButtonNode): FormButtonNode {
    const node = $createFormButtonNode(serializedNode.url, serializedNode.title);
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    node.setDirection(serializedNode.direction);
    return node;
  }

  exportJSON(): SerializedFormButtonNode {
    return {
      ...super.exportJSON(),
      type: 'form-button',
      url: this.getURL(),
      title: this.getTitle(),
      version: 1,
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('a');
    // For export (published content), use href so it works as a normal link
    element.setAttribute('href', this.__url);
    if (this.__title) {
      element.setAttribute('title', this.__title);
    }
    element.className = 'lexical-form-button';
    
    console.log('FormButtonNode exportDOM:', {
      url: this.__url,
      title: this.__title,
      className: element.className,
    });
    
    // Export format (alignment) as inline style
    const format = this.getFormatType();
    if (format === 'center') {
      element.style.textAlign = 'center';
    } else if (format === 'right') {
      element.style.textAlign = 'right';
    } else if (format === 'left') {
      element.style.textAlign = 'left';
    } else if (format === 'justify') {
      element.style.textAlign = 'justify';
    }
    
    return { element };
  }

  getURL(): string {
    return this.getLatest().__url;
  }

  setURL(url: string): void {
    const writable = this.getWritable();
    writable.__url = url;
  }

  getTitle(): string | undefined {
    return this.getLatest().__title;
  }

  setTitle(title: string | undefined): void {
    const writable = this.getWritable();
    writable.__title = title;
  }

  insertNewAfter(_selection: any, restoreSelection = true): null | ElementNode {
    const element = this.getParentOrThrow().insertNewAfter(_selection, restoreSelection);
    if ($isElementNode(element)) {
      const linkNode = $createFormButtonNode(this.__url, this.__title);
      element.append(linkNode);
      return linkNode;
    }
    return null;
  }

  canInsertTextBefore(): false {
    return false;
  }

  canInsertTextAfter(): false {
    return false;
  }

  canBeEmpty(): false {
    return false;
  }

  isInline(): true {
    return true;
  }

  isSegmented(): false {
    return false;
  }

  extractWithChild(): boolean {
    return true;
  }
}

function convertAnchorElement(domNode: Node): null | DOMConversionOutput {
  let node = null;
  if (domNode instanceof HTMLAnchorElement) {
    const href = domNode.getAttribute('href');
    const className = domNode.getAttribute('class');
    
    console.log('FormButtonNode convertAnchorElement:', {
      href,
      className,
      hasFormButtonClass: className?.includes('lexical-form-button'),
      hasFormsInHref: href?.includes('/forms/'),
    });
    
    // Only convert if it has the form-button class or URL contains /forms/
    if ((className && className.includes('lexical-form-button')) || (href && href.includes('/forms/'))) {
      const title = domNode.getAttribute('title');
      node = $createFormButtonNode(href || '', title || undefined);
      
      console.log('Creating FormButtonNode:', { href, title });
      
      // Read text-align style and apply format
      const style = domNode.getAttribute('style');
      if (style && node) {
        if (style.includes('text-align: center') || style.includes('text-align:center')) {
          node.setFormat('center');
        } else if (style.includes('text-align: right') || style.includes('text-align:right')) {
          node.setFormat('right');
        } else if (style.includes('text-align: left') || style.includes('text-align:left')) {
          node.setFormat('left');
        } else if (style.includes('text-align: justify') || style.includes('text-align:justify')) {
          node.setFormat('justify');
        }
      }
    } else {
      console.log('SKIPPING anchor - does not match form button criteria');
    }
  }
  return { node };
}

export function $createFormButtonNode(url: string, title?: string): FormButtonNode {
  return $applyNodeReplacement(new FormButtonNode(url, title));
}

export function $isFormButtonNode(
  node: LexicalNode | null | undefined,
): node is FormButtonNode {
  return node instanceof FormButtonNode;
}
