import React, { useState } from 'react';
import { nowISO, findById, findPath } from '../utils/helpers';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { PromptModal, ConfirmModal, AlertModal } from './Modal';

export default function Sidebar({ project, setProject, selectedId, setSelectedId, query }) {
  // Track which folders are expanded (default is collapsed, so we track expanded state)
  const [expanded, setExpanded] = useState({});
  const [activeId, setActiveId] = useState(null);

  // Modal states
  const [renameModal, setRenameModal] = useState({ open: false, node: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, node: null, itemType: '' });
  const [alertModal, setAlertModal] = useState({ open: false, title: '', message: '' });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const toggleCollapse = (nodeId) => {
    setExpanded(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const matchesQuery = (node) => {
    if (!query) return true;
    const q = query.toLowerCase();
    if (node.title?.toLowerCase().includes(q)) return true;
    if (node.type === 'chapter') {
      if (node.synopsis?.toLowerCase().includes(q)) return true;
      if (node.tags?.some(t => t.toLowerCase().includes(q))) return true;
    }
    return false;
  };

  const hasMatchingDescendant = (node) => {
    if (matchesQuery(node)) return true;
    if (node.type === 'folder' && node.children) {
      return node.children.some(child => hasMatchingDescendant(child));
    }
    return false;
  };

  const findParent = (root, targetId, parent = null) => {
    if (root.id === targetId) return parent;
    if (root.children) {
      for (const child of root.children) {
        const found = findParent(child, targetId, root);
        if (found) return found;
      }
    }
    return null;
  };

  const isAncestor = (sourceId, targetId) => {
    const sourceNode = findById(project.root, sourceId);
    if (!sourceNode || sourceNode.type !== 'folder') return false;
    const checkDescendants = (node) => {
      if (node.id === targetId) return true;
      if (node.children) return node.children.some(checkDescendants);
      return false;
    };
    return checkDescendants(sourceNode);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const sourceId = active.id;
    const overId = over.id;

    if (typeof overId === 'string' && overId.startsWith('dropzone-')) {
      const parts = overId.split('-');
      const parentId = parts[1];
      const index = parseInt(parts[2], 10);

      if (isAncestor(sourceId, parentId)) return;

      const next = structuredClone(project);
      const sourceNode = findById(next.root, sourceId);
      const sourceParent = findParent(next.root, sourceId);

      if (!sourceNode || !sourceParent) return;

      const sourceIndex = sourceParent.children.findIndex(c => c.id === sourceId);
      if (sourceIndex === -1) return;
      sourceParent.children.splice(sourceIndex, 1);

      const targetParent = parentId === project.root.id ? next.root : findById(next.root, parentId);
      if (!targetParent || !targetParent.children) return;

      let adjustedIndex = index;
      if (sourceParent.id === targetParent.id && sourceIndex < index) {
        adjustedIndex = Math.max(0, index - 1);
      }

      targetParent.children.splice(adjustedIndex, 0, sourceNode);
      next.updatedAt = nowISO();
      setProject(next);
    } else if (typeof overId === 'string' && overId.startsWith('folder-')) {
      const folderId = overId.replace('folder-', '');

      if (sourceId === folderId || isAncestor(sourceId, folderId)) return;

      const next = structuredClone(project);
      const sourceNode = findById(next.root, sourceId);
      const sourceParent = findParent(next.root, sourceId);
      const targetFolder = findById(next.root, folderId);

      if (!sourceNode || !sourceParent || !targetFolder) return;

      const sourceIndex = sourceParent.children.findIndex(c => c.id === sourceId);
      if (sourceIndex === -1) return;
      sourceParent.children.splice(sourceIndex, 1);

      targetFolder.children.push(sourceNode);
      next.updatedAt = nowISO();
      setProject(next);
    }
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeNode = activeId ? findById(project.root, activeId) : null;

  // Drop zone component (blue line between items)
  const DropZone = ({ parentId, index, depth, isBookLevel = false }) => {
    const id = `dropzone-${parentId}-${index}`;
    const { isOver, setNodeRef } = useDroppable({ id });

    return (
      <div
        ref={setNodeRef}
        className={`relative transition-all duration-150 ${isOver ? (isBookLevel ? 'h-4' : 'h-3') : (isBookLevel ? 'h-2' : 'h-1')}`}
        style={{ marginLeft: depth * 16 }}
      >
        {isOver && (
          <div className={`absolute left-2 right-2 top-1/2 -translate-y-1/2 ${isBookLevel ? 'h-1' : 'h-0.5'} bg-blue-500 rounded`} />
        )}
      </div>
    );
  };

  // Folder drop target for nesting
  const FolderDropTarget = ({ folderId, children, className }) => {
    const id = `folder-${folderId}`;
    const { isOver, setNodeRef } = useDroppable({ id });

    return (
      <div
        ref={setNodeRef}
        className={`${className} ${isOver ? 'ring-2 ring-blue-500' : ''}`}
      >
        {children}
      </div>
    );
  };

  // 3D Book Card Component (folders)
  const BookCard = ({ node, depth = 0 }) => {
    const isSelected = node.id === selectedId;
    const isExpanded = expanded[node.id];
    const hasChildren = node.children && node.children.length > 0;
    const visible = hasMatchingDescendant(node);

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      isDragging,
    } = useDraggable({ id: node.id });

    const style = transform ? {
      transform: CSS.Transform.toString(transform),
    } : undefined;

    if (!visible) return null;

    const handleClick = (e) => {
      if (!isDragging) {
        setSelectedId(node.id);
        toggleCollapse(node.id);
      }
    };

    return (
      <FolderDropTarget
        folderId={node.id}
        className={`
          relative rounded-lg cursor-pointer select-none transition-all duration-150
          ${isDragging ? 'opacity-40 scale-95' : ''}
        `}
      >
        <div
          ref={setNodeRef}
          {...attributes}
          {...listeners}
          onClick={handleClick}
          style={{
            ...style,
            marginLeft: depth * 16,
          }}
          className={`
            relative px-3 py-2.5 rounded-lg
            transition-all duration-150 ease-out
            border
            ${isSelected
              ? 'bg-gradient-to-b from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-950 border-blue-300 dark:border-blue-700 shadow-md'
              : 'bg-gradient-to-b from-white to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 border-neutral-200 dark:border-neutral-700 shadow-sm'
            }
            hover:shadow-lg hover:-translate-y-0.5
            active:shadow-inner active:translate-y-0 active:from-neutral-100 active:to-neutral-200 dark:active:from-neutral-900 dark:active:to-neutral-950
            ${isDragging ? '' : 'hover:border-neutral-300 dark:hover:border-neutral-600'}
          `}
        >
          {/* Top highlight for 3D effect */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 dark:via-white/20 to-transparent rounded-t-lg" />

          {/* Content */}
          <div className="flex items-center gap-2">
            <span className="text-lg">📚</span>
            <span className="font-semibold flex-1 truncate">{node.title}</span>
            {hasChildren && (
              <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                {node.children.length}
              </span>
            )}
            <span className={`text-xs text-neutral-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
              ›
            </span>
          </div>

          {/* Bottom shadow for 3D effect */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-black/10 dark:via-black/30 to-transparent rounded-b-lg" />
        </div>
      </FolderDropTarget>
    );
  };

  // Chapter Item Component (simple list item with drag handle)
  const ChapterItem = ({ node, depth = 0 }) => {
    const isSelected = node.id === selectedId;
    const visible = hasMatchingDescendant(node);

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      isDragging,
    } = useDraggable({ id: node.id });

    const style = transform ? {
      transform: CSS.Transform.toString(transform),
    } : undefined;

    if (!visible) return null;

    const handleClick = () => {
      if (!isDragging) {
        setSelectedId(node.id);
      }
    };

    return (
      <div
        className={`
          group flex items-center px-2 py-1.5 rounded cursor-pointer transition-colors
          hover:bg-neutral-100 dark:hover:bg-neutral-900
          ${isSelected ? 'bg-neutral-200 dark:bg-neutral-800' : ''}
          ${isDragging ? 'opacity-30' : ''}
        `}
        style={{ marginLeft: depth * 16 }}
        onClick={handleClick}
      >
        {/* Drag handle for chapters */}
        <span
          ref={setNodeRef}
          {...attributes}
          {...listeners}
          className="mr-1 cursor-grab active:cursor-grabbing opacity-30 group-hover:opacity-60 select-none touch-none"
          title="Drag to reorder"
          style={style}
        >
          ⋮⋮
        </span>
        <span className="w-5 h-5 mr-1" />
        <span className="mr-2 opacity-60">📄</span>
        <span className="font-medium flex-1 truncate">{node.title}</span>
        <span className="ml-2 text-xs opacity-60 shrink-0">{node.status || 'Draft'}</span>
      </div>
    );
  };

  // Drag overlay (what you see while dragging)
  const DragOverlayContent = ({ node }) => {
    if (!node) return null;

    const isFolder = node.type === 'folder';
    const hasChildren = isFolder && node.children && node.children.length > 0;

    if (isFolder) {
      return (
        <div className="px-3 py-2.5 rounded-lg bg-gradient-to-b from-white to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 border border-neutral-300 dark:border-neutral-600 shadow-xl opacity-95">
          <div className="flex items-center gap-2">
            <span className="text-lg">📚</span>
            <span className="font-semibold truncate">{node.title}</span>
            {hasChildren && (
              <span className="text-xs text-neutral-500 tabular-nums">{node.children.length}</span>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center px-2 py-1.5 rounded bg-white dark:bg-neutral-800 shadow-xl border border-neutral-200 dark:border-neutral-700 opacity-95">
        <span className="mr-1 opacity-60">⋮⋮</span>
        <span className="w-5 h-5 mr-1" />
        <span className="mr-2 opacity-60">📄</span>
        <span className="font-medium truncate">{node.title}</span>
        <span className="ml-2 text-xs opacity-60 shrink-0">{node.status || 'Draft'}</span>
      </div>
    );
  };

  // Render tree recursively
  const renderTree = (node, depth = 0, isRoot = false) => {
    const isFolder = node.type === 'folder';
    // Root is always expanded, other folders check expanded state
    const isExpanded = isRoot || expanded[node.id];
    const visible = hasMatchingDescendant(node);

    if (!visible && !isRoot) return null;

    const children = isFolder && isExpanded && node.children ? node.children : [];
    const effectiveDepth = isRoot ? 0 : depth + 1;
    const isBookLevel = isRoot; // Books are direct children of root

    return (
      <div key={node.id}>
        {!isRoot && (
          isFolder ? <BookCard node={node} depth={depth} /> : <ChapterItem node={node} depth={depth} />
        )}
        {isFolder && isExpanded && (
          <div>
            <DropZone parentId={node.id} index={0} depth={effectiveDepth} isBookLevel={isBookLevel} />
            {children.map((child, i) => (
              <div key={child.id}>
                {renderTree(child, effectiveDepth, false)}
                <DropZone parentId={node.id} index={i + 1} depth={effectiveDepth} isBookLevel={isBookLevel} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const delSelected = () => {
    if (!selectedId) return;
    const selectedNode = findById(project.root, selectedId);
    if (selectedNode?.id === project.root.id) {
      setAlertModal({ open: true, title: 'Cannot Delete', message: 'Cannot delete the root folder.' });
      return;
    }
    const itemType = selectedNode?.type === 'folder' ? 'book and all its chapters' : 'chapter';
    setDeleteModal({ open: true, node: selectedNode, itemType });
  };

  const confirmDelete = () => {
    const next = structuredClone(project);
    const path = findPath(next.root, selectedId);
    if (!path) return;

    let parent = next.root;
    for (let i = 0; i < path.length - 1; i++) parent = parent.children[path[i]];
    parent.children.splice(path[path.length - 1], 1);
    next.updatedAt = nowISO();
    setProject(next);
    setSelectedId(next.root.id);
    setDeleteModal({ open: false, node: null, itemType: '' });
  };

  const renameSelected = () => {
    if (!selectedId) return;
    const node = findById(project.root, selectedId);
    if (node.id === project.root.id) {
      setAlertModal({ open: true, title: 'Cannot Rename', message: 'Cannot rename the root folder.' });
      return;
    }
    setRenameModal({ open: true, node });
  };

  const confirmRename = (newTitle) => {
    if (!newTitle || !renameModal.node) {
      setRenameModal({ open: false, node: null });
      return;
    }
    const next = structuredClone(project);
    const node = findById(next.root, renameModal.node.id);
    node.title = newTitle;
    next.updatedAt = nowISO();
    setProject(next);
    setRenameModal({ open: false, node: null });
  };

  return (
    <div className="w-72 border-r border-neutral-200 dark:border-neutral-800 flex flex-col">
      <div className="p-3 font-semibold text-lg border-b border-neutral-200 dark:border-neutral-800">
        Writer's Workbench
      </div>
      <div className="flex-1 overflow-auto p-2">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          {renderTree(project.root, 0, true)}
          <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
            {activeNode ? <DragOverlayContent node={activeNode} /> : null}
          </DragOverlay>
        </DndContext>
      </div>
      <div className="p-2 flex gap-2 border-t border-neutral-200 dark:border-neutral-800">
        <button
          className="relative px-3 py-1.5 rounded-lg font-medium transition-all duration-150 ease-out
            bg-gradient-to-b from-white to-neutral-100 dark:from-neutral-700 dark:to-neutral-800
            border border-neutral-200 dark:border-neutral-600
            shadow-sm hover:shadow-md hover:-translate-y-0.5
            active:shadow-inner active:translate-y-0 active:from-neutral-100 active:to-neutral-200 dark:active:from-neutral-800 dark:active:to-neutral-900"
          onClick={renameSelected}
        >
          <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 dark:via-white/20 to-transparent rounded-t-lg" />
          Rename
        </button>
        <button
          className="relative px-3 py-1.5 rounded-lg font-medium transition-all duration-150 ease-out
            bg-gradient-to-b from-red-50 to-red-100 dark:from-red-900 dark:to-red-950
            border border-red-200 dark:border-red-800
            text-red-700 dark:text-red-200
            shadow-sm hover:shadow-md hover:-translate-y-0.5
            active:shadow-inner active:translate-y-0 active:from-red-100 active:to-red-200 dark:active:from-red-950 dark:active:to-red-900"
          onClick={delSelected}
        >
          <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent rounded-t-lg" />
          Delete
        </button>
      </div>

      {/* Modals */}
      <PromptModal
        isOpen={renameModal.open}
        title={`Rename ${renameModal.node?.type === 'folder' ? 'Book' : 'Chapter'}`}
        message="Enter a new name:"
        defaultValue={renameModal.node?.title || ''}
        onConfirm={confirmRename}
        onCancel={() => setRenameModal({ open: false, node: null })}
      />

      <ConfirmModal
        isOpen={deleteModal.open}
        title="Delete"
        message={`Are you sure you want to delete this ${deleteModal.itemType}? This cannot be undone.`}
        confirmText="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ open: false, node: null, itemType: '' })}
      />

      <AlertModal
        isOpen={alertModal.open}
        title={alertModal.title}
        message={alertModal.message}
        onClose={() => setAlertModal({ open: false, title: '', message: '' })}
      />
    </div>
  );
}
