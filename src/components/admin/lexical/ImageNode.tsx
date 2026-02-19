import {
  DecoratorNode,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
  DOMExportOutput,
  DOMConversionMap,
  DOMConversionOutput,
  ElementFormatType,
} from 'lexical';
import ImageComponent from './ImageComponent';

// Converter function for importing from HTML
function convertImageElement(domNode: HTMLElement): DOMConversionOutput | null {
  if (domNode instanceof HTMLImageElement) {
    // Detect alignment from inline styles
    let format: ElementFormatType = '';
    const marginLeft = domNode.style.marginLeft;
    const marginRight = domNode.style.marginRight;
    
    if (marginLeft === 'auto' && marginRight === 'auto') {
      format = 'center';
    } else if (marginLeft === 'auto' && marginRight === '0px') {
      format = 'right';
    } else if (marginLeft === '0px' && marginRight === 'auto') {
      format = 'left';
    }
    
    const node = $createImageNode({
      src: domNode.src,
      alt: domNode.alt,
      width: domNode.width,
      height: domNode.height,
      format: format,
    });
    return { node };
  }
  return null;
}

export type SerializedImageNode = Spread<
  {
    src: string;
    alt?: string;
    width?: number;
    height?: number;
    format?: ElementFormatType;
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __alt: string;
  __width?: number;
  __height?: number;
  __format: ElementFormatType;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src, 
      node.__alt, 
      node.__width, 
      node.__height, 
      node.__format,
      node.__key
    );
  }

  constructor(
    src: string, 
    alt: string = '', 
    width?: number, 
    height?: number, 
    format: ElementFormatType = '',
    key?: NodeKey
  ) {
    super(key);
    this.__src = src;
    this.__alt = alt;
    this.__width = width;
    this.__height = height;
    this.__format = format;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const div = document.createElement('div');
    div.className = 'lexical-image-container';
    div.style.margin = '1rem 0';
    
    // Apply text-align based on format
    if (this.__format) {
      if (this.__format === 'left') {
        div.style.textAlign = 'left';
      } else if (this.__format === 'center') {
        div.style.textAlign = 'center';
      } else if (this.__format === 'right') {
        div.style.textAlign = 'right';
      }
    }
    
    return div;
  }

  updateDOM(prevNode: ImageNode, dom: HTMLElement): boolean {
    // Update alignment if format changed
    if (prevNode.__format !== this.__format) {
      if (this.__format === 'left') {
        dom.style.textAlign = 'left';
      } else if (this.__format === 'center') {
        dom.style.textAlign = 'center';
      } else if (this.__format === 'right') {
        dom.style.textAlign = 'right';
      } else {
        dom.style.textAlign = '';
      }
    }
    // Always return true to trigger re-decoration
    return true;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('img');
    element.setAttribute('src', this.__src);
    element.setAttribute('alt', this.__alt);
    if (this.__width) element.style.width = `${this.__width}px`;
    if (this.__height) element.style.height = `${this.__height}px`;
    element.style.maxWidth = '100%';
    element.style.height = 'auto';
    element.style.display = 'block';
    
    // Apply alignment styling
    if (this.__format === 'left') {
      element.style.marginLeft = '0';
      element.style.marginRight = 'auto';
    } else if (this.__format === 'center') {
      element.style.marginLeft = 'auto';
      element.style.marginRight = 'auto';
    } else if (this.__format === 'right') {
      element.style.marginLeft = 'auto';
      element.style.marginRight = '0';
    }
    
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: () => {
        return {
          conversion: convertImageElement,
          priority: 0,
        };
      },
    };
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { src, alt, width, height, format } = serializedNode;
    return $createImageNode({ src, alt, width, height, format });
  }

  exportJSON(): SerializedImageNode {
    return {
      ...super.exportJSON(),
      src: this.__src,
      alt: this.__alt,
      width: this.__width,
      height: this.__height,
      format: this.__format,
      type: 'image',
      version: 1,
    };
  }

  setFormat(format: ElementFormatType): void {
    this.getWritable().__format = format;
  }

  getFormatType(): ElementFormatType {
    return this.__format;
  }

  decorate(): JSX.Element {
    return (
      <ImageComponent
        key={this.getKey() + '-' + this.__format}
        src={this.__src}
        alt={this.__alt}
        nodeKey={this.getKey()}
        format={this.__format}
      />
    );
  }
}

export function $createImageNode({
  src,
  alt = '',
  width,
  height,
  format = '',
}: {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  format?: ElementFormatType;
}): ImageNode {
  return new ImageNode(src, alt, width, height, format);
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}
