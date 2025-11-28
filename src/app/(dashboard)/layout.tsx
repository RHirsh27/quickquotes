export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      {/* Navigation will go here */}
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h2 className="text-xl font-semibold">Trade Job Quoter</h2>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  )
}

