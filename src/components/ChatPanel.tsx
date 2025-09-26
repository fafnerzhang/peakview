import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User } from 'lucide-react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { ScrollArea } from './ui/scroll-area'
import { SelectionTags } from './SelectionTags'

interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
}

interface ChatPanelProps {
  selectedItems?: string[]
  selectionDetails?: { [id: string]: { type: 'phase' | 'week' | 'workout', title: string } }
  onRemoveSelection?: (id: string) => void
  onClearSelection?: () => void
}

export function ChatPanel({ 
  selectedItems = [], 
  selectionDetails = {}, 
  onRemoveSelection,
  onClearSelection 
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "Hi! I'm your AI running coach. I can help you understand your training metrics, plan your workouts, and optimize your performance. What would you like to know about your running today?",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])

    // Simulate AI response
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: getBotResponse(inputValue),
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, botMessage])
    }, 1000)

    setInputValue('')
  }

  const getBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase()
    
    if (input.includes('pace') || input.includes('speed')) {
      return "Your average pace for recent runs has been around 5:37/km, which is great! To improve your pace, try incorporating interval training and tempo runs into your weekly routine. Would you like me to suggest a specific workout plan?"
    }
    
    if (input.includes('heart rate') || input.includes('hr')) {
      return "Your average heart rate of 142 bpm suggests you're training in the aerobic zone, which is excellent for building endurance. For optimal training, aim to spend 80% of your time in zones 1-2 (easy pace) and 20% in higher intensity zones."
    }
    
    if (input.includes('distance') || input.includes('weekly')) {
      return "You've covered 39.29km this week across 5 runs - that's solid consistency! For sustainable progress, try to increase your weekly mileage by no more than 10% each week. Your current training load looks well-balanced."
    }
    
    if (input.includes('recovery') || input.includes('rest')) {
      return "Based on your recent activities, you're maintaining good consistency. Make sure to include at least 1-2 rest days per week and consider easy recovery runs between harder sessions. How are you feeling energy-wise?"
    }
    
    if (input.includes('goal') || input.includes('target')) {
      return "What's your current running goal? Whether it's a 5K, 10K, half marathon, or just general fitness, I can help you create a structured training plan based on your current fitness level and running history."
    }
    
    return "That's an interesting question! Based on your running data, I can help you with training advice, pace analysis, recovery recommendations, and goal setting. Could you be more specific about what aspect of your running you'd like to improve?"
  }

  const quickQuestions = [
    "How can I improve my pace?",
    "Analyze my heart rate zones",
    "What's my weekly progress?",
    "Recovery recommendations",
  ]

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
            <Bot className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="font-medium text-gray-900">AI Running Coach</h2>
            <p className="text-sm text-gray-600">Ask me anything about your training</p>
          </div>
        </div>
      </div>

      {/* Selection Tags */}
      <SelectionTags
        selectedItems={selectedItems}
        selectionDetails={selectionDetails}
        onRemoveItem={onRemoveSelection || (() => {})}
        onClearAll={onClearSelection || (() => {})}
      />

      {/* Messages */}
      <div className="flex-1 min-h-0">
        <div className="h-full overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.type === 'bot' && (
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full flex-shrink-0">
                  <Bot className="w-4 h-4 text-green-600" />
                </div>
              )}
              <Card
                className={`max-w-[80%] p-3 ${
                  message.type === 'user'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </Card>
              {message.type === 'user' && (
                <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full flex-shrink-0">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Quick Questions */}
      <div className="p-4 border-t border-gray-100">
        <div className="mb-3">
          <p className="text-sm text-gray-600 mb-2">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setInputValue(question)}
                className="text-xs"
              >
                {question}
              </Button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask about your training, goals, or performance..."
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
