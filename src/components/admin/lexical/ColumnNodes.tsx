import {
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedElementNode,
  Spread,
  $createParagraphNode,
  ElementNode,
  DOMExportOutput,
  DOMConversionMap,
  DOMConversionOutput,
} from 'lexical';

// Converter functions for importing from HTML
function convertColumnContainerElement(domNode: HTMLElement): DOMConversionOutput | null {
  // Count actual column children to determine columns
  const columnChildren = Array.from(domNode.children).filter(
    child => child.classList.contains('lexical-column')
  );
  const columns = columnChildren.length > 0 ? columnChildren.length : 
    parseInt(domNode.getAttribute('data-columns') || '2', 10);
  
  // Create container without default columns since children will be imported separately
  const node = new ColumnContainerNode(columns);
  
  // If we have actual column children, they'll be imported separately
  // Remove the default empty columns that constructor created
  if (columnChildren.length > 0) {
    node.clear();
  }
  
  return { node };
}

function convertColumnElement(): DOMConversionOutput | null {
  const node = new ColumnNode();
  return { node };
}

export type SerializedColumnContainerNode = Spread<
  {
    columns: number;
  },
  SerializedElementNode
>;

export class ColumnContainerNode extends ElementNode {
  __columns: number;

  static getType(): string {
    return 'column-container';
  }

  static clone(node: ColumnContainerNode): ColumnContainerNode {
    return new ColumnContainerNode(node.__columns, node.__key);
  }

  constructor(columns: number = 2, key?: NodeKey) {
    super(key);
    this.__columns = columns;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const dom = document.createElement('div');
    dom.className = 'lexical-column-container';
    dom.setAttribute('data-columns', String(this.__columns));
    dom.setAttribute('contenteditable', 'true');
    dom.style.position = 'relative';
    
    // Add a data attribute to identify this for selection
    dom.setAttribute('data-lexical-column-container', 'true');
    
    return dom;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.className = 'lexical-column-container';
    element.setAttribute('data-columns', this.__columns.toString());
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (domNode.classList.contains('lexical-column-container')) {
          return {
            conversion: convertColumnContainerElement,
            priority: 2,
          };
        }
        return null;
      },
    };
  }

  static importJSON(serializedNode: SerializedColumnContainerNode): ColumnContainerNode {
    // Create container without default columns - they will be imported separately from the serialized data
    const node = new ColumnContainerNode(serializedNode.columns);
    return node;
  }

  exportJSON(): SerializedColumnContainerNode {
    return {
      ...super.exportJSON(),
      columns: this.__columns,
      type: 'column-container',
    };
  }

  canBeEmpty(): boolean {
    return false;
  }

  isShadowRoot(): boolean {
    return false;
  }

  canInsertTextBefore(): boolean {
    return false;
  }

  canInsertTextAfter(): boolean {
    return false;
  }

  isInline(): boolean {
    return false;
  }
}

export type SerializedColumnNode = SerializedElementNode;

export class ColumnNode extends ElementNode {
  static getType(): string {
    return 'column';
  }

  static clone(node: ColumnNode): ColumnNode {
    return new ColumnNode(node.__key);
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const dom = document.createElement('div');
    dom.className = 'lexical-column';
    return dom;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.className = 'lexical-column';
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (domNode.classList.contains('lexical-column')) {
          return {
            conversion: convertColumnElement,
            priority: 2,
          };
        }
        return null;
      },
    };
  }

  static importJSON(_serializedNode: SerializedColumnNode): ColumnNode {
    return $createColumnNode();
  }

  exportJSON(): SerializedColumnNode {
    return {
      ...super.exportJSON(),
      type: 'column',
    };
  }

  canBeEmpty(): boolean {
    return false;
  }

  isShadowRoot(): boolean {
    return true; // This allows columns to act as isolated editing contexts
  }
  
  canInsertTextBefore(): boolean {
    return false;
  }

  canInsertTextAfter(): boolean {
    return false;
  }
}

export function $createColumnContainerNode(columns: number = 2): ColumnContainerNode {
  const containerNode = new ColumnContainerNode(columns);
  
  // Create column nodes with empty paragraphs
  for (let i = 0; i < columns; i++) {
    const columnNode = $createColumnNode();
    const paragraph = $createParagraphNode();
    columnNode.append(paragraph);
    containerNode.append(columnNode);
  }
  
  return containerNode;
}

export function $createColumnNode(): ColumnNode {
  return new ColumnNode();
}

export function $isColumnContainerNode(node: LexicalNode | null | undefined): node is ColumnContainerNode {
  return node instanceof ColumnContainerNode;
}

export function $isColumnNode(node: LexicalNode | null | undefined): node is ColumnNode {
  return node instanceof ColumnNode;
}
