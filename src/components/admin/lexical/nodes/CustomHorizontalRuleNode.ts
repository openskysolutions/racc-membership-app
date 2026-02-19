import { DecoratorNode, DOMExportOutput, LexicalNode, SerializedLexicalNode, Spread } from 'lexical';

export type SerializedHorizontalRuleNode = Spread<
  {
    isSpacer?: boolean;
  },
  SerializedLexicalNode
>;

export class CustomHorizontalRuleNode extends DecoratorNode<JSX.Element> {
  __isSpacer: boolean;

  static getType(): string {
    return 'custom-horizontal-rule';
  }

  static clone(node: CustomHorizontalRuleNode): CustomHorizontalRuleNode {
    return new CustomHorizontalRuleNode(node.__isSpacer, node.__key);
  }

  constructor(isSpacer?: boolean, key?: string) {
    super(key);
    this.__isSpacer = isSpacer || false;
  }

  createDOM(): HTMLElement {
    const hr = document.createElement('hr');
    if (this.__isSpacer) {
      hr.style.border = 'none';
      hr.style.height = '2em';
      hr.style.margin = '1rem 0';
      hr.style.background = 'transparent';
    }
    return hr;
  }

  updateDOM(): false {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('hr');
    if (this.__isSpacer) {
      element.style.border = 'none';
      element.style.height = '2em';
      element.style.margin = '1rem 0';
      element.style.background = 'transparent';
    }
    return { 
      element,
      after: (generatedElement) => {
        // Remove any wrapping paragraph or br tags that might be added
        if (generatedElement?.parentElement?.tagName === 'P') {
          const parent = generatedElement.parentElement;
          parent.replaceWith(generatedElement);
        }
        // Remove trailing BR
        const nextSibling = generatedElement?.nextSibling;
        if (nextSibling?.nodeName === 'BR') {
          nextSibling.remove();
        }
        return generatedElement;
      }
    };
  }

  static importDOM() {
    return {
      hr: () => ({
        conversion: (domNode: HTMLElement) => {
          const isSpacer = domNode.style.border === 'none' || 
                          domNode.style.height === '2em';
          return {
            node: new CustomHorizontalRuleNode(isSpacer),
          };
        },
        priority: 1 as const,
      }),
    };
  }

  exportJSON(): SerializedHorizontalRuleNode {
    return {
      type: 'custom-horizontal-rule',
      isSpacer: this.__isSpacer,
      version: 1,
    };
  }

  static importJSON(serializedNode: SerializedHorizontalRuleNode): CustomHorizontalRuleNode {
    return $createCustomHorizontalRuleNode(serializedNode.isSpacer);
  }

  decorate(): JSX.Element {
    return null as any;
  }

  getIsSpacer(): boolean {
    return this.__isSpacer;
  }

  setIsSpacer(isSpacer: boolean): void {
    const writable = this.getWritable();
    writable.__isSpacer = isSpacer;
  }
}

export function $createCustomHorizontalRuleNode(isSpacer?: boolean): CustomHorizontalRuleNode {
  return new CustomHorizontalRuleNode(isSpacer);
}

export function $isCustomHorizontalRuleNode(
  node: LexicalNode | null | undefined,
): node is CustomHorizontalRuleNode {
  return node instanceof CustomHorizontalRuleNode;
}
