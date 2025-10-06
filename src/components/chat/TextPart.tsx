import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface TextPartProps {
  text: string
  state?: 'streaming' | 'output-available' | 'input-available'
}

export function TextPart({ text, state }: TextPartProps) {
  const [displayText, setDisplayText] = useState('')
  const [isAnimating, setIsAnimating] = useState(state === 'streaming')

  useEffect(() => {
    if (state === 'streaming') {
      // Simulate streaming text animation
      let currentIndex = 0
      const interval = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayText(text.slice(0, currentIndex + 1))
          currentIndex++
        } else {
          setIsAnimating(false)
          clearInterval(interval)
        }
      }, 20)

      return () => clearInterval(interval)
    } else {
      setDisplayText(text)
      setIsAnimating(false)
    }
  }, [text, state])

  const formatText = (text: string) => {
    // Split by double newlines for paragraphs
    const paragraphs = text.split('\n\n')

    return paragraphs.map((paragraph, index) => {
      // Handle bullet points
      if (paragraph.includes('*   **')) {
        const lines = paragraph.split('\n')
        return (
          <div key={index} className="space-y-3">
            {lines.map((line, lineIndex) => {
              if (line.startsWith('*   **')) {
                // Phase descriptions with bold titles
                const match = line.match(/\*\s+\*\*(.*?)\*\*:?\s*(.*)/)
                if (match) {
                  return (
                    <div key={lineIndex} className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                      <h4 className="text-green-800 font-semibold mb-2">{match[1]}</h4>
                      <p className="text-green-700 text-sm leading-relaxed">{match[2]}</p>
                    </div>
                  )
                }
              } else if (line.startsWith('*   ')) {
                // Regular bullet points
                return (
                  <div key={lineIndex} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-gray-700 leading-relaxed">{line.replace('*   ', '')}</p>
                  </div>
                )
              } else if (line.trim()) {
                return (
                  <p key={lineIndex} className="text-gray-800 leading-relaxed">
                    {line}
                  </p>
                )
              }
              return null
            })}
          </div>
        )
      }

      // Handle week schedules
      if (paragraph.includes('**第') || paragraph.includes('**星期')) {
        const lines = paragraph.split('\n')
        return (
          <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-5">
            {lines.map((line, lineIndex) => {
              if (line.includes('**第') && line.includes('週')) {
                return (
                  <h3 key={lineIndex} className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-300 pb-2">
                    {line.replace(/\*\*/g, '')}
                  </h3>
                )
              } else if (line.startsWith('*   **星期')) {
                const match = line.match(/\*\s+\*\*(.*?)\*\*:?\s*(.*)/)
                if (match) {
                  return (
                    <div key={lineIndex} className="mb-3 p-3 bg-white border border-gray-200 rounded-lg">
                      <div className="font-medium text-gray-800 mb-1">{match[1]}</div>
                      <p className="text-gray-600 text-sm">{match[2]}</p>
                    </div>
                  )
                }
              } else if (line.trim() && !line.includes('**')) {
                return (
                  <p key={lineIndex} className="text-gray-700 mb-2 leading-relaxed">
                    {line}
                  </p>
                )
              }
              return null
            })}
          </div>
        )
      }

      // Regular paragraphs
      if (paragraph.trim()) {
        return (
          <p key={index} className="text-gray-800 leading-relaxed">
            {paragraph}
          </p>
        )
      }

      return null
    }).filter(Boolean)
  }

  return (
    <div className="prose prose-sm max-w-none">
      <div className="space-y-4">
        {formatText(displayText)}
        {isAnimating && (
          <div className="flex items-center space-x-2 text-green-600">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-xs">AI 正在回應中...</span>
          </div>
        )}
      </div>
    </div>
  )
}
