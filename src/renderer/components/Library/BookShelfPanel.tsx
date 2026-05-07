import { useState } from 'react'
import { useLibraryStore } from '../../stores/libraryStore'

export function BookShelfPanel() {
  const {
    bookshelves, activeShelfId,
    setActiveShelf, createBookshelf, deleteBookshelf, renameBookshelf,
  } = useLibraryStore()

  const [newName, setNewName] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [contextMenu, setContextMenu] = useState<{ id: number; x: number; y: number } | null>(null)

  const handleCreate = () => {
    if (newName.trim()) {
      createBookshelf(newName.trim())
      setNewName('')
      setShowInput(false)
    }
  }

  const handleRename = () => {
    if (editingId !== null && editName.trim()) {
      renameBookshelf(editingId, editName.trim())
      setEditingId(null)
      setEditName('')
    }
  }

  const handleContextMenu = (e: React.MouseEvent, shelfId: number) => {
    e.preventDefault()
    setContextMenu({ id: shelfId, x: e.clientX, y: e.clientY })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2">
        <h3 className="text-xs font-semibold text-[var(--reader-text)] opacity-50 uppercase tracking-wider mb-2">书柜</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {/* All books */}
        <button
          onClick={() => setActiveShelf(null)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
            activeShelfId === null
              ? 'bg-[var(--reader-accent)] text-white'
              : 'text-[var(--reader-text)] opacity-70 hover:opacity-100 hover:bg-[var(--reader-sidebar)]'
          }`}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          全部书籍
        </button>

        {/* Bookshelves */}
        {bookshelves.map((shelf) => (
          <div key={shelf.id}>
            {editingId === shelf.id ? (
              <div className="flex gap-1 px-1">
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditingId(null) }}
                  onBlur={handleRename}
                  className="flex-1 px-2 py-1 text-sm bg-[var(--reader-bg)] border border-[var(--reader-border)] rounded text-[var(--reader-text)] focus:outline-none"
                />
              </div>
            ) : (
              <button
                onClick={() => setActiveShelf(shelf.id)}
                onContextMenu={(e) => handleContextMenu(e, shelf.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                  activeShelfId === shelf.id
                    ? 'bg-[var(--reader-accent)] text-white'
                    : 'text-[var(--reader-text)] opacity-70 hover:opacity-100 hover:bg-[var(--reader-sidebar)]'
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span className="truncate">{shelf.name}</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add new shelf */}
      <div className="px-2 py-2 border-t border-[var(--reader-border)]">
        {showInput ? (
          <div className="flex gap-1">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setShowInput(false); setNewName('') } }}
              placeholder="书柜名称..."
              className="flex-1 px-2 py-1 text-sm bg-[var(--reader-bg)] border border-[var(--reader-border)] rounded text-[var(--reader-text)] placeholder-gray-500 focus:outline-none"
            />
            <button onClick={handleCreate} className="px-2 py-1 text-xs bg-[var(--reader-accent)] text-white rounded">确定</button>
          </div>
        ) : (
          <button
            onClick={() => setShowInput(true)}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-[var(--reader-text)] opacity-50 hover:opacity-80 hover:bg-[var(--reader-sidebar)] transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新建书柜
          </button>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-50 bg-[var(--reader-sidebar)] border border-[var(--reader-border)] rounded-lg shadow-xl py-1 min-w-[120px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => {
                const shelf = bookshelves.find((s) => s.id === contextMenu.id)
                if (shelf) { setEditingId(shelf.id); setEditName(shelf.name) }
                setContextMenu(null)
              }}
              className="w-full text-left px-4 py-2 text-sm text-[var(--reader-text)] hover:bg-[var(--reader-border)]"
            >
              重命名
            </button>
            <button
              onClick={() => { deleteBookshelf(contextMenu.id); setContextMenu(null) }}
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[var(--reader-border)]"
            >
              删除
            </button>
          </div>
        </>
      )}
    </div>
  )
}
