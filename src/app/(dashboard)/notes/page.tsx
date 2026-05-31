"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppState, Note } from "@/context/AppStateContext";
import {
  FileText,
  Plus,
  Trash2,
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Save,
  Search,
  Book,
  FileDown,
  Image as ImageIcon,
  ChevronDown,
  Paintbrush,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Check,
  Table as TableIcon,
  Grid,
  Undo,
  Redo,
  Upload,
} from "lucide-react";
import Dropdown from "@/components/ui/Dropdown";
import DOMPurify from "isomorphic-dompurify";

const FONTS = [
  { name: "Sans-Serif", value: "system-ui, sans-serif" },
  { name: "Arial", value: "Arial, sans-serif" },
  { name: "Times New Roman", value: "'Times New Roman', serif" },
  { name: "Georgia", value: "Georgia, serif" },
  { name: "Courier New", value: "'Courier New', monospace" },
  { name: "Fira Code", value: "'Fira Code', monospace" },
  { name: "Playfair Display", value: "'Playfair Display', serif" },
];

const FONT_SIZES = [
  { name: "12px", value: "12px" },
  { name: "14px", value: "14px" },
  { name: "16px", value: "16px" },
  { name: "18px", value: "18px" },
  { name: "20px", value: "20px" },
  { name: "24px", value: "24px" },
  { name: "32px", value: "32px" },
  { name: "48px", value: "48px" },
];

const SPACING_OPTIONS = [
  { name: "Single (1.0)", value: "1.0" },
  { name: "1.15 Spacing", value: "1.15" },
  { name: "1.5 Spacing", value: "1.5" },
  { name: "Double (2.0)", value: "2.0" },
];

const COLORS = [
  { name: "Default", value: "" },
  { name: "Red", value: "#ef4444" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#10b981" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Orange", value: "#f97316" },
  { name: "Gray", value: "#6b7280" },
];

const HIGHLIGHTS = [
  { name: "None", value: "" },
  { name: "Yellow", value: "#fef08a" },
  { name: "Green", value: "#bbf7d0" },
  { name: "Cyan", value: "#cffafe" },
  { name: "Pink", value: "#fbcfe8" },
  { name: "Orange", value: "#fed7aa" },
];

export default function NotesPage() {
  const { subjects, notes, addNote, updateNote, deleteNote, importJSONData } = useAppState();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Dropdown options
  const subjectOptions = [
    { value: "uncategorized", label: "No Subject" },
    ...subjects.map((sub) => ({
      value: sub.id,
      label: sub.name,
      color: sub.color,
    })),
  ];

  const filterSubjectOptions = [
    { value: "all", label: "All Subjects" },
    { value: "uncategorized", label: "Uncategorized" },
    ...subjects.map((sub) => ({
      value: sub.id,
      label: sub.name,
      color: sub.color,
    })),
  ];

  const noteIdParam = searchParams.get("id");

  // Selected note states
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editorTitle, setEditorTitle] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [editorSubjectId, setEditorSubjectId] = useState("uncategorized");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">("idle");
  const [noteSearch, setNoteSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [isEditMode, setIsEditMode] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Formatting Dropdown states
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selectedFont, setSelectedFont] = useState(FONTS[0]);
  const [selectedSize, setSelectedSize] = useState(FONT_SIZES[2]);
  const [selectedSpacing, setSelectedSpacing] = useState(SPACING_OPTIONS[1]);

  // Format Painter states
  const [isFormatPainterActive, setIsFormatPainterActive] = useState(false);
  const [paintedStyle, setPaintedStyle] = useState<any>(null);

  // Image editing states
  const [selectedImageNode, setSelectedImageNode] = useState<HTMLImageElement | null>(null);
  const [imageRect, setImageRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  // Table editing states
  const [activeTableCell, setActiveTableCell] = useState<HTMLTableCellElement | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const draggingImageRef = useRef<HTMLImageElement | null>(null);

  // Image Drag-and-Drop caret movement
  const handleDragStart = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "IMG") {
      draggingImageRef.current = target as HTMLImageElement;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", "");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggingImageRef.current) return;

    const img = draggingImageRef.current;
    
    let range: Range | null = null;
    const nativeEvent = e.nativeEvent;
    if (document.caretRangeFromPoint) {
      range = document.caretRangeFromPoint(nativeEvent.clientX, nativeEvent.clientY);
    } else if ((document as any).caretPositionFromPoint) {
      const position = (document as any).caretPositionFromPoint(nativeEvent.clientX, nativeEvent.clientY);
      if (position) {
        range = document.createRange();
        range.setStart(position.offsetNode, position.offset);
        range.collapse(true);
      }
    }

    if (range && editorRef.current?.contains(range.commonAncestorContainer)) {
      img.parentNode?.removeChild(img);
      range.insertNode(img);
      draggingImageRef.current = null;
      setSelectedImageNode(img);
      
      setTimeout(() => {
        updateImageRect();
      }, 50);

      if (editorRef.current) {
        handleContentChange(editorRef.current.innerHTML);
      }
    }
  };

  // Traversal to find TD/TH for table editing
  const checkActiveTableElements = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setActiveTableCell(null);
      return;
    }
    try {
      const range = selection.getRangeAt(0);
      let node: Node | null = range.startContainer;
      
      while (node && node !== editorRef.current) {
        if (node.nodeName === "TD" || node.nodeName === "TH") {
          setActiveTableCell(node as HTMLTableCellElement);
          return;
        }
        node = node.parentNode;
      }
    } catch (e) {
      // Ignored
    }
    setActiveTableCell(null);
  };

  // Helper to locate absolute position of active image relative to relative container parent
  const updateImageRect = () => {
    if (!selectedImageNode || !editorRef.current) {
      setImageRect(null);
      return;
    }
    const img = selectedImageNode;
    setImageRect({
      top: img.offsetTop,
      left: img.offsetLeft,
      width: img.offsetWidth,
      height: img.offsetHeight,
    });
  };

  // Keep imageRect in sync with scrolls and resizes
  useEffect(() => {
    if (!selectedImageNode) return;
    
    updateImageRect();

    const editorContainer = editorRef.current?.parentElement;
    if (editorContainer) {
      editorContainer.addEventListener("scroll", updateImageRect);
    }
    window.addEventListener("resize", updateImageRect);

    return () => {
      if (editorContainer) {
        editorContainer.removeEventListener("scroll", updateImageRect);
      }
      window.removeEventListener("resize", updateImageRect);
    };
  }, [selectedImageNode]);

  // Sync editor state when note parameters change
  useEffect(() => {
    if (noteIdParam) {
      const found = notes.find((n) => n.id === noteIdParam);
      if (found) {
        setSelectedNote(found);
        setEditorTitle(found.title);
        setEditorContent(found.content);
        setEditorSubjectId(found.subjectId);
        
        if (editorRef.current && document.activeElement !== editorRef.current) {
          const sanitized = DOMPurify.sanitize(found.content);
          if (editorRef.current.innerHTML !== sanitized) {
            editorRef.current.innerHTML = sanitized;
          }
        }
      }
    } else if (notes.length > 0 && !selectedNote) {
      setSelectedNote(notes[0]);
      setEditorTitle(notes[0].title);
      setEditorContent(notes[0].content);
      setEditorSubjectId(notes[0].subjectId);
      if (editorRef.current && document.activeElement !== editorRef.current) {
        const sanitized = DOMPurify.sanitize(notes[0].content);
        if (editorRef.current.innerHTML !== sanitized) {
          editorRef.current.innerHTML = sanitized;
        }
      }
    }
  }, [noteIdParam, notes]);

  // Reset innerHTML if switching notes
  useEffect(() => {
    if (selectedNote && editorRef.current) {
      editorRef.current.innerHTML = DOMPurify.sanitize(selectedNote.content);
      setSelectedImageNode(null); // Clear selected image
    }
  }, [selectedNote?.id]);

  // Close custom dropdowns on clicking outside and clear editor selections
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
        setSelectedImageNode(null);
        setActiveTableCell(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Selection/Cursor position saver
  const saveSelectionRange = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      // Only save range if it lies inside the editor
      if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    }
  };

  const restoreSelectionRange = () => {
    const selection = window.getSelection();
    if (selection && savedRangeRef.current) {
      selection.removeAllRanges();
      selection.addRange(savedRangeRef.current);
      return true;
    }
    return false;
  };

  const handleContentChange = (html: string) => {
    const sanitized = DOMPurify.sanitize(html);
    setEditorContent(sanitized);
    triggerAutosave(editorTitle, sanitized, editorSubjectId);
  };

  const handleTitleChange = (title: string) => {
    setEditorTitle(title);
    triggerAutosave(title, editorContent, editorSubjectId);
  };

  const handleSubjectChange = (subjectId: string) => {
    setEditorSubjectId(subjectId);
    triggerAutosave(editorTitle, editorContent, subjectId);
  };

  const triggerAutosave = (title: string, html: string, subId: string) => {
    if (!selectedNote) return;
    setSaveStatus("saving");
    updateNote(selectedNote.id, title, html, subId);
    setTimeout(() => {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1500);
    }, 400);
  };

  // Execute standard styling commands
  const execCommand = (command: string, value = "") => {
    if (typeof window !== "undefined") {
      if (editorRef.current) {
        editorRef.current.focus();
      }
      restoreSelectionRange();
      document.execCommand(command, false, value);
      if (editorRef.current) {
        handleContentChange(editorRef.current.innerHTML);
      }
    }
  };

  // Selection styles (Fonts, sizes, line heights, text highlights)
  const applySelectionStyle = (styleName: string, value: string) => {
    restoreSelectionRange();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);

    if (range.toString().length > 0) {
      const span = document.createElement("span");
      if (styleName === "fontFamily") span.style.fontFamily = value;
      else if (styleName === "fontSize") span.style.fontSize = value;
      else if (styleName === "color") span.style.color = value;
      else if (styleName === "backgroundColor") span.style.backgroundColor = value;
      else if (styleName === "lineHeight") span.style.lineHeight = value;

      try {
        const fragment = range.extractContents();
        span.appendChild(fragment);
        range.insertNode(span);
      } catch (err) {
        console.error("Style apply error, falling back:", err);
      }
      
      selection.removeAllRanges();
      if (editorRef.current) {
        handleContentChange(editorRef.current.innerHTML);
      }
    }
  };

  // Line spacing - applied directly to block elements for correct rendering
  const applyLineHeight = (value: string) => {
    restoreSelectionRange();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);

    const blocks: HTMLElement[] = [];
    
    const isBlockElement = (node: Node): boolean => {
      const blockTags = ["P", "DIV", "LI", "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE", "PRE", "TD", "TH"];
      return node.nodeType === Node.ELEMENT_NODE && blockTags.includes(node.nodeName);
    };

    const findBlockAncestor = (node: Node | null): HTMLElement | null => {
      let current = node;
      while (current && current !== editorRef.current) {
        if (isBlockElement(current)) {
          return current as HTMLElement;
        }
        current = current.parentNode;
      }
      return null;
    };

    if (range.collapsed) {
      const block = findBlockAncestor(range.startContainer);
      if (block) {
        blocks.push(block);
      } else if (editorRef.current) {
        blocks.push(editorRef.current);
      }
    } else {
      const startBlock = findBlockAncestor(range.startContainer);
      const endBlock = findBlockAncestor(range.endContainer);

      if (startBlock) blocks.push(startBlock);
      if (endBlock && endBlock !== startBlock) blocks.push(endBlock);

      const container = range.commonAncestorContainer;
      if (container.nodeType === Node.ELEMENT_NODE) {
        const walker = document.createTreeWalker(
          container,
          NodeFilter.SHOW_ELEMENT,
          {
            acceptNode: (node) => {
              if (isBlockElement(node) && selection.containsNode(node, true)) {
                return NodeFilter.FILTER_ACCEPT;
              }
              return NodeFilter.FILTER_SKIP;
            }
          }
        );

        let currentNode = walker.nextNode() as HTMLElement | null;
        while (currentNode) {
          if (!blocks.includes(currentNode)) {
            blocks.push(currentNode);
          }
          currentNode = walker.nextNode() as HTMLElement | null;
        }
      }
    }

    if (blocks.length > 0) {
      blocks.forEach((block) => {
        block.style.lineHeight = value;
      });
      if (editorRef.current) {
        handleContentChange(editorRef.current.innerHTML);
      }
    }
  };

  // Format Painter trigger
  const handleFormatPainterClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent button click focus shift
    restoreSelectionRange();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);

    let parentNode = (range.startContainer.nodeType === Node.ELEMENT_NODE 
      ? range.startContainer 
      : range.startContainer.parentElement || range.startContainer.parentNode) as HTMLElement;

    if (parentNode) {
      const computed = window.getComputedStyle(parentNode);
      const styles = {
        fontFamily: parentNode.style.fontFamily || computed.fontFamily || "",
        fontSize: parentNode.style.fontSize || computed.fontSize || "",
        color: parentNode.style.color || computed.color || "",
        backgroundColor: parentNode.style.backgroundColor || (computed.backgroundColor !== "rgba(0, 0, 0, 0)" ? computed.backgroundColor : ""),
        fontWeight: parentNode.style.fontWeight || computed.fontWeight || "",
        fontStyle: parentNode.style.fontStyle || computed.fontStyle || "",
        textDecoration: parentNode.style.textDecoration || computed.textDecoration || "",
      };
      setPaintedStyle(styles);
      setIsFormatPainterActive(true);
    }
  };

  // Image Corner resizing start handler
  const handleResizeStart = (e: React.MouseEvent, corner: "tl" | "tr" | "bl" | "br") => {
    e.preventDefault();
    e.stopPropagation();

    if (!selectedImageNode) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = selectedImageNode.offsetWidth;
    const startHeight = selectedImageNode.offsetHeight;
    const startAspectRatio = startWidth / startHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newWidth = startWidth;

      if (corner === "br") {
        newWidth = startWidth + deltaX;
      } else if (corner === "bl") {
        newWidth = startWidth - deltaX;
      } else if (corner === "tr") {
        newWidth = startWidth + deltaX;
      } else if (corner === "tl") {
        newWidth = startWidth - deltaX;
      }

      newWidth = Math.max(50, Math.min(1200, newWidth));
      const newHeight = Math.round(newWidth / startAspectRatio);

      selectedImageNode.style.width = `${newWidth}px`;
      selectedImageNode.style.height = `${newHeight}px`;

      updateImageRect();
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      if (editorRef.current) {
        handleContentChange(editorRef.current.innerHTML);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Table row/column modification commands
  const handleAddRowAbove = () => {
    if (!activeTableCell) return;
    const tr = activeTableCell.closest("tr");
    const tbody = tr?.parentElement;
    if (tr && tbody) {
      const newRow = tr.cloneNode(true) as HTMLTableRowElement;
      Array.from(newRow.cells).forEach((cell) => {
        cell.innerHTML = "Cell";
      });
      tbody.insertBefore(newRow, tr);
      if (editorRef.current) {
        handleContentChange(editorRef.current.innerHTML);
      }
    }
  };

  const handleAddRowBelow = () => {
    if (!activeTableCell) return;
    const tr = activeTableCell.closest("tr");
    const tbody = tr?.parentElement;
    if (tr && tbody) {
      const newRow = tr.cloneNode(true) as HTMLTableRowElement;
      Array.from(newRow.cells).forEach((cell) => {
        cell.innerHTML = "Cell";
      });
      tbody.insertBefore(newRow, tr.nextSibling);
      if (editorRef.current) {
        handleContentChange(editorRef.current.innerHTML);
      }
    }
  };

  const handleDeleteRow = () => {
    if (!activeTableCell) return;
    const tr = activeTableCell.closest("tr");
    const table = tr?.closest("table");
    if (tr) {
      tr.remove();
      setActiveTableCell(null);
      if (table && table.rows.length === 0) {
        table.remove();
      }
      if (editorRef.current) {
        handleContentChange(editorRef.current.innerHTML);
      }
    }
  };

  const handleAddColumnLeft = () => {
    if (!activeTableCell) return;
    const cellIndex = activeTableCell.cellIndex;
    const table = activeTableCell.closest("table");
    if (table) {
      Array.from(table.rows).forEach((row) => {
        const isHeader = row.parentElement?.tagName === "THEAD";
        const newCell = document.createElement(isHeader ? "th" : "td");
        newCell.style.border = "1px solid rgba(128, 128, 128, 0.25)";
        newCell.style.padding = "8px";
        newCell.innerHTML = isHeader ? "Header" : "Cell";
        row.insertBefore(newCell, row.cells[cellIndex]);
      });
      if (editorRef.current) {
        handleContentChange(editorRef.current.innerHTML);
      }
    }
  };

  const handleAddColumnRight = () => {
    if (!activeTableCell) return;
    const cellIndex = activeTableCell.cellIndex;
    const table = activeTableCell.closest("table");
    if (table) {
      Array.from(table.rows).forEach((row) => {
        const isHeader = row.parentElement?.tagName === "THEAD";
        const newCell = document.createElement(isHeader ? "th" : "td");
        newCell.style.border = "1px solid rgba(128, 128, 128, 0.25)";
        newCell.style.padding = "8px";
        newCell.innerHTML = isHeader ? "Header" : "Cell";
        row.insertBefore(newCell, row.cells[cellIndex + 1] || null);
      });
      if (editorRef.current) {
        handleContentChange(editorRef.current.innerHTML);
      }
    }
  };

  const handleDeleteColumn = () => {
    if (!activeTableCell) return;
    const cellIndex = activeTableCell.cellIndex;
    const table = activeTableCell.closest("table");
    if (table) {
      Array.from(table.rows).forEach((row) => {
        if (row.cells[cellIndex]) {
          row.deleteCell(cellIndex);
        }
      });
      setActiveTableCell(null);
      if (table.rows.length > 0 && table.rows[0].cells.length === 0) {
        table.remove();
      }
      if (editorRef.current) {
        handleContentChange(editorRef.current.innerHTML);
      }
    }
  };

  const handleDeleteTable = () => {
    if (!activeTableCell) return;
    const table = activeTableCell.closest("table");
    if (table) {
      table.remove();
      setActiveTableCell(null);
      if (editorRef.current) {
        handleContentChange(editorRef.current.innerHTML);
      }
    }
  };

  // Paint styles on selection release
  const handleEditorMouseUp = (e: React.MouseEvent) => {
    saveSelectionRange();

    // Check if user clicked an image inside the editor
    const target = e.target as HTMLElement;
    if (target.tagName === "IMG") {
      setSelectedImageNode(target as HTMLImageElement);
    } else {
      setSelectedImageNode(null);
    }

    // Check if active selection is inside a table cell
    checkActiveTableElements();

    if (!isFormatPainterActive || !paintedStyle) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);

    if (range.toString().length > 0) {
      const span = document.createElement("span");
      if (paintedStyle.fontFamily) span.style.fontFamily = paintedStyle.fontFamily;
      if (paintedStyle.fontSize) span.style.fontSize = paintedStyle.fontSize;
      if (paintedStyle.color) span.style.color = paintedStyle.color;
      if (paintedStyle.backgroundColor) span.style.backgroundColor = paintedStyle.backgroundColor;
      if (paintedStyle.fontWeight) span.style.fontWeight = paintedStyle.fontWeight;
      if (paintedStyle.fontStyle) span.style.fontStyle = paintedStyle.fontStyle;
      if (paintedStyle.textDecoration) span.style.textDecoration = paintedStyle.textDecoration;

      try {
        const fragment = range.extractContents();
        span.appendChild(fragment);
        range.insertNode(span);
      } catch (err) {
        console.error("Format painter error, falling back to CSS exec:", err);
        document.execCommand("styleWithCSS", false, "true");
        if (paintedStyle.color) document.execCommand("foreColor", false, paintedStyle.color);
        if (paintedStyle.backgroundColor) document.execCommand("hiliteColor", false, paintedStyle.backgroundColor);
      }
      
      selection.removeAllRanges();
      if (editorRef.current) {
        handleContentChange(editorRef.current.innerHTML);
      }

      // Only turn off format painter and clear style after a successful paint
      setIsFormatPainterActive(false);
      setPaintedStyle(null);
    }
  };

  // Image Upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;

      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const maxDim = 800;
        let w = img.width;
        let h = img.height;

        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        canvas.width = w;
        canvas.height = h;
        ctx?.drawImage(img, 0, 0, w, h);
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.65);

        insertElementAtCursor("img", compressedBase64);
      };
    };
    reader.readAsDataURL(file);
  };

  // Cursor-safe element insertion
  const insertElementAtCursor = (tagName: string, srcVal = "") => {
    const hasSelection = restoreSelectionRange();
    const selection = window.getSelection();
    
    // If no selection range is restored, default focus/insert to end of editor
    let range: Range;
    if (hasSelection && selection && selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
    } else {
      range = document.createRange();
      if (editorRef.current) {
        range.selectNodeContents(editorRef.current);
        range.collapse(false); // Collapse to end
      }
    }

    if (tagName === "img") {
      const img = document.createElement("img");
      img.src = srcVal;
      img.style.width = "50%"; // Default resize width to 50%
      img.style.maxWidth = "100%";
      img.style.borderRadius = "12px";
      img.style.margin = "12px auto";
      img.style.display = "block";
      img.style.cursor = "grab";
      img.setAttribute("draggable", "true");
      img.style.border = "2px transparent solid";
      
      range.insertNode(img);
      // Auto select the newly inserted image
      setSelectedImageNode(img);
    } else if (tagName === "table") {
      const table = document.createElement("table");
      table.style.width = "100%";
      table.style.borderCollapse = "collapse";
      table.style.margin = "16px 0";
      table.style.border = "1px solid rgba(128, 128, 128, 0.25)";
      
      table.innerHTML = `
        <thead>
          <tr style="background: rgba(128, 128, 128, 0.05); font-weight: bold;">
            <th style="border: 1px solid rgba(128, 128, 128, 0.25); padding: 8px; text-align: left;">Header 1</th>
            <th style="border: 1px solid rgba(128, 128, 128, 0.25); padding: 8px; text-align: left;">Header 2</th>
            <th style="border: 1px solid rgba(128, 128, 128, 0.25); padding: 8px; text-align: left;">Header 3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid rgba(128, 128, 128, 0.25); padding: 8px;">Cell 1</td>
            <td style="border: 1px solid rgba(128, 128, 128, 0.25); padding: 8px;">Cell 2</td>
            <td style="border: 1px solid rgba(128, 128, 128, 0.25); padding: 8px;">Cell 3</td>
          </tr>
          <tr>
            <td style="border: 1px solid rgba(128, 128, 128, 0.25); padding: 8px;">Cell 4</td>
            <td style="border: 1px solid rgba(128, 128, 128, 0.25); padding: 8px;">Cell 5</td>
            <td style="border: 1px solid rgba(128, 128, 128, 0.25); padding: 8px;">Cell 6</td>
          </tr>
        </tbody>
      `;
      range.insertNode(table);
    } else if (tagName === "hr") {
      const hr = document.createElement("hr");
      hr.style.border = "none";
      hr.style.borderTop = "1px solid rgba(128, 128, 128, 0.2)";
      hr.style.margin = "16px 0";
      range.insertNode(hr);
    }

    if (editorRef.current) {
      handleContentChange(editorRef.current.innerHTML);
    }
  };

  // Image editing toolbar commands
  const handleImageResize = (widthPercent: string) => {
    if (!selectedImageNode) return;
    selectedImageNode.style.width = widthPercent;
    if (editorRef.current) {
      handleContentChange(editorRef.current.innerHTML);
    }
  };

  const handleImageAlign = (align: "left" | "center" | "right") => {
    if (!selectedImageNode) return;
    if (align === "left") {
      selectedImageNode.style.display = "inline";
      selectedImageNode.style.float = "left";
      selectedImageNode.style.margin = "12px 12px 12px 0";
    } else if (align === "right") {
      selectedImageNode.style.display = "inline";
      selectedImageNode.style.float = "right";
      selectedImageNode.style.margin = "12px 0 12px 12px";
    } else {
      selectedImageNode.style.display = "block";
      selectedImageNode.style.float = "none";
      selectedImageNode.style.margin = "12px auto";
    }
    if (editorRef.current) {
      handleContentChange(editorRef.current.innerHTML);
    }
  };

  const handleImageRemove = () => {
    if (!selectedImageNode) return;
    selectedImageNode.remove();
    setSelectedImageNode(null);
    if (editorRef.current) {
      handleContentChange(editorRef.current.innerHTML);
    }
  };

  // HD clean export overhaul
  const exportNote = (format: "pdf" | "word" | "image" | "json") => {
    if (!selectedNote) return;

    if (format === "pdf") {
      // Robust popup-blocker proof printing via temporary hidden iframe
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);
      
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(`
          <html>
          <head>
            <title>${editorTitle}</title>
            <style>
              @page {
                size: A4;
                margin: 20mm 20mm 20mm 20mm;
              }
              body { 
                font-family: ${selectedFont.value}, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
                line-height: ${selectedSpacing.value}; 
                color: #111111; 
                background: white;
                margin: 0;
                padding: 0;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }
              h1 { font-size: 26pt; margin-top: 0; margin-bottom: 8pt; border-bottom: 1.5pt solid #4f46e5; padding-bottom: 6pt; font-weight: 800; color: #111111; }
              img { max-width: 100%; border-radius: 6px; margin: 12pt 0; display: block; }
              table { width: 100%; border-collapse: collapse; margin: 16pt 0; }
              th, td { border: 1px solid #d1d5db; padding: 8pt 10pt; text-align: left; font-size: 10.5pt; }
              th { background-color: #f3f4f6; font-weight: bold; }
              ul { list-style-type: disc !important; padding-left: 20pt; margin: 10pt 0; }
              ol { list-style-type: decimal !important; padding-left: 20pt; margin: 10pt 0; }
              li { margin-bottom: 4pt; }
              p { margin: 8pt 0; font-size: 11pt; }
            </style>
          </head>
          <body>
            <h1>${editorTitle || "Untitled Note"}</h1>
            <p style="font-size: 9pt; color: #6b7280; margin-bottom: 20pt; border-bottom: 1px solid #e5e7eb; padding-bottom: 10pt;">Last updated: ${new Date(selectedNote.lastModified).toLocaleDateString()}</p>
            <div style="margin-top: 15pt;">${editorContent}</div>
          </body>
          </html>
        `);
        doc.close();
      }
      
      // Wait for resources to load, print and clean up
      setTimeout(() => {
        if (iframe.contentWindow) {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        }
        document.body.removeChild(iframe);
      }, 800);

    } else if (format === "word") {
      const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <title>${editorTitle}</title>
          <style>
            body { 
              font-family: ${selectedFont.value}, Arial, sans-serif; 
              line-height: ${selectedSpacing.value}; 
              padding: 40px; 
            }
            h1 { font-size: 24pt; font-weight: bold; border-bottom: 2px solid #4f46e5; padding-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; }
            th, td { border: 1px solid #cccccc; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: bold; }
            ul { list-style-type: disc; padding-left: 20px; }
            ol { list-style-type: decimal; padding-left: 20px; }
            img { max-width: 100%; }
          </style>
        </head>
        <body>
          <h1>${editorTitle || "Untitled Note"}</h1>
          <p style="font-size: 10pt; color: #6b7280; margin-bottom: 20pt;">Last updated: ${new Date(selectedNote.lastModified).toLocaleDateString()}</p>
          <div>${editorContent}</div>
        </body>
        </html>
      `;
      const blob = new Blob(["\ufeff" + htmlContent], { type: "application/msword" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${editorTitle || "Note"}.docx`;
      link.click();
    } else if (format === "image") {
      // Overhaul: Render the actual styled HTML preview at HD 3x resolution
      const contentHeight = editorRef.current?.scrollHeight || 1000;
      const totalWidth = 800;
      const totalHeight = contentHeight + 160;

      // Clean HTML to make it strictly valid XHTML for the SVG parser
      let cleanContent = "";
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div>${editorContent}</div>`, "text/html");
        
        // Ensure all images are properly self-closed and have correct attributes
        const imgs = doc.getElementsByTagName("img");
        for (let i = 0; i < imgs.length; i++) {
          const img = imgs[i];
          if (!img.getAttribute("alt")) {
            img.setAttribute("alt", "image");
          }
        }
        
        const serializer = new XMLSerializer();
        cleanContent = serializer.serializeToString(doc.body.firstChild || doc.body);
      } catch (err) {
        console.error("XHTML serialization failed, using fallback content:", err);
        // Fallback: simple replacements for tags that must close in XHTML
        cleanContent = editorContent
          .replace(/<img([^>]*[^/])>/gi, "<img$1 />")
          .replace(/<br([^>]*[^/])>/gi, "<br$1 />")
          .replace(/<hr([^>]*[^/])>/gi, "<hr$1 />");
      }

      // Construct SVG document wrapping final styled HTML preview exactly, with custom CSS embedded
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: ${selectedFont.value}, 'Segoe UI', Roboto, sans-serif; padding: 50px; background: white; color: #111111; line-height: ${selectedSpacing.value}; min-height: 100%; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility;">
              <style>
                table { width: 100%; border-collapse: collapse; margin: 16px 0; }
                th, td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; }
                th { background: #f3f4f6; font-weight: bold; }
                ul { list-style-type: disc !important; padding-left: 20px; margin: 12px 0; }
                ol { list-style-type: decimal !important; padding-left: 20px; margin: 12px 0; }
                li { margin-bottom: 4px; }
                p { margin: 8px 0; }
                img { max-width: 100%; border-radius: 6px; display: block; margin: 12px auto; }
              </style>
              <h1 style="font-size: 30px; font-weight: 800; color: #111111; margin-bottom: 8px; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px;">${editorTitle || "Untitled Note"}</h1>
              <p style="font-size: 11px; color: #6b7280; margin-bottom: 24px; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px;">Last updated: ${new Date(selectedNote.lastModified).toLocaleDateString()}</p>
              <div style="font-size: 15px; color: #1f2937;">
                ${cleanContent}
              </div>
            </div>
          </foreignObject>
        </svg>
      `;

      // Draw SVG element to base64 Data URL and load it
      const img = new Image();
      let base64Svg;
      try {
        base64Svg = btoa(unescape(encodeURIComponent(svg)));
      } catch (e) {
        // Fallback for unicode characters encode safely
        base64Svg = btoa(encodeURIComponent(svg).replace(/%([0-9A-F]{2})/g, (match, p1) => {
          return String.fromCharCode(parseInt(p1, 16));
        }));
      }
      
      img.src = `data:image/svg+xml;base64,${base64Svg}`;
      
      img.onload = () => {
        // Add a slight delay to ensure browser paints all embedded layouts (like base64 images) inside the SVG
        setTimeout(() => {
          try {
            const canvas = document.createElement("canvas");
            // 3x scaling for Ultra High Definition (HD)
            const scale = 3;
            canvas.width = totalWidth * scale;
            canvas.height = totalHeight * scale;
            
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.scale(scale, scale);
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, 0, 0);
              const link = document.createElement("a");
              link.download = `${editorTitle || "Note"}.png`;
              link.href = canvas.toDataURL("image/png");
              link.click();
            }
          } catch (err) {
            console.error("Canvas draw or download failed:", err);
          }
        }, 300);
      };

      img.onerror = (e) => {
        console.error("SVG Image rendering failed, check for XHTML validity or external resource references.", e);
        alert("Failed to export as image. Please ensure your note doesn't contain external unsecure image links.");
      };
    } else if (format === "json") {
      const activeSubject = subjects.find(s => s.id === editorSubjectId);
      const exportPayload = {
        type: "notela_note",
        title: editorTitle || "Untitled Note",
        content: editorContent || "",
        subject: activeSubject ? {
          name: activeSubject.name,
          color: activeSubject.color
        } : null
      };
      
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(exportPayload, null, 2)
      )}`;
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = `${(editorTitle || "Note").toLowerCase().replace(/[^a-z0-9]+/g, "_")}.json`;
      link.click();
    }
  };

  const handleCreateNote = () => {
    const defaultSubject = subjectFilter !== "all" ? subjectFilter : (subjects[0]?.id || "uncategorized");
    const newNote = addNote("Untitled Note", "<div>Start typing notes here...</div>", defaultSubject);
    setSelectedNote(newNote);
    setEditorTitle(newNote.title);
    setEditorContent(newNote.content);
    setEditorSubjectId(newNote.subjectId);
    if (editorRef.current) {
      editorRef.current.innerHTML = DOMPurify.sanitize(newNote.content);
    }
    router.push(`/notes?id=${newNote.id}`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const result = importJSONData(json);
        alert(result.message);
      } catch (err) {
        alert("Invalid JSON file structure.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleDeleteNote = () => {
    if (!selectedNote) return;
    deleteNote(selectedNote.id);
    setSelectedNote(null);
    setEditorTitle("");
    setEditorContent("");
    router.push("/notes");
  };

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(noteSearch.toLowerCase()) ||
      note.content.toLowerCase().includes(noteSearch.toLowerCase());
    const matchesSubject = subjectFilter === "all" || note.subjectId === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  return (
    <div
      className={`flex flex-col lg:flex-row h-[calc(100vh-8rem)] rounded-2xl overflow-hidden glass-panel border border-white/10 dark:border-neutral-900/40 select-none ${
        isFormatPainterActive ? "painter-active" : ""
      }`}
    >
      {/* Left Column: Note List */}
      <div className="w-full lg:w-80 border-r border-white/10 dark:border-neutral-900/40 flex flex-col h-full bg-white/20 dark:bg-black/10">
        
        {/* Directories Action panel */}
        <div className="p-4 border-b border-white/10 dark:border-neutral-900/20 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-wider">My Notes</h2>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={handleImportClick}
                className="p-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white transition-all cursor-pointer"
                title="Import JSON Backup/Note"
              >
                <Upload className="w-4 h-4" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportFile}
                accept=".json"
                className="hidden"
              />
              <button
                onClick={handleCreateNote}
                className="p-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 text-indigo-500 hover:text-white transition-all cursor-pointer"
                title="New Note"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Filter notes..."
              value={noteSearch}
              onChange={(e) => setNoteSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg glass-input text-neutral-800 dark:text-neutral-200"
            />
          </div>

          <Dropdown
            value={subjectFilter}
            onChange={setSubjectFilter}
            options={filterSubjectOptions}
            className="w-full"
            buttonClassName="py-1.5 rounded-lg"
          />
        </div>

        {/* Directory Listing List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredNotes.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-400">
              No notes found.
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isActive = selectedNote?.id === note.id;
              const noteSub = subjects.find((s) => s.id === note.subjectId);

              return (
                <div
                  key={note.id}
                  onClick={() => {
                    setSelectedNote(note);
                    setEditorTitle(note.title);
                    setEditorContent(note.content);
                    setEditorSubjectId(note.subjectId);
                    router.push(`/notes?id=${note.id}`);
                  }}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    isActive
                      ? "bg-indigo-600/10 border border-indigo-500/20 text-neutral-800 dark:text-neutral-100"
                      : "hover:bg-black/5 dark:hover:bg-white/5 border border-transparent text-neutral-500 dark:text-neutral-400"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <FileText className={`w-4 h-4 shrink-0 ${isActive ? "text-indigo-500" : ""}`} />
                    <h4 className="text-xs font-semibold truncate flex-1">
                      {note.title || "Untitled Note"}
                    </h4>
                  </div>
                  <p className="text-[10px] text-neutral-400 line-clamp-1 mt-1 pl-6">
                    {note.content.replace(/<[^>]*>/g, " ") || "No content..."}
                  </p>
                  <div className="flex items-center justify-between pl-6 mt-2">
                    <span className="text-[8px] text-neutral-500">
                      {mounted
                        ? new Date(note.lastModified).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })
                        : ""}
                    </span>
                    {noteSub && (
                      <span
                        className="text-[8px] px-1 rounded font-medium border"
                        style={{
                          borderColor: `${noteSub.color}25`,
                          backgroundColor: `${noteSub.color}05`,
                          color: noteSub.color,
                        }}
                      >
                        {noteSub.name}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Advanced MS Office WYSIWYG Workspace */}
      <div className="flex-1 flex flex-col h-full bg-transparent" ref={dropdownRef}>
        {selectedNote ? (
          <>
            {/* Formatting toolbars */}
            <div className="border-b border-white/10 dark:border-neutral-900/40 p-2 shrink-0 bg-white/15 dark:bg-black/15 flex flex-wrap items-center gap-1">
              
              {/* Undo / Redo */}
              <button onClick={() => execCommand("undo")} className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-neutral-600 dark:text-neutral-300 cursor-pointer" title="Undo"><Undo className="w-4.5 h-4.5" /></button>
              <button onClick={() => execCommand("redo")} className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-neutral-600 dark:text-neutral-300 cursor-pointer" title="Redo"><Redo className="w-4.5 h-4.5" /></button>
              
              <div className="h-5 w-[1px] bg-neutral-200 dark:bg-neutral-800 mx-1" />

              {/* Custom UI Font Family Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === "font" ? null : "font")}
                  className="flex items-center justify-between space-x-1.5 px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-semibold text-neutral-700 dark:text-neutral-300 w-36 cursor-pointer"
                >
                  <span className="truncate">{selectedFont.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </button>

                {openDropdown === "font" && (
                  <div className="absolute top-9 left-0 w-44 dropdown-panel rounded-xl shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
                    {FONTS.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => {
                          setSelectedFont(f);
                          applySelectionStyle("fontFamily", f.value);
                          setOpenDropdown(null);
                        }}
                        className="w-full px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between text-left font-medium"
                      >
                        <span style={{ fontFamily: f.value }}>{f.name}</span>
                        {selectedFont.value === f.value && <Check className="w-3.5 h-3.5 text-indigo-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom UI Font Size Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === "size" ? null : "size")}
                  className="flex items-center justify-between space-x-1 px-2.5 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-semibold text-neutral-700 dark:text-neutral-300 w-18 cursor-pointer"
                >
                  <span>{selectedSize.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </button>

                {openDropdown === "size" && (
                  <div className="absolute top-9 left-0 w-24 dropdown-panel rounded-xl shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
                    {FONT_SIZES.map((sz) => (
                      <button
                        key={sz.value}
                        onClick={() => {
                          setSelectedSize(sz);
                          applySelectionStyle("fontSize", sz.value);
                          setOpenDropdown(null);
                        }}
                        className="w-full px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between text-left font-medium"
                      >
                        <span>{sz.name}</span>
                        {selectedSize.value === sz.value && <Check className="w-3.5 h-3.5 text-indigo-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-5 w-[1px] bg-neutral-200 dark:bg-neutral-800 mx-1" />

              {/* Format Painter */}
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleFormatPainterClick}
                className={`p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors ${
                  isFormatPainterActive ? "bg-indigo-600 text-white" : "text-neutral-600 dark:text-neutral-300"
                }`}
                title="Format Painter (Brush)"
              >
                <Paintbrush className="w-4.5 h-4.5" />
              </button>

              <div className="h-5 w-[1px] bg-neutral-200 dark:bg-neutral-800 mx-1" />

              {/* Standard Office formatting */}
              <button onClick={() => execCommand("bold")} className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-neutral-600 dark:text-neutral-300 cursor-pointer" title="Bold"><Bold className="w-4.5 h-4.5" /></button>
              <button onClick={() => execCommand("italic")} className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-neutral-600 dark:text-neutral-300 cursor-pointer" title="Italic"><Italic className="w-4.5 h-4.5" /></button>
              <button onClick={() => execCommand("underline")} className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-neutral-600 dark:text-neutral-300 cursor-pointer" title="Underline"><Underline className="w-4.5 h-4.5" /></button>

              {/* Text color dropdown */}
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === "color" ? null : "color")}
                  className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-neutral-600 dark:text-neutral-300 cursor-pointer font-bold text-xs"
                  title="Font Color"
                >
                  <span className="border-b-2 border-red-500 pb-0.5">A</span>
                </button>

                {openDropdown === "color" && (
                  <div className="absolute top-9 left-0 w-32 dropdown-panel rounded-xl shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
                    {COLORS.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => {
                          applySelectionStyle("color", c.value);
                          setOpenDropdown(null);
                        }}
                        className="w-full px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5 flex items-center space-x-2 text-left"
                      >
                        <span className="w-3.5 h-3.5 rounded border border-neutral-300" style={{ backgroundColor: c.value || "#6b7280" }} />
                        <span className="font-semibold">{c.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Highlight dropdown */}
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === "highlight" ? null : "highlight")}
                  className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-neutral-600 dark:text-neutral-300 cursor-pointer text-xs"
                  title="Text Highlight"
                >
                  <span className="bg-yellow-200 dark:bg-yellow-800 text-black px-1 py-0.5 rounded font-semibold">ab</span>
                </button>

                {openDropdown === "highlight" && (
                  <div className="absolute top-9 left-0 w-32 dropdown-panel rounded-xl shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
                    {HIGHLIGHTS.map((h) => (
                      <button
                        key={h.name}
                        onClick={() => {
                          applySelectionStyle("backgroundColor", h.value);
                          setOpenDropdown(null);
                        }}
                        className="w-full px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5 flex items-center space-x-2 text-left"
                      >
                        <span className="w-3.5 h-3.5 rounded border border-neutral-300" style={{ backgroundColor: h.value || "transparent" }} />
                        <span className="font-semibold">{h.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-5 w-[1px] bg-neutral-200 dark:bg-neutral-800 mx-1" />

              {/* Spacing / Line height Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === "spacing" ? null : "spacing")}
                  className="flex items-center justify-between space-x-1 px-2 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-semibold text-neutral-700 dark:text-neutral-300 w-28 cursor-pointer"
                >
                  <span>Spacing</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </button>

                {openDropdown === "spacing" && (
                  <div className="absolute top-9 left-0 w-36 dropdown-panel rounded-xl shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
                    {SPACING_OPTIONS.map((sp) => (
                      <button
                        key={sp.value}
                        onClick={() => {
                          setSelectedSpacing(sp);
                          applyLineHeight(sp.value);
                          setOpenDropdown(null);
                        }}
                        className="w-full px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between text-left font-medium"
                      >
                        <span>{sp.name}</span>
                        {selectedSpacing.value === sp.value && <Check className="w-3.5 h-3.5 text-indigo-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Alignments */}
              <button onClick={() => execCommand("justifyLeft")} className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-neutral-600 dark:text-neutral-300 cursor-pointer" title="Align Left"><AlignLeft className="w-4.5 h-4.5" /></button>
              <button onClick={() => execCommand("justifyCenter")} className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-neutral-600 dark:text-neutral-300 cursor-pointer" title="Align Center"><AlignCenter className="w-4.5 h-4.5" /></button>
              <button onClick={() => execCommand("justifyRight")} className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-neutral-600 dark:text-neutral-300 cursor-pointer" title="Align Right"><AlignRight className="w-4.5 h-4.5" /></button>
              <button onClick={() => execCommand("justifyFull")} className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-neutral-600 dark:text-neutral-300 cursor-pointer" title="Justify"><AlignJustify className="w-4.5 h-4.5" /></button>

              <div className="h-5 w-[1px] bg-neutral-200 dark:bg-neutral-800 mx-1" />

              {/* Bullet and checklist commands */}
              <button onClick={() => execCommand("insertUnorderedList")} className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-neutral-600 dark:text-neutral-300 cursor-pointer" title="Bullet List"><List className="w-4.5 h-4.5" /></button>
              <button onClick={() => execCommand("insertOrderedList")} className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-neutral-600 dark:text-neutral-300 cursor-pointer" title="Numbered List"><ListOrdered className="w-4.5 h-4.5" /></button>

              <div className="h-5 w-[1px] bg-neutral-200 dark:bg-neutral-800 mx-1" />

              {/* Insert Table & Pictures & Line break */}
              <button
                onClick={() => insertElementAtCursor("table")}
                className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-neutral-600 dark:text-neutral-300 cursor-pointer"
                title="Insert Table (3x3)"
              >
                <TableIcon className="w-4.5 h-4.5" />
              </button>

              <button
                onClick={() => imageInputRef.current?.click()}
                className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-neutral-600 dark:text-neutral-300 cursor-pointer"
                title="Insert Picture"
              >
                <ImageIcon className="w-4.5 h-4.5" />
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              <button
                onClick={() => insertElementAtCursor("hr")}
                className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-neutral-600 dark:text-neutral-300 cursor-pointer text-xs font-semibold"
                title="Horizontal Divider"
              >
                —
              </button>
            </div>

            {/* Floating context toolbar for selected image nodes */}
            {selectedImageNode && (
              <div className="bg-indigo-600/10 dark:bg-indigo-500/20 border-b border-indigo-500/20 p-2 flex items-center space-x-3 text-xs shrink-0 select-none animate-in slide-in-from-top-1 duration-150">
                <span className="font-bold text-indigo-500 flex items-center space-x-1.5">
                  <ImageIcon className="w-4 h-4" />
                  <span>Image Options:</span>
                </span>
                
                {/* Size options */}
                <div className="flex bg-black/10 dark:bg-white/10 p-0.5 rounded-lg">
                  {[
                    { label: "25%", val: "25%" },
                    { label: "50%", val: "50%" },
                    { label: "75%", val: "75%" },
                    { label: "100%", val: "100%" },
                  ].map((sz) => (
                    <button
                      key={sz.label}
                      onClick={() => handleImageResize(sz.val)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                        selectedImageNode.style.width === sz.val ? "bg-indigo-600 text-white shadow-sm" : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>

                {/* Alignment options */}
                <div className="flex bg-black/10 dark:bg-white/10 p-0.5 rounded-lg">
                  {[
                    { label: "Left", val: "left" as const },
                    { label: "Center", val: "center" as const },
                    { label: "Right", val: "right" as const },
                  ].map((al) => (
                    <button
                      key={al.label}
                      onClick={() => handleImageAlign(al.val)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200`}
                    >
                      {al.label}
                    </button>
                  ))}
                </div>

                {/* Remove option */}
                <button
                  onClick={handleImageRemove}
                  className="px-2 py-1 rounded bg-rose-500 text-white font-bold text-[10px] hover:bg-rose-600 cursor-pointer flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Picture</span>
                </button>
              </div>
            )}

            {/* Floating context toolbar for active tables */}
            {activeTableCell && (
              <div className="bg-indigo-50/90 dark:bg-indigo-950/60 border-b border-indigo-100 dark:border-indigo-900/40 p-2.5 flex flex-wrap items-center gap-3 text-xs shrink-0 select-none animate-in slide-in-from-top-1 duration-150 shadow-sm">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center space-x-1.5 mr-2">
                  <Grid className="w-4 h-4" />
                  <span>Table Tools</span>
                </span>
                
                {/* Rows Group */}
                <div className="flex items-center space-x-1 border-r border-neutral-300 dark:border-neutral-700 pr-3">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400 mr-2">Rows:</span>
                  <button
                    onClick={handleAddRowAbove}
                    className="px-2.5 py-1 text-[11px] rounded bg-white dark:bg-neutral-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 font-medium transition-colors cursor-pointer"
                  >
                    Insert Above
                  </button>
                  <button
                    onClick={handleAddRowBelow}
                    className="px-2.5 py-1 text-[11px] rounded bg-white dark:bg-neutral-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 font-medium transition-colors cursor-pointer"
                  >
                    Insert Below
                  </button>
                  <button
                    onClick={handleDeleteRow}
                    className="px-2.5 py-1 text-[11px] rounded bg-white dark:bg-neutral-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30 font-medium transition-colors cursor-pointer"
                  >
                    Delete Row
                  </button>
                </div>

                {/* Columns Group */}
                <div className="flex items-center space-x-1 border-r border-neutral-300 dark:border-neutral-700 pr-3">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400 mr-2">Columns:</span>
                  <button
                    onClick={handleAddColumnLeft}
                    className="px-2.5 py-1 text-[11px] rounded bg-white dark:bg-neutral-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 font-medium transition-colors cursor-pointer"
                  >
                    Insert Left
                  </button>
                  <button
                    onClick={handleAddColumnRight}
                    className="px-2.5 py-1 text-[11px] rounded bg-white dark:bg-neutral-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 font-medium transition-colors cursor-pointer"
                  >
                    Insert Right
                  </button>
                  <button
                    onClick={handleDeleteColumn}
                    className="px-2.5 py-1 text-[11px] rounded bg-white dark:bg-neutral-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30 font-medium transition-colors cursor-pointer"
                  >
                    Delete Col
                  </button>
                </div>

                {/* Delete Table */}
                <button
                  onClick={handleDeleteTable}
                  className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition-colors cursor-pointer flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Table</span>
                </button>
              </div>
            )}

            {/* Editor Action Header Panel */}
            <div className="h-14 border-b border-white/10 dark:border-neutral-900/40 px-4 md:px-6 flex items-center justify-between shrink-0 bg-white/10 dark:bg-black/10">
              
              {/* Subject Tag Selector */}
              <div className="flex items-center space-x-3 w-full max-w-lg">
                <Book className="w-4.5 h-4.5 text-neutral-400 shrink-0" />
                <Dropdown
                  value={editorSubjectId}
                  onChange={handleSubjectChange}
                  options={subjectOptions}
                  variant="transparent"
                  className="w-full max-w-[200px]"
                />
              </div>

              {/* Exports & Saves panel */}
              <div className="flex items-center space-x-2 shrink-0">
                {/* Import Button */}
                <button
                  onClick={handleImportClick}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-bold text-neutral-600 dark:text-neutral-300 cursor-pointer"
                  title="Import JSON Backup/Note"
                >
                  <Upload className="w-4 h-4" />
                  <span>Import</span>
                </button>

                {/* Export Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === "export" ? null : "export")}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-bold text-neutral-600 dark:text-neutral-300 cursor-pointer"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Export</span>
                  </button>

                  {openDropdown === "export" && (
                    <div className="absolute top-9 right-0 w-36 dropdown-panel rounded-xl shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
                      <button
                        onClick={() => {
                          exportNote("pdf");
                          setOpenDropdown(null);
                        }}
                        className="w-full px-4 py-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5 text-left font-semibold"
                      >
                        Export to PDF
                      </button>
                      <button
                        onClick={() => {
                          exportNote("word");
                          setOpenDropdown(null);
                        }}
                        className="w-full px-4 py-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5 text-left font-semibold"
                      >
                        Export to Word (.doc)
                      </button>
                      <button
                        onClick={() => {
                          exportNote("image");
                          setOpenDropdown(null);
                        }}
                        className="w-full px-4 py-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5 text-left font-semibold"
                      >
                        Export to PNG Image
                      </button>
                      <button
                        onClick={() => {
                          exportNote("json");
                          setOpenDropdown(null);
                        }}
                        className="w-full px-4 py-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5 text-left font-semibold"
                      >
                        Export to JSON Code
                      </button>
                    </div>
                  )}
                </div>

                {/* Save status */}
                <div className="text-xs text-neutral-400 italic">
                  {saveStatus === "saving" && <span className="flex items-center gap-1"><Save className="w-3.5 h-3.5 animate-spin" /> Saving...</span>}
                  {saveStatus === "saved" && <span className="text-emerald-500 font-semibold">✓ Saved</span>}
                </div>

                {/* Delete button */}
                <button
                  onClick={handleDeleteNote}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Delete Note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Note textareas and editors */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-neutral-100 dark:bg-neutral-950/60 flex justify-center relative">
              <div className="w-full max-w-[850px] min-h-[1100px] bg-white text-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl p-8 md:p-16 flex flex-col relative select-text">
                <input
                  type="text"
                  value={editorTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Untitled Note"
                  className="w-full text-2xl md:text-3xl font-extrabold bg-transparent border-0 border-b border-neutral-100 pb-3 focus:outline-none focus:ring-0 text-neutral-900 placeholder-neutral-400 mb-6 shrink-0"
                />

                {/* contentEditable WYSIWYG Editor */}
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onMouseUp={handleEditorMouseUp}
                  onBlur={saveSelectionRange}
                  onKeyUp={() => {
                    saveSelectionRange();
                    checkActiveTableElements();
                  }}
                  onInput={(e) => handleContentChange(e.currentTarget.innerHTML)}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="rich-text-editor flex-1 w-full bg-transparent focus:outline-none text-neutral-800 leading-relaxed font-sans text-sm md:text-base min-h-[300px]"
                  style={{
                    minHeight: "100%",
                  }}
                />

                {/* Image Resize Overlay */}
                {selectedImageNode && imageRect && (
                  <div
                    className="absolute pointer-events-none border border-indigo-500 z-30"
                    style={{
                      top: `${imageRect.top}px`,
                      left: `${imageRect.left}px`,
                      width: `${imageRect.width}px`,
                      height: `${imageRect.height}px`,
                    }}
                  >
                    {/* Corner Handles */}
                    {["tl", "tr", "bl", "br"].map((corner) => {
                      let cursor = "";
                      let positionStyle: React.CSSProperties = {};

                      if (corner === "tl") {
                        cursor = "nwse-resize";
                        positionStyle = { top: "-4px", left: "-4px" };
                      } else if (corner === "tr") {
                        cursor = "nesw-resize";
                        positionStyle = { top: "-4px", right: "-4px" };
                      } else if (corner === "bl") {
                        cursor = "nesw-resize";
                        positionStyle = { bottom: "-4px", left: "-4px" };
                      } else if (corner === "br") {
                        cursor = "nwse-resize";
                        positionStyle = { bottom: "-4px", right: "-4px" };
                      }

                      return (
                        <div
                          key={corner}
                          onMouseDown={(e) => handleResizeStart(e, corner as any)}
                          className="absolute w-2.5 h-2.5 bg-indigo-600 border border-white rounded-full pointer-events-auto shadow-md"
                          style={{
                            ...positionStyle,
                            cursor,
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <FileText className="w-16 h-16 text-neutral-600 mb-3 animate-pulse" />
            <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-200">No active note</h3>
            <p className="text-sm text-neutral-400 max-w-xs mt-1">
              Select an existing note from the sidebar directory, or click the plus button to write.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
