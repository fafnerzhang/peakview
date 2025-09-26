import { useState } from 'react'
import { Activity, BarChart3, Calendar, MessageCircle, Target, Menu, User } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

interface SidebarProps {
  activeView: string
  onViewChange: (view: string) => void
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'activities', label: 'Activities', icon: Activity },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'goals', label: 'Goals', icon: Target },
  ]

  const MenuItem = ({ item }: { item: any }) => {
    const Icon = item.icon
    const button = (
      <button
        onClick={() => onViewChange(item.id)}
        className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2'} rounded-lg transition-colors ${
          activeView === item.id
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <Icon className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'}`} />
        {!isCollapsed && <span>{item.label}</span>}
      </button>
    )

    if (isCollapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {button}
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{item.label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return button
  }

  const UserMenuItem = () => {
    const button = (
      <button
        onClick={() => onViewChange('settings')}
        className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'} rounded-lg transition-colors ${
          activeView === 'settings'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <User className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0`} />
        {!isCollapsed && <span>Settings</span>}
      </button>
    )

    if (isCollapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {button}
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return button
  }

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-100 h-screen flex flex-col transition-all duration-300`}>
      {/* Simple Header */}
      <div className={`${isCollapsed ? 'px-2 pt-2' : 'p-4'}`}>
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-medium text-gray-900">RunTracker</span>
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-full p-3 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50"
          >
            <Menu className="w-6 h-6 mx-auto" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const button = (
              <button
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'} rounded-lg transition-colors ${
                  activeView === item.id
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0`} />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            )

            if (isCollapsed) {
              return (
                <li key={item.id}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {button}
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{item.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </li>
              )
            }

            return (
              <li key={item.id}>
                {button}
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User Settings at Bottom */}
      <div className={`${isCollapsed ? 'px-2 pb-2' : 'p-4'} border-t border-gray-100`}>
        <UserMenuItem />
      </div>
    </div>
  )
}
