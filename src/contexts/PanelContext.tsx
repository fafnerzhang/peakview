import { createContext, useContext, ReactNode, useState } from 'react'

interface PanelContextType {
  isPlanPanelOpen: boolean
  isAnalysisPanelOpen: boolean
  setPlanPanelOpen: (open: boolean) => void
  setAnalysisPanelOpen: (open: boolean) => void
}

const PanelContext = createContext<PanelContextType | null>(null)

export function PanelProvider({ children }: { children: ReactNode }) {
  const [isPlanPanelOpen, setPlanPanelOpen] = useState(false)
  const [isAnalysisPanelOpen, setAnalysisPanelOpen] = useState(false)

  // Debug logging
  const setPlanPanelOpenWithDebug = (open: boolean) => {
    console.log('Setting plan panel open:', open)
    setPlanPanelOpen(open)
  }

  const setAnalysisPanelOpenWithDebug = (open: boolean) => {
    console.log('Setting analysis panel open:', open)
    setAnalysisPanelOpen(open)
  }

  return (
    <PanelContext.Provider value={{
      isPlanPanelOpen,
      isAnalysisPanelOpen,
      setPlanPanelOpen: setPlanPanelOpenWithDebug,
      setAnalysisPanelOpen: setAnalysisPanelOpenWithDebug
    }}>
      {children}
    </PanelContext.Provider>
  )
}

export function usePanelContext() {
  const context = useContext(PanelContext)
  if (!context) {
    throw new Error('usePanelContext must be used within a PanelProvider')
  }
  return context
}