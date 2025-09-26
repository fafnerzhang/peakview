import { X } from 'lucide-react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'

interface SelectionTagsProps {
  selectedItems: string[]
  selectionDetails: { [id: string]: { type: 'phase' | 'week' | 'workout', title: string } }
  onRemoveItem: (id: string) => void
  onClearAll: () => void
}

const typeColors = {
  phase: 'bg-blue-100 text-blue-700 border-blue-200',
  week: 'bg-purple-100 text-purple-700 border-purple-200',
  workout: 'bg-green-100 text-green-700 border-green-200'
}

const typeLabels = {
  phase: 'Phase',
  week: 'Week',
  workout: 'Workout'
}

export function SelectionTags({ selectedItems, selectionDetails, onRemoveItem, onClearAll }: SelectionTagsProps) {
  if (selectedItems.length === 0) return null

  return (
    <div className="border-b border-gray-100 p-3 bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Selected for modification ({selectedItems.length} items):
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-gray-500 hover:text-gray-700 h-6 px-2"
        >
          Clear all
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
        {selectedItems.map(id => {
          const detail = selectionDetails[id]
          if (!detail) return null
          
          return (
            <Badge
              key={id}
              className={`${typeColors[detail.type]} flex items-center gap-1 px-2 py-1 text-xs`}
            >
              <span className="opacity-75">{typeLabels[detail.type]}:</span>
              <span className="max-w-24 truncate">{detail.title}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveItem(id)}
                className="h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )
        })}
      </div>
    </div>
  )
}
