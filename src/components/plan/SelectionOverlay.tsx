interface SelectionOverlayProps {
  selectionRect: { left: number; top: number; width: number; height: number } | null
}

export function SelectionOverlay({ selectionRect }: SelectionOverlayProps) {
  if (!selectionRect) return null

  return (
    <div
      className="absolute pointer-events-none border-2 border-blue-500 border-dashed bg-blue-50/20 backdrop-blur-[0.5px] z-50"
      style={{
        left: selectionRect.left,
        top: selectionRect.top,
        width: selectionRect.width,
        height: selectionRect.height,
      }}
    />
  )
}
