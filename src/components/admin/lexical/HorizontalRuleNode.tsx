import { DecoratorNode } from 'lexical';
import type {
  LexicalNode,
  SerializedLexicalNode,
  Spread,
} from 'lexical';

export type SerializedHorizontalRuleNode = Spread<
  {
    type: 'horizontalrule';
    version: 1;
  },
  SerializedLexicalNode
>;

export class HorizontalRuleNode extends DecoratorNode<JSX.Element> {
  static getType(): string {
    return 'horizontalrule';
  }

  static clone(node: HorizontalRuleNode): HorizontalRuleNode {
    return new HorizontalRuleNode(node.__key);
  }

  static importJSON(_serializedNode: SerializedHorizontalRuleNode): HorizontalRuleNode {
    return $createHorizontalRuleNode();
  }

  exportJSON(): SerializedHorizontalRuleNode {
    return {
      type: 'horizontalrule',
      version: 1,
    };
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.style.marginTop = '1rem';
    div.style.marginBottom = '1rem';
    const hr = document.createElement('hr');
    hr.style.border = 'none';
    hr.style.borderTop = '2px solid #e5e7eb';
    div.appendChild(hr);
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(): JSX.Element {
    return <hr style={{ borderTop: '2px solid #e5e7eb', margin: '1rem 0' }} />;
  }
}

export function $createHorizontalRuleNode(): HorizontalRuleNode {
  return new HorizontalRuleNode();
}

export function $isHorizontalRuleNode(
  node: LexicalNode | null | undefined,
): node is HorizontalRuleNode {
  return node instanceof HorizontalRuleNode;
}
