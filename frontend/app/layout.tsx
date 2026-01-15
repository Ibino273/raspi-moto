import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MotoMarkt - Dashboard Annunci Moto',
  description: 'Dashboard per visualizzare annunci moto scrapati da Subito.it',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  )
}
