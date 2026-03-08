import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const PageTitleContext = createContext(null)

export function PageTitleProvider({ children }) {
  const [title, setTitle] = useState('')
  const setPageTitle = useCallback((t) => setTitle(t ?? ''), [])
  return (
    <PageTitleContext.Provider value={{ title, setPageTitle }}>
      {children}
    </PageTitleContext.Provider>
  )
}

/** Call with the page title; it will be set when the component mounts and cleared when it unmounts. */
export function usePageTitle(title) {
  const { setPageTitle } = useContext(PageTitleContext) ?? {}
  useEffect(() => {
    if (setPageTitle) setPageTitle(title ?? '')
    return () => setPageTitle?.('')
  }, [title, setPageTitle])
}

export function usePageTitleValue() {
  return useContext(PageTitleContext)?.title ?? ''
}
