import { ReactNode } from 'react';

interface DocumentNode {
  type: string;
  children?: DocumentNode[];
  text?: string;
  format?: number;
  tag?: string;
  direction?: string;
  indent?: number;
  version?: number;
  detail?: number;
  mode?: string;
  style?: string;
}

interface DocumentData {
  root: DocumentNode;
}

interface DocumentRendererProps {
  content: string;
  className?: string;
}

const formatText = (text: string, format?: number): ReactNode => {
  if (!format) return text;
  
  let element: ReactNode = text;
  
  // Format flags from Lexical
  const IS_BOLD = 1;
  const IS_ITALIC = 2;
  const IS_STRIKETHROUGH = 4;
  const IS_UNDERLINE = 8;
  const IS_CODE = 16;
  
  if (format & IS_BOLD) {
    element = <strong className="font-bold">{element}</strong>;
  }
  if (format & IS_ITALIC) {
    element = <em className="italic">{element}</em>;
  }
  if (format & IS_UNDERLINE) {
    element = <u className="underline">{element}</u>;
  }
  if (format & IS_STRIKETHROUGH) {
    element = <s className="line-through">{element}</s>;
  }
  if (format & IS_CODE) {
    element = <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{element}</code>;
  }
  
  return element;
};

const renderNode = (node: DocumentNode, index: number): ReactNode => {
  if (node.type === 'text') {
    return (
      <span key={index}>
        {formatText(node.text || '', node.format)}
      </span>
    );
  }

  if (node.type === 'paragraph') {
    return (
      <p key={index} className="mb-4 leading-relaxed">
        {node.children?.map((child, childIndex) => renderNode(child, childIndex))}
      </p>
    );
  }

  if (node.type === 'heading') {
    const HeadingTag = (node.tag || 'h1') as keyof JSX.IntrinsicElements;
    const headingClasses = {
      h1: 'text-3xl font-bold mb-4 mt-6',
      h2: 'text-2xl font-bold mb-3 mt-5',
      h3: 'text-xl font-bold mb-2 mt-4',
      h4: 'text-lg font-bold mb-2 mt-3',
      h5: 'text-base font-bold mb-1 mt-2',
      h6: 'text-sm font-bold mb-1 mt-2',
    };
    
    return (
      <HeadingTag key={index} className={headingClasses[HeadingTag as keyof typeof headingClasses]}>
        {node.children?.map((child, childIndex) => renderNode(child, childIndex))}
      </HeadingTag>
    );
  }

  if (node.type === 'quote') {
    return (
      <blockquote key={index} className="border-l-4 border-gray-300 pl-4 my-4 italic text-gray-700">
        {node.children?.map((child, childIndex) => renderNode(child, childIndex))}
      </blockquote>
    );
  }

  if (node.type === 'list') {
    const ListTag = node.tag === 'ol' ? 'ol' : 'ul';
    const listClasses = node.tag === 'ol' 
      ? 'list-decimal list-inside mb-4' 
      : 'list-disc list-inside mb-4';
    
    return (
      <ListTag key={index} className={listClasses}>
        {node.children?.map((child, childIndex) => renderNode(child, childIndex))}
      </ListTag>
    );
  }

  if (node.type === 'listitem') {
    return (
      <li key={index} className="mb-1">
        {node.children?.map((child, childIndex) => renderNode(child, childIndex))}
      </li>
    );
  }

  if (node.type === 'code') {
    return (
      <pre key={index} className="bg-gray-100 p-4 rounded mb-4 text-sm font-mono overflow-x-auto">
        <code>
          {node.children?.map((child, childIndex) => renderNode(child, childIndex))}
        </code>
      </pre>
    );
  }

  if (node.type === 'link') {
    return (
      <a 
        key={index} 
        href={node.text || '#'} 
        className="text-blue-600 underline hover:text-blue-800"
        target="_blank"
        rel="noopener noreferrer"
      >
        {node.children?.map((child, childIndex) => renderNode(child, childIndex))}
      </a>
    );
  }

  // Default: render children if they exist
  if (node.children && node.children.length > 0) {
    return (
      <div key={index}>
        {node.children.map((child, childIndex) => renderNode(child, childIndex))}
      </div>
    );
  }

  return null;
};

export default function DocumentRenderer({ content, className = '' }: DocumentRendererProps) {
  try {
    const documentData: DocumentData = JSON.parse(content);
    
    return (
      <div className={`prose prose-gray max-w-none ${className}`}>
        {documentData.root.children?.map((node, index) => renderNode(node, index))}
      </div>
    );
  } catch (error) {
    // Fallback for plain text or invalid JSON
    return (
      <div className={`prose prose-gray max-w-none ${className}`}>
        <p className="mb-4 leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    );
  }
}