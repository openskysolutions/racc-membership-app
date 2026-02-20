import {
  DecoratorNode,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
  DOMExportOutput,
} from 'lexical';

export type SerializedVideoNode = Spread<
  {
    src: string;
  },
  SerializedLexicalNode
>;

export class VideoNode extends DecoratorNode<JSX.Element> {
  __src: string;

  static getType(): string {
    return 'video';
  }

  static clone(node: VideoNode): VideoNode {
    return new VideoNode(node.__src, node.__key);
  }

  constructor(src: string, key?: NodeKey) {
    super(key);
    this.__src = src;
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'lexical-video-container';
    div.style.margin = '1rem 0';
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const div = document.createElement('div');
    div.className = 'iframe-wrapper';
    
    if (this.__src.includes('<iframe')) {
      div.innerHTML = this.__src;
    } else {
      const iframe = document.createElement('iframe');
      iframe.setAttribute('src', this.__src);
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allowfullscreen', 'true');
      iframe.style.width = '100%';
      iframe.style.height = '400px';
      div.appendChild(iframe);
    }
    
    return { element: div };
  }

  static importJSON(serializedNode: SerializedVideoNode): VideoNode {
    return $createVideoNode(serializedNode.src);
  }

  exportJSON(): SerializedVideoNode {
    return {
      ...super.exportJSON(),
      src: this.__src,
      type: 'video',
      version: 1,
    };
  }

  decorate(): JSX.Element {
    if (this.__src.includes('<iframe')) {
      return <div dangerouslySetInnerHTML={{ __html: this.__src }} style={{ margin: '1rem 0' }} />;
    }
    
    return (
      <div style={{ margin: '1rem 0' }}>
        <iframe
          src={this.__src}
          frameBorder="0"
          allowFullScreen
          style={{ width: '100%', height: '400px', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
        />
      </div>
    );
  }
}

export function $createVideoNode(src: string): VideoNode {
  return new VideoNode(src);
}

export function $isVideoNode(node: LexicalNode | null | undefined): node is VideoNode {
  return node instanceof VideoNode;
}
