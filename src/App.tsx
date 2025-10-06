import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { RunningCoachProvider } from './contexts/RunningCoachContext'
import { LoginPage } from './components/LoginPage'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './components/Dashboard'
import { ActivityDetail } from './components/ActivityDetail'
import { ActivityOverview } from './components/ActivityOverview'
import { WorkoutPlanView } from './components/WorkoutPlanView'
import { Mastra } from '@mastra/core'
import { MastraReactProvider } from '@mastra/react'
type ViewType = 'dashboard' | 'activities' | 'activity-detail' | 'calendar' | 'goals' | 'settings' | 'chat'

function AppContent() {
  const { isAuthenticated, accessToken } = useAuth()
  const [activeView, setActiveView] = useState<ViewType>('dashboard')
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)

  const handleViewChange = (view: string) => {
    setActiveView(view as ViewType)
    if (view !== 'activity-detail') {
      setSelectedActivityId(null)
    }
  }

  const handleActivitySelect = (activityId: string) => {
    setSelectedActivityId(activityId)
    setActiveView('activity-detail')
  }

  const handleBackToActivities = () => {
    setActiveView('activities')
    setSelectedActivityId(null)
  }

  const renderMainContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />
      case 'activities':
        return <ActivityOverview onActivitySelect={handleActivitySelect} />
      case 'activity-detail':
        return <ActivityDetail onBack={handleBackToActivities} />
      case 'calendar':
        return (
          <div className="p-6 max-w-6xl mx-auto">
            <div className="text-center py-20">
              <h2 className="text-2xl font-medium text-gray-900 mb-4">Calendar View</h2>
              <p className="text-gray-600">Calendar integration coming soon...</p>
            </div>
          </div>
        )
      case 'goals':
        return (
          <div className="p-6 max-w-6xl mx-auto">
            <div className="text-center py-20">
              <h2 className="text-2xl font-medium text-gray-900 mb-4">Goals & Targets</h2>
              <p className="text-gray-600">Goal setting and tracking features coming soon...</p>
            </div>
          </div>
        )
      case 'settings':
        return (
          <div className="p-6 max-w-6xl mx-auto">
            <div className="text-center py-20">
              <h2 className="text-2xl font-medium text-gray-900 mb-4">Settings</h2>
              <p className="text-gray-600">Application settings coming soon...</p>
            </div>
          </div>
        )
      case 'chat':
        return <WorkoutPlanView onClose={() => setActiveView('chat')} />
      default:
        return <Dashboard />
    }
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />
  }
  const baseUrl = 'http://localhost:4114/'
  return (
    <MastraReactProvider baseUrl={baseUrl} headers={{ Authorization: `Bearer ${accessToken}` }}>
      <RunningCoachProvider
        accessToken={accessToken}
        agentId='runningCoach'
        onError={(error) => console.error('Running Coach error:', error)}
      >
        <div className="flex h-screen bg-gray-50">
          <Sidebar activeView={activeView} onViewChange={handleViewChange} />
          <div className={`flex-1 ${activeView === 'chat' ? 'overflow-hidden' : 'overflow-auto'}`}>
            {renderMainContent()}
          </div>
        </div>
      </RunningCoachProvider>
    </MastraReactProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
