import PublicHeader from '@/components/public/PublicHeader'
import PublicFooter from '@/components/public/PublicFooter'
import GlobalBreadcrumb from '@/components/GlobalBreadcrumb'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <PublicHeader />
      <GlobalBreadcrumb />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  )
}
