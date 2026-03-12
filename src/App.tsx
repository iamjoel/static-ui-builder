import { RouterProvider } from '@tanstack/react-router'
import { AppStateProvider } from './app/context'
import { router } from './router'

export default function App() {
  return (
    <AppStateProvider>
      <RouterProvider router={router} />
    </AppStateProvider>
  )
}
