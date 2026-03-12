import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { Layers3, Library } from 'lucide-react'
import { useAppState } from './context'
import { showcaseDirectiveNames } from './constants'
import { AppBrand, CreatePageDialog, DeletePageDialog, ToastNotice } from './ui'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
} from '../components/ui/sidebar'

export function AppShell() {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: state => state.location.pathname })
  const {
    closeCreateDialog,
    confirmDelete,
    createDraft,
    createPage,
    deleteTarget,
    isCreateDialogOpen,
    isCreating,
    isDeleting,
    pages,
    setCreateDraft,
    setDeleteTarget,
    setToast,
    toast,
  } = useAppState()

  async function handleCreatePage() {
    const createdPage = await createPage()
    if (createdPage)
      void navigate({ to: '/editor/$pageId', params: { pageId: createdPage.id } })
  }

  async function handleDeleteConfirmed() {
    const deletedPageId = deleteTarget?.id
    await confirmDelete()
    if (deletedPageId && pathname === `/editor/${deletedPageId}`)
      void navigate({ to: '/' })
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <AppBrand />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Pages"
                    isActive={pathname === '/'}
                    onClick={() => navigate({ to: '/' })}
                  >
                    <Library className="size-4" />
                    <span>Pages</span>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>{pages.length}</SidebarMenuBadge>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Components"
                    isActive={pathname.startsWith('/components')}
                    onClick={() => navigate({ to: '/components' })}
                  >
                    <Layers3 className="size-4" />
                    <span>Components</span>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>{showcaseDirectiveNames.length}</SidebarMenuBadge>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="@container/content">
        <main className="flex-1 space-y-6 p-4 sm:p-6">
          <Outlet />
        </main>
      </SidebarInset>

      {toast && <ToastNotice toast={toast} onClose={() => setToast(null)} />}

      <CreatePageDialog
        draft={createDraft}
        isOpen={isCreateDialogOpen}
        isSubmitting={isCreating}
        onChange={setCreateDraft}
        onClose={closeCreateDialog}
        onSubmit={handleCreatePage}
      />

      <DeletePageDialog
        page={deleteTarget}
        isDeleting={isDeleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirmed}
      />
    </SidebarProvider>
  )
}
