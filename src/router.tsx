import {
  Outlet,
  createBrowserHistory,
  createRootRoute,
  createRoute,
  createRouter,
  useParams,
  useRouterState,
} from '@tanstack/react-router'
import type { DirectiveName } from './components/markdown-with-directive/components/markdown-with-directive-schema'
import { AppShell } from './app/app-shell'
import { ComponentsShowcasePage } from './pages/components-showcase-page'
import { ConversionTestScenePage } from './pages/conversion-test-scene-page'
import { EditorPage } from './pages/editor-page'
import { LibraryPage } from './pages/library-page'

function RootLayout() {
  const pathname = useRouterState({ select: state => state.location.pathname })

  if (pathname.startsWith('/conversion-scene/'))
    return <Outlet />

  return <AppShell />
}

const rootRoute = createRootRoute({
  component: RootLayout,
})

const libraryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LibraryPage,
})

const editorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/editor/$pageId',
  component: function EditorRouteComponent() {
    const { pageId } = useParams({ from: editorRoute.id })
    return <EditorPage pageId={pageId} />
  },
})

const componentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/components',
  component: function ComponentsRouteComponent() {
    return <ComponentsShowcasePage />
  },
})

const componentDirectiveRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/components/$directiveName',
  component: function ComponentDirectiveRouteComponent() {
    const { directiveName } = useParams({ from: componentDirectiveRoute.id })
    return <ComponentsShowcasePage activeDirectiveName={directiveName as DirectiveName} />
  },
})

const conversionSceneRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/conversion-scene/$sceneId',
  component: function ConversionSceneRouteComponent() {
    const { sceneId } = useParams({ from: conversionSceneRoute.id })
    return <ConversionTestScenePage sceneId={sceneId} />
  },
})

const routeTree = rootRoute.addChildren([
  libraryRoute,
  editorRoute,
  componentsRoute,
  componentDirectiveRoute,
  conversionSceneRoute,
])

export const router = createRouter({
  routeTree,
  history: createBrowserHistory(),
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
