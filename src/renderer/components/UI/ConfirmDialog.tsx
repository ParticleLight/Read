import { createPortal } from 'react-dom'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ title, message, confirmText = '确认', cancelText = '取消', danger = false, onConfirm, onCancel }: ConfirmDialogProps) {
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-[var(--reader-sidebar)] border border-[var(--reader-border)] rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-[var(--reader-text)] mb-2">{title}</h3>
        <p className="text-sm text-[var(--reader-text)] opacity-70 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg bg-[var(--reader-border)] text-[var(--reader-text)] hover:opacity-80 transition-opacity"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm rounded-lg text-white transition-opacity hover:opacity-80 ${danger ? 'bg-red-600' : 'bg-[var(--reader-accent)]'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
