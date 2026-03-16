/**
 * Toolbar Plugin - Based on Lexical Playground
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback, useEffect, useState } from 'react';
import {
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  CLICK_COMMAND,
  ElementFormatType,
  LexicalEditor,
  TextFormatType,
  $isElementNode,
  $createTextNode,
  $createParagraphNode,
} from 'lexical';
import { $getSelectionStyleValueForProperty, $patchStyleText, $isParentElementRTL } from '@lexical/selection';
import { $isHeadingNode } from '@lexical/rich-text';
import { $isListNode, ListNode } from '@lexical/list';
import { $isCodeNode } from '@lexical/code';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $findMatchingParent, $getNearestNodeOfType, mergeRegister, IS_APPLE, $insertNodeToNearestRoot } from '@lexical/utils';
import { INSERT_TABLE_COMMAND } from '@lexical/table';
import { INSERT_IMAGE_COMMAND } from './ImagesPlugin';
import { $createColumnContainerNode } from './ColumnNodes';
import { $isFormButtonNode, $createFormButtonNode, FormButtonNode } from './FormButtonNode';
import InsertImageDialog from './InsertImageDialog';
import FormSelectorDialog from '@/components/FormSelectorDialog';

import DropDown, { DropDownItem } from './ui/DropDown';
import DropdownColorPicker from './ui/DropdownColorPicker';
import FontSize, { parseFontSizeForToolbar } from './fontSize';
import { blockTypeToBlockName } from './utils';
import {
  formatParagraph,
  formatHeading,
  formatBulletList,
  formatNumberedList,
  formatCheckList,
  formatQuote,
  formatCode,
  clearFormatting,
} from './utils';
import { isKeyboardInput } from './ui/focusUtils';
import { $createCustomHorizontalRuleNode } from './nodes/CustomHorizontalRuleNode';
import './toolbar.css';

const SHORTCUTS = {
  NORMAL: IS_APPLE ? '⌘⌥0' : 'Ctrl+Alt+0',
  HEADING1: IS_APPLE ? '⌘⌥1' : 'Ctrl+Alt+1',
  HEADING2: IS_APPLE ? '⌘⌥2' : 'Ctrl+Alt+2',
  HEADING3: IS_APPLE ? '⌘⌥3' : 'Ctrl+Alt+3',
  NUMBERED_LIST: IS_APPLE ? '⌘⇧7' : 'Ctrl+Shift+7',
  BULLET_LIST: IS_APPLE ? '⌘⇧8' : 'Ctrl+Shift+8',
  CHECK_LIST: IS_APPLE ? '⌘⇧9' : 'Ctrl+Shift+9',
  QUOTE: IS_APPLE ? '⌘⇧Q' : 'Ctrl+Shift+Q',
  CODE_BLOCK: IS_APPLE ? '⌘⌥C' : 'Ctrl+Alt+C',
  INSERT_CODE_BLOCK: IS_APPLE ? '⌘⌥K' : 'Ctrl+Alt+K',
  INSERT_LINK: IS_APPLE ? '⌘K' : 'Ctrl+K',
  BOLD: IS_APPLE ? '⌘B' : 'Ctrl+B',
  ITALIC: IS_APPLE ? '⌘I' : 'Ctrl+I',
  UNDERLINE: IS_APPLE ? '⌘U' : 'Ctrl+U',
  STRIKETHROUGH: IS_APPLE ? '⌘⇧S' : 'Ctrl+Shift+S',
  SUBSCRIPT: IS_APPLE ? '⌘,' : 'Ctrl+,',
  SUPERSCRIPT: IS_APPLE ? '⌘.' : 'Ctrl+.',
  LOWERCASE: IS_APPLE ? '⌘⇧L' : 'Ctrl+Shift+L',
  UPPERCASE: IS_APPLE ? '⌘⇧U' : 'Ctrl+Shift+U',
  CAPITALIZE: IS_APPLE ? '⌘⇧C' : 'Ctrl+Shift+C',
  CLEAR_FORMATTING: IS_APPLE ? '⌘\\' : 'Ctrl+\\',
  LEFT_ALIGN: IS_APPLE ? '⌘⇧L' : 'Ctrl+Shift+L',
  CENTER_ALIGN: IS_APPLE ? '⌘⇧E' : 'Ctrl+Shift+E',
  RIGHT_ALIGN: IS_APPLE ? '⌘⇧R' : 'Ctrl+Shift+R',
  JUSTIFY_ALIGN: IS_APPLE ? '⌘⇧J' : 'Ctrl+Shift+J',
  INDENT: IS_APPLE ? '⌘]' : 'Ctrl+]',
  OUTDENT: IS_APPLE ? '⌘[' : 'Ctrl+[',
};

const ELEMENT_FORMAT_OPTIONS: {
  [key in Exclude<ElementFormatType, ''>]: {
    icon: string;
    iconRTL: string;
    name: string;
  };
} = {
  center: {
    icon: 'center-align',
    iconRTL: 'center-align',
    name: 'Center Align',
  },
  end: {
    icon: 'right-align',
    iconRTL: 'left-align',
    name: 'End Align',
  },
  justify: {
    icon: 'justify-align',
    iconRTL: 'justify-align',
    name: 'Justify Align',
  },
  left: {
    icon: 'left-align',
    iconRTL: 'left-align',
    name: 'Left Align',
  },
  right: {
    icon: 'right-align',
    iconRTL: 'right-align',
    name: 'Right Align',
  },
  start: {
    icon: 'left-align',
    iconRTL: 'right-align',
    name: 'Start Align',
  },
};

function dropDownActiveClass(active: boolean) {
  return active ? 'active dropdown-item-active' : '';
}

function Divider() {
  return <div className="divider" />;
}

function BlockFormatDropDown({
  editor,
  blockType,
  disabled = false,
}: {
  blockType: keyof typeof blockTypeToBlockName;
  editor: LexicalEditor;
  disabled?: boolean;
}) {
  return (
    <DropDown
      disabled={disabled}
      buttonClassName="toolbar-item block-controls"
      buttonIconClassName={'icon block-type ' + blockType}
      buttonLabel={blockTypeToBlockName[blockType]}
      buttonAriaLabel="Formatting options for text style">
      <DropDownItem
        className={'item wide ' + dropDownActiveClass(blockType === 'paragraph')}
        onClick={() => formatParagraph(editor)}>
        <div className="icon-text-container">
          <i className="icon paragraph" />
          <span className="text">Normal</span>
        </div>
      </DropDownItem>
      <DropDownItem
        className={'item wide ' + dropDownActiveClass(blockType === 'h1')}
        onClick={() => formatHeading(editor, blockType, 'h1')}>
        <div className="icon-text-container">
          <i className="icon h1" />
          <span className="text">Heading 1</span>
        </div>
      </DropDownItem>
      <DropDownItem
        className={'item wide ' + dropDownActiveClass(blockType === 'h2')}
        onClick={() => formatHeading(editor, blockType, 'h2')}>
        <div className="icon-text-container">
          <i className="icon h2" />
          <span className="text">Heading 2</span>
        </div>
      </DropDownItem>
      <DropDownItem
        className={'item wide ' + dropDownActiveClass(blockType === 'h3')}
        onClick={() => formatHeading(editor, blockType, 'h3')}>
        <div className="icon-text-container">
          <i className="icon h3" />
          <span className="text">Heading 3</span>
        </div>
      </DropDownItem>
      <DropDownItem
        className={'item wide ' + dropDownActiveClass(blockType === 'number')}
        onClick={() => formatNumberedList(editor, blockType)}>
        <div className="icon-text-container">
          <i className="icon numbered-list" />
          <span className="text">Numbered List</span>
        </div>
      </DropDownItem>
      <DropDownItem
        className={'item wide ' + dropDownActiveClass(blockType === 'bullet')}
        onClick={() => formatBulletList(editor, blockType)}>
        <div className="icon-text-container">
          <i className="icon bullet-list" />
          <span className="text">Bullet List</span>
        </div>
      </DropDownItem>
      <DropDownItem
        className={'item wide ' + dropDownActiveClass(blockType === 'check')}
        onClick={() => formatCheckList(editor, blockType)}>
        <div className="icon-text-container">
          <i className="icon check-list" />
          <span className="text">Check List</span>
        </div>
      </DropDownItem>
      <DropDownItem
        className={'item wide ' + dropDownActiveClass(blockType === 'quote')}
        onClick={() => formatQuote(editor, blockType)}>
        <div className="icon-text-container">
          <i className="icon quote" />
          <span className="text">Quote</span>
        </div>
      </DropDownItem>
      <DropDownItem
        className={'item wide ' + dropDownActiveClass(blockType === 'code')}
        onClick={() => formatCode(editor, blockType)}>
        <div className="icon-text-container">
          <i className="icon code" />
          <span className="text">Code Block</span>
        </div>
      </DropDownItem>
    </DropDown>
  );
}

function ElementFormatDropdown({
  editor,
  value,
  isRTL,
  disabled = false,
}: {
  editor: LexicalEditor;
  value: ElementFormatType;
  isRTL: boolean;
  disabled: boolean;
}) {
  const formatOption = ELEMENT_FORMAT_OPTIONS[value || 'left'];

  return (
    <DropDown
      disabled={disabled}
      buttonLabel={formatOption.name}
      buttonIconClassName={`icon ${isRTL ? formatOption.iconRTL : formatOption.icon}`}
      buttonClassName="toolbar-item spaced alignment"
      buttonAriaLabel="Formatting options for text alignment">
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
        }}
        className="item wide">
        <div className="icon-text-container">
          <i className="icon left-align" />
          <span className="text">Left Align</span>
        </div>
      </DropDownItem>
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
        }}
        className="item wide">
        <div className="icon-text-container">
          <i className="icon center-align" />
          <span className="text">Center Align</span>
        </div>
      </DropDownItem>
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
        }}
        className="item wide">
        <div className="icon-text-container">
          <i className="icon right-align" />
          <span className="text">Right Align</span>
        </div>
      </DropDownItem>
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
        }}
        className="item wide">
        <div className="icon-text-container">
          <i className="icon justify-align" />
          <span className="text">Justify Align</span>
        </div>
      </DropDownItem>
    </DropDown>
  );
}

function getSelectedNode(selection: any) {
  const anchor = selection.anchor;
  const focus = selection.focus;
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  if (anchorNode === focusNode) {
    return anchorNode;
  }
  const isBackward = selection.isBackward();
  if (isBackward) {
    return focus.offset === 0 ? anchorNode : focusNode;
  } else {
    return anchor.offset === anchorNode.getTextContentSize() ? anchorNode : focusNode;
  }
}

interface ToolbarPluginProps {
  editor: LexicalEditor;
  activeEditor: LexicalEditor;
  setActiveEditor: (editor: LexicalEditor) => void;
  setIsLinkEditMode: (mode: boolean) => void;
}

export default function ToolbarPlugin({
  editor: _editor,
  activeEditor: _activeEditor,
  setActiveEditor: _setActiveEditor,
  setIsLinkEditMode: _setIsLinkEditMode,
}: ToolbarPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [blockType, setBlockType] = useState<keyof typeof blockTypeToBlockName>('paragraph');
  const [fontSize, setFontSize] = useState<string>('15px');
  const [fontColor, setFontColor] = useState<string>('#000');
  const [elementFormat, setElementFormat] = useState<ElementFormatType>('left');
  const [isRTL, setIsRTL] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isSubscript, setIsSubscript] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);
  const [isHighlight, setIsHighlight] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [isLowercase, setIsLowercase] = useState(false);
  const [isUppercase, setIsUppercase] = useState(false);
  const [isCapitalize, setIsCapitalize] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [isFormSelectorOpen, setIsFormSelectorOpen] = useState(false);
  const [selectedFormLink, setSelectedFormLink] = useState<{
    url: string;
    text: string;
    node: FormButtonNode;
  } | null>(null);

  const dispatchFormatTextCommand = (format: TextFormatType, _skipRefocus: boolean = false) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      let element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : $findMatchingParent(anchorNode, (e) => {
              const parent = e.getParent();
              return parent !== null && $isRootOrShadowRoot(parent);
            });

      if (element === null) {
        element = anchorNode.getTopLevelElementOrThrow();
      }

      const elementDOM = editor.getElementByKey(element.getKey());

      // Update link
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      const linkNode = $isLinkNode(parent) ? parent : $isLinkNode(node) ? node : null;
      setIsLink(linkNode !== null);
      
      // Check if this is a form button (FormButtonNode)
      const formButtonNode = $isFormButtonNode(parent) ? parent : $isFormButtonNode(node) ? node : null;
      if (formButtonNode) {
        const url = formButtonNode.getURL();
        const textContent = formButtonNode.getTextContent();
        console.log('Selected form button:', { url, text: textContent });
        setSelectedFormLink({
          url,
          text: textContent,
          node: formButtonNode,
        });
      } else {
        setSelectedFormLink(null);
      }

      // Update RTL
      setIsRTL($isParentElementRTL(selection));

      // Update block type
      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(anchorNode, ListNode);
          const type = parentList ? parentList.getListType() : element.getListType();
          setBlockType(type);
        } else {
          const type = $isHeadingNode(element) ? element.getTag() : element.getType();
          if (type in blockTypeToBlockName) {
            setBlockType(type as keyof typeof blockTypeToBlockName);
          }
          if ($isCodeNode(element)) {
            setBlockType('code');
          }
        }
      }

      // Update text format
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsSubscript(selection.hasFormat('subscript'));
      setIsSuperscript(selection.hasFormat('superscript'));
      setIsHighlight(selection.hasFormat('highlight'));
      setIsCode(selection.hasFormat('code'));
      setIsLowercase(selection.hasFormat('lowercase'));
      setIsUppercase(selection.hasFormat('uppercase'));
      setIsCapitalize(selection.hasFormat('capitalize'));

      // Update font color
      setFontColor($getSelectionStyleValueForProperty(selection, 'color', '#000'));
      setFontSize($getSelectionStyleValueForProperty(selection, 'font-size', '15px'));

      // Update element format
      let matchingParent;
      if ($isLinkNode(parent)) {
        matchingParent = $findMatchingParent(
          node,
          (parentNode) => parentNode.getType() !== 'link' && !parentNode.isInline(),
        );
      }

      setElementFormat(
        ($isElementNode(matchingParent) ? matchingParent.getFormatType() : undefined) ||
          (node.getType() !== 'text' && $isElementNode(node) ? node.getFormatType() : parent && $isElementNode(parent) ? parent.getFormatType() : undefined) ||
          'left',
      );
    }
  }, [editor]);

  // Add DOM event listener for form link clicks
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if the click is on or inside an anchor element
      const anchor = target.closest('a');
      if (anchor) {
        const href = anchor.getAttribute('href');
        if (href && href.includes('/forms/')) {
          e.preventDefault();
          e.stopPropagation();
          setIsFormSelectorOpen(true);
        }
      }
    };

    const editorElement = editor.getRootElement();
    if (editorElement) {
      editorElement.addEventListener('click', handleLinkClick, true);
      return () => {
        editorElement.removeEventListener('click', handleLinkClick, true);
      };
    }
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateToolbar();
        }, { editor });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          editor.getEditorState().read(() => {
            $updateToolbar();
          }, { editor });
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        CLICK_COMMAND,
        (event) => {
          const target = event.target as HTMLElement;
          if (target.tagName === 'A') {
            const href = target.getAttribute('href');
            if (href && href.includes('/forms/')) {
              event.preventDefault();
              event.stopPropagation();
              setIsFormSelectorOpen(true);
              return true;
            }
          }
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
    );
  }, [editor, $updateToolbar]);

  const insertLink = useCallback(() => {
    if (!isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, 'https://');
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [editor, isLink]);

  const onFontColorSelect = useCallback(
    (value: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if (selection !== null) {
          $patchStyleText(selection, {
            color: value,
          });
        }
      });
    },
    [editor],
  );

  const handleFormSelect = useCallback(
    (_formId: string, formName: string, formUrl: string) => {
      console.log('handleFormSelect called:', { formName, formUrl, hasSelectedFormLink: !!selectedFormLink });
      
      editor.update(() => {
        if (selectedFormLink?.node) {
          // Replace existing form button with a new one
          console.log('Replacing existing form button');
          const oldFormButtonNode = selectedFormLink.node;
          
          // Preserve the old button's format/alignment
          const oldFormat = oldFormButtonNode.getFormatType();
          const oldIndent = oldFormButtonNode.getIndent();
          const oldDirection = oldFormButtonNode.getDirection();
          
          console.log('Old button:', {
            url: oldFormButtonNode.getURL(),
            title: oldFormButtonNode.getTitle(),
            childCount: oldFormButtonNode.getChildrenSize(),
            format: oldFormat,
            indent: oldIndent,
            direction: oldDirection,
          });
          
          // Create new form button with updated values
          const newFormButtonNode = $createFormButtonNode(formUrl, formName);
          const textNode = $createTextNode(formName);
          newFormButtonNode.append(textNode);
          
          // Apply the preserved formatting
          if (oldFormat) {
            newFormButtonNode.setFormat(oldFormat);
          }
          if (oldIndent) {
            newFormButtonNode.setIndent(oldIndent);
          }
          if (oldDirection) {
            newFormButtonNode.setDirection(oldDirection);
          }
          
          console.log('New button created:', {
            url: newFormButtonNode.getURL(),
            title: newFormButtonNode.getTitle(),
            childCount: newFormButtonNode.getChildrenSize(),
            format: newFormButtonNode.getFormatType(),
          });
          
          // Replace the old node with the new one
          oldFormButtonNode.replace(newFormButtonNode);
          
          // Select the new button to maintain focus/scroll position
          newFormButtonNode.selectEnd();
          
          console.log('Button replaced and selected successfully');
        } else {
          // Insert new form button
          console.log('Inserting new form button');
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const formButtonNode = $createFormButtonNode(formUrl, formName);
            const textNode = $createTextNode(formName);
            formButtonNode.append(textNode);
            
            console.log('Created new form button:', {
              url: formButtonNode.getURL(),
              title: formButtonNode.getTitle(),
              childCount: formButtonNode.getChildrenSize(),
            });
            
            selection.insertNodes([formButtonNode]);
            console.log('Inserted form button into editor');
          } else {
            console.warn('No range selection available');
          }
        }
      });
      
      // Focus the editor after a brief delay to prevent scroll issues
      setTimeout(() => {
        editor.focus();
      }, 50);
      
      // Reset selected form link after update
      setSelectedFormLink(null);
      console.log('Form select complete, cleared selectedFormLink');
    },
    [editor, selectedFormLink],
  );

  const isEditable = editor.isEditable();

  return (
    <div className="toolbar">
      <button
        disabled={!canUndo || !isEditable}
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        title={IS_APPLE ? 'Undo (⌘Z)' : 'Undo (Ctrl+Z)'}
        type="button"
        className="toolbar-item spaced"
        aria-label="Undo">
        <i className="format undo" />
      </button>
      <button
        disabled={!canRedo || !isEditable}
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        title={IS_APPLE ? 'Redo (⇧⌘Z)' : 'Redo (Ctrl+Y)'}
        type="button"
        className="toolbar-item"
        aria-label="Redo">
        <i className="format redo" />
      </button>
      <Divider />
      <BlockFormatDropDown disabled={!isEditable} blockType={blockType} editor={editor} />
      <Divider />
      <FontSize
        selectionFontSize={parseFontSizeForToolbar(fontSize).slice(0, -2)}
        editor={editor}
        disabled={!isEditable}
      />
      <Divider />
      <button
        disabled={!isEditable}
        onClick={(e) => dispatchFormatTextCommand('bold', isKeyboardInput(e))}
        className={'toolbar-item spaced ' + (isBold ? 'active' : '')}
        title={`Bold (${SHORTCUTS.BOLD})`}
        type="button"
        aria-label={`Format text as bold. Shortcut: ${SHORTCUTS.BOLD}`}>
        <i className="format bold" />
      </button>
      <button
        disabled={!isEditable}
        onClick={(e) => dispatchFormatTextCommand('italic', isKeyboardInput(e))}
        className={'toolbar-item spaced ' + (isItalic ? 'active' : '')}
        title={`Italic (${SHORTCUTS.ITALIC})`}
        type="button"
        aria-label={`Format text as italics. Shortcut: ${SHORTCUTS.ITALIC}`}>
        <i className="format italic" />
      </button>
      <button
        disabled={!isEditable}
        onClick={(e) => dispatchFormatTextCommand('underline', isKeyboardInput(e))}
        className={'toolbar-item spaced ' + (isUnderline ? 'active' : '')}
        title={`Underline (${SHORTCUTS.UNDERLINE})`}
        type="button"
        aria-label={`Format text to underlined. Shortcut: ${SHORTCUTS.UNDERLINE}`}>
        <i className="format underline" />
      </button>
      <button
        disabled={!isEditable}
        onClick={(e) => dispatchFormatTextCommand('code', isKeyboardInput(e))}
        className={'toolbar-item spaced ' + (isCode ? 'active' : '')}
        title={`Insert code block (${SHORTCUTS.INSERT_CODE_BLOCK})`}
        type="button"
        aria-label="Insert code block">
        <i className="format code" />
      </button>
      <button
        disabled={!isEditable}
        onClick={insertLink}
        className={'toolbar-item spaced ' + (isLink ? 'active' : '')}
        aria-label="Insert link"
        title={`Insert link (${SHORTCUTS.INSERT_LINK})`}
        type="button">
        <i className="format link" />
      </button>
      <DropdownColorPicker
        disabled={!isEditable}
        buttonClassName="toolbar-item color-picker"
        buttonAriaLabel="Formatting text color"
        buttonIconClassName="icon font-color"
        color={fontColor}
        onChange={onFontColorSelect}
        title="text color"
      />
      {/* <DropdownColorPicker
        disabled={!isEditable}
        buttonClassName="toolbar-item color-picker"
        buttonAriaLabel="Formatting background color"
        buttonIconClassName="icon bg-color"
        color={bgColor}
        onChange={onBgColorSelect}
        title="bg color"
      /> */}
      <DropDown
        disabled={!isEditable}
        buttonClassName="toolbar-item spaced"
        buttonLabel=""
        buttonAriaLabel="Formatting options for additional text styles"
        buttonIconClassName="icon dropdown-more">
        <DropDownItem
          onClick={(e) => dispatchFormatTextCommand('lowercase', isKeyboardInput(e))}
          className={'item wide ' + dropDownActiveClass(isLowercase)}
          title="Lowercase"
          aria-label="Format text to lowercase">
          <div className="icon-text-container">
            <i className="icon lowercase" />
            <span className="text">Lowercase</span>
          </div>
        </DropDownItem>
        <DropDownItem
          onClick={(e) => dispatchFormatTextCommand('uppercase', isKeyboardInput(e))}
          className={'item wide ' + dropDownActiveClass(isUppercase)}
          title="Uppercase"
          aria-label="Format text to uppercase">
          <div className="icon-text-container">
            <i className="icon uppercase" />
            <span className="text">Uppercase</span>
          </div>
        </DropDownItem>
        <DropDownItem
          onClick={(e) => dispatchFormatTextCommand('capitalize', isKeyboardInput(e))}
          className={'item wide ' + dropDownActiveClass(isCapitalize)}
          title="Capitalize"
          aria-label="Format text to capitalize">
          <div className="icon-text-container">
            <i className="icon capitalize" />
            <span className="text">Capitalize</span>
          </div>
        </DropDownItem>
        <DropDownItem
          onClick={(e) => dispatchFormatTextCommand('strikethrough', isKeyboardInput(e))}
          className={'item wide ' + dropDownActiveClass(isStrikethrough)}
          title="Strikethrough"
          aria-label="Format text with a strikethrough">
          <div className="icon-text-container">
            <i className="icon strikethrough" />
            <span className="text">Strikethrough</span>
          </div>
        </DropDownItem>
        <DropDownItem
          onClick={(e) => dispatchFormatTextCommand('subscript', isKeyboardInput(e))}
          className={'item wide ' + dropDownActiveClass(isSubscript)}
          title="Subscript"
          aria-label="Format text with a subscript">
          <div className="icon-text-container">
            <i className="icon subscript" />
            <span className="text">Subscript</span>
          </div>
        </DropDownItem>
        <DropDownItem
          onClick={(e) => dispatchFormatTextCommand('superscript', isKeyboardInput(e))}
          className={'item wide ' + dropDownActiveClass(isSuperscript)}
          title="Superscript"
          aria-label="Format text with a superscript">
          <div className="icon-text-container">
            <i className="icon superscript" />
            <span className="text">Superscript</span>
          </div>
        </DropDownItem>
        <DropDownItem
          onClick={(e) => dispatchFormatTextCommand('highlight', isKeyboardInput(e))}
          className={'item wide ' + dropDownActiveClass(isHighlight)}
          title="Highlight"
          aria-label="Format text with a highlight">
          <div className="icon-text-container">
            <i className="icon highlight" />
            <span className="text">Highlight</span>
          </div>
        </DropDownItem>
        <DropDownItem
          onClick={(e) => clearFormatting(editor, isKeyboardInput(e))}
          className="item wide"
          title="Clear text formatting"
          aria-label="Clear all text formatting">
          <div className="icon-text-container">
            <i className="icon clear" />
            <span className="text">Clear Formatting</span>
          </div>
        </DropDownItem>
      </DropDown>
      <Divider />
      <DropDown
        disabled={!isEditable}
        buttonClassName="toolbar-item spaced"
        buttonLabel="Insert"
        buttonAriaLabel="Insert specialized editor node"
        buttonIconClassName="icon plus">
        <DropDownItem
          onClick={() => {
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                const hrNode = $createCustomHorizontalRuleNode(false);
                selection.insertNodes([hrNode]);
              }
            });
          }}
          className="item">
          <i className="icon horizontal-rule" />
          <span className="text">Horizontal Rule</span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                const hrNode = $createCustomHorizontalRuleNode(true);
                selection.insertNodes([hrNode]);
              }
            });
          }}
          className="item">
          <i className="icon horizontal-rule" />
          <span className="text">Horizontal Spacer</span>
        </DropDownItem>
        <DropDownItem
          onClick={() => setIsImageDialogOpen(true)}
          className="item">
          <i className="icon image" />
          <span className="text">Image</span>
        </DropDownItem>
        <DropDownItem
          onClick={() => setIsImageDialogOpen(true)}
          className="item">
          <i className="icon gif" />
          <span className="text">GIF</span>
        </DropDownItem>
        <DropDownItem
          onClick={() =>
            editor.dispatchCommand(INSERT_TABLE_COMMAND, {
              columns: '3',
              rows: '3',
            })
          }
          className="item">
          <i className="icon table" />
          <span className="text">Table</span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {
            editor.update(() => {
              const columnContainer = $createColumnContainerNode(2);
              $insertNodeToNearestRoot(columnContainer);
              // Insert a paragraph after the columns so user can continue typing
              const paragraph = $createParagraphNode();
              $insertNodeToNearestRoot(paragraph);
            });
          }}
          className="item">
          <i className="icon columns" />
          <span className="text">Columns Layout</span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {
            // TODO: Implement collapsible container
            alert('Collapsible container feature coming soon!');
          }}
          className="item">
          <i className="icon caret-right" />
          <span className="text">Collapsible container</span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {
            const dateTime = new Date();
            const dateStr = dateTime.toLocaleDateString();
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                const textNode = $createTextNode(dateStr);
                selection.insertNodes([textNode]);
              }
            });
          }}
          className="item">
          <i className="icon calendar" />
          <span className="text">Date</span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {
            const url = prompt('Enter YouTube URL:');
            if (url) {
              // TODO: Implement YouTube embed
              alert('YouTube video embedding coming soon!\nURL: ' + url);
            }
          }}
          className="item">
          <i className="icon youtube" />
          <span className="text">Youtube Video</span>
        </DropDownItem>
        <DropDownItem
          onClick={() => setIsFormSelectorOpen(true)}
          className="item">
          <i className="icon link" />
          <span className="text">{selectedFormLink ? 'Edit Form Button' : 'Form Button'}</span>
        </DropDownItem>
      </DropDown>
      <Divider />
      <ElementFormatDropdown
        disabled={!isEditable}
        value={elementFormat}
        editor={editor}
        isRTL={isRTL}
      />
      
      <InsertImageDialog
        isOpen={isImageDialogOpen}
        onClose={() => setIsImageDialogOpen(false)}
        onInsert={(src, altText) => {
          editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src, altText });
        }}
      />
      
      <FormSelectorDialog
        open={isFormSelectorOpen}
        onOpenChange={setIsFormSelectorOpen}
        onSelectForm={handleFormSelect}
        initialUrl={selectedFormLink?.url}
        initialText={selectedFormLink?.text}
      />
    </div>
  );
}
