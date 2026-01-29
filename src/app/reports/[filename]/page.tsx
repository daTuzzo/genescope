'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { 
  Dna, ArrowLeft, Download, Printer, 
  ChevronUp, FileText, AlertTriangle, Shield 
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface PageProps {
  params: Promise<{ filename: string }>
}

export default function ReportViewerPage({ params }: PageProps) {
  const { filename } = use(params)
  const router = useRouter()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [toc, setToc] = useState<{ id: string; text: string; level: number }[]>([])

  const decodedFilename = decodeURIComponent(filename)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/reports/${encodeURIComponent(decodedFilename)}`)
        if (!res.ok) throw new Error('Report not found')
        const data = await res.json()
        setContent(data.content)
        
        // Extract table of contents from headings
        const headings: { id: string; text: string; level: number }[] = []
        const headingRegex = /^(#{1,3})\s+(.+)$/gm
        let match
        while ((match = headingRegex.exec(data.content)) !== null) {
          const level = match[1].length
          const text = match[2]
          const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          headings.push({ id, text, level })
        }
        setToc(headings.slice(0, 15)) // Limit TOC items
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load report')
      }
      setLoading(false)
    }

    fetchReport()
  }, [decodedFilename])

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = decodedFilename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    window.print()
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Determine report type from filename
  let reportIcon = FileText
  let reportColor = 'text-primary'
  if (decodedFilename.includes('GENETIC_REPORT')) {
    reportIcon = Dna
    reportColor = 'text-teal-400'
  } else if (decodedFilename.includes('DISEASE_RISK')) {
    reportIcon = AlertTriangle
    reportColor = 'text-red-400'
  } else if (decodedFilename.includes('HEALTH_PROTOCOL')) {
    reportIcon = Shield
    reportColor = 'text-green-400'
  }

  const ReportIcon = reportIcon

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Dna className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-foreground/60">Loading report...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Report Not Found</h2>
          <p className="text-foreground/60 mb-4">{error}</p>
          <Button onClick={() => router.push('/reports')}>Back to Reports</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur-sm z-10 print:hidden">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-card rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground/60" />
            </button>
            <Link href="/" className="flex items-center gap-2">
              <Dna className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold gradient-text">GeneScope</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button variant="ghost" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 flex gap-8">
        {/* Table of Contents - Sidebar */}
        {toc.length > 0 && (
          <aside className="hidden lg:block w-64 flex-shrink-0 print:hidden">
            <div className="sticky top-24">
              <h3 className="text-sm font-semibold text-foreground/60 uppercase tracking-wider mb-4">
                Contents
              </h3>
              <nav className="space-y-1">
                {toc.map((item, index) => (
                  <a
                    key={index}
                    href={`#${item.id}`}
                    className={cn(
                      'block text-sm text-foreground/60 hover:text-primary transition-colors py-1',
                      item.level === 1 && 'font-medium text-foreground/80',
                      item.level === 2 && 'pl-3',
                      item.level === 3 && 'pl-6 text-xs'
                    )}
                  >
                    {item.text}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Report Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={cn('w-12 h-12 rounded-lg bg-card flex items-center justify-center', reportColor)}>
                <ReportIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {decodedFilename.replace('.md', '').replace(/_/g, ' ')}
                </h1>
                <p className="text-sm text-foreground/60">Genetic Analysis Report</p>
              </div>
            </div>
          </motion.div>

          {/* Markdown Content */}
          <motion.article
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="markdown-body bg-card border border-border rounded-xl p-8 print:border-0 print:p-0 print:bg-transparent"
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => {
                  const id = String(children).toLowerCase().replace(/[^a-z0-9]+/g, '-')
                  return <h1 id={id}>{children}</h1>
                },
                h2: ({ children }) => {
                  const id = String(children).toLowerCase().replace(/[^a-z0-9]+/g, '-')
                  return <h2 id={id}>{children}</h2>
                },
                h3: ({ children }) => {
                  const id = String(children).toLowerCase().replace(/[^a-z0-9]+/g, '-')
                  return <h3 id={id}>{children}</h3>
                },
                code: ({ className, children, ...props }) => {
                  // Check if it's an inline code (no className means inline)
                  const isInline = !className
                  const content = String(children).replace(/\n$/, '')
                  
                  // Highlight gene names (rs numbers, gene symbols)
                  if (isInline && /^(rs\d+|[A-Z][A-Z0-9]{1,10})$/.test(content)) {
                    return <code className="gene-highlight" {...props}>{children}</code>
                  }
                  
                  return <code className={className} {...props}>{children}</code>
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </motion.article>
        </main>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 bg-primary text-white rounded-full shadow-lg shadow-primary/30 hover:bg-primary-dark transition-colors print:hidden"
        >
          <ChevronUp className="w-6 h-6" />
        </motion.button>
      )}
    </div>
  )
}
