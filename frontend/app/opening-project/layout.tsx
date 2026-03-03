'use client'

import { Toaster } from 'sonner'

export default function OpeningProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
      <Toaster position="top-center" richColors />
    </div>
  )
}
