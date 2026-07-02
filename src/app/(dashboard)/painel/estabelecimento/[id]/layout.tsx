export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return <main className="flex-1 p-6">{children}</main>
}
