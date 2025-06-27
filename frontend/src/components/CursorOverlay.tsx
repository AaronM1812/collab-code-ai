import React, { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import './CursorOverlay.css';

interface CursorInfo {
  id: string;
  username: string;
  color: string;
  position: {
    lineNumber: number;
    column: number;
  };
  selection?: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
}

interface CursorOverlayProps {
  editor: any; // Monaco editor instance
  awareness: any; // Yjs awareness object
  currentUserId: string;
}

const CursorOverlay: React.FC<CursorOverlayProps> = ({ 
  editor, 
  awareness, 
  currentUserId 
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const cursorsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const eventDisposablesRef = useRef<any[]>([]);

  useEffect(() => {
    if (!editor || !awareness || !overlayRef.current) return;

    const updateCursors = () => {
      const states = awareness.getStates();
      const currentCursors = new Set<string>();

      states.forEach((state: any, clientId: string) => {
        if (clientId === currentUserId || !state.user || !state.cursor) return;

        currentCursors.add(clientId);
        
        const cursorInfo: CursorInfo = {
          id: clientId,
          username: state.user.username,
          color: state.user.color,
          position: state.cursor,
          selection: state.selection
        };

        updateCursorElement(cursorInfo);
      });

      // Remove cursors that are no longer active
      cursorsRef.current.forEach((element, clientId) => {
        if (!currentCursors.has(clientId)) {
          element.remove();
          cursorsRef.current.delete(clientId);
        }
      });
    };

    const updateCursorElement = (cursorInfo: CursorInfo) => {
      let cursorElement = cursorsRef.current.get(cursorInfo.id);
      
      if (!cursorElement) {
        cursorElement = document.createElement('div');
        cursorElement.className = 'remote-cursor';
        cursorElement.setAttribute('data-user-id', cursorInfo.id);
        
        // Create cursor label
        const label = document.createElement('div');
        label.className = 'cursor-label';
        cursorElement.appendChild(label);
        
        overlayRef.current?.appendChild(cursorElement);
        cursorsRef.current.set(cursorInfo.id, cursorElement);
      }

      // Update cursor position
      const lineHeight = editor.getOption(monaco.editor.EditorOption.lineHeight);
      
      const top = (cursorInfo.position.lineNumber - 1) * lineHeight;
      const left = editor.getOffsetForColumn(cursorInfo.position.lineNumber, cursorInfo.position.column);

      cursorElement.style.top = `${top}px`;
      cursorElement.style.left = `${left}px`;
      cursorElement.style.height = `${lineHeight}px`;
      cursorElement.style.backgroundColor = cursorInfo.color;
      cursorElement.style.borderColor = cursorInfo.color;

      // Update cursor label
      const label = cursorElement.querySelector('.cursor-label') as HTMLDivElement;
      if (label) {
        label.textContent = cursorInfo.username;
        label.style.backgroundColor = cursorInfo.color;
      }

      // Update selection if exists
      if (cursorInfo.selection) {
        updateSelection(cursorInfo);
      }
    };

    const updateSelection = (cursorInfo: CursorInfo) => {
      if (!cursorInfo.selection) return;

      const selectionElement = document.createElement('div');
      selectionElement.className = 'remote-selection';
      selectionElement.style.backgroundColor = `${cursorInfo.color}20`;
      selectionElement.style.border = `1px solid ${cursorInfo.color}40`;

      // Calculate selection bounds
      const lineHeight = editor.getOption(monaco.editor.EditorOption.lineHeight);
      const startTop = (cursorInfo.selection.startLineNumber - 1) * lineHeight;
      const endTop = (cursorInfo.selection.endLineNumber - 1) * lineHeight;
      
      const startLeft = editor.getOffsetForColumn(cursorInfo.selection.startLineNumber, cursorInfo.selection.startColumn);
      const endLeft = editor.getOffsetForColumn(cursorInfo.selection.endLineNumber, cursorInfo.selection.endColumn);

      selectionElement.style.top = `${startTop}px`;
      selectionElement.style.left = `${startLeft}px`;
      selectionElement.style.width = `${endLeft - startLeft}px`;
      selectionElement.style.height = `${endTop - startTop + lineHeight}px`;

      overlayRef.current?.appendChild(selectionElement);

      // Remove selection after a delay
      setTimeout(() => {
        selectionElement.remove();
      }, 3000);
    };

    // Initial update
    updateCursors();

    // Listen for awareness changes
    awareness.on('change', updateCursors);

    // Listen for editor scroll and resize using disposables
    const disposables = [];
    disposables.push(editor.onDidScrollChange(() => {
      setTimeout(updateCursors, 0);
    }));
    disposables.push(editor.onDidLayoutChange(() => {
      setTimeout(updateCursors, 0);
    }));
    eventDisposablesRef.current = disposables;

    return () => {
      awareness.off('change', updateCursors);
      
      // Dispose of all event listeners
      eventDisposablesRef.current.forEach(disposable => {
        if (disposable && typeof disposable.dispose === 'function') {
          disposable.dispose();
        }
      });
      eventDisposablesRef.current = [];
      
      // Clean up cursor elements
      cursorsRef.current.forEach(element => element.remove());
      cursorsRef.current.clear();
    };
  }, [editor, awareness, currentUserId]);

  return (
    <div ref={overlayRef} className="cursor-overlay">
      {/* Cursor elements will be dynamically added here */}
    </div>
  );
};

export default CursorOverlay; 