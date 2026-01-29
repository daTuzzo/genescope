'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Dna, FileText, AlertTriangle, Shield, Heart, 
  Pill, Brain, Activity, ChevronRight, RefreshCw 
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Report {
  filename: string
  title: string
  type: string
  size: number
  modified: string
}

const reportIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  genetic: Dna,
  disease: AlertTriangle,
  protocol: Shield,
  other: FileText,
}

const categoryData = [
  { name: 'Drug Metabolism', icon: Pill, color: 'text-purple-400', bgColor: 'bg-purple-400/10' },
  { name: 'Cardiovascular', icon: Heart, color: 'text-red-400', bgColor: 'bg-red-400/10' },
  { name: 'Neurological', icon: Brain, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  { name: 'Metabolic', icon: Activity, color: 'text-green-400', bgColor: 'bg-green-400/10' },
]

function DashboardContent() {
  const searchParams = useSearchParams()
  const analysisId = searchParams.get('id')
  
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReports = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/reports')
      const data = await res.json()
      setReports(data.reports || [])
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchReports()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Dna className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold gradient-text">GeneScope</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-foreground/60 hover:text-foreground transition-colors">
              Upload
            </Link>
            <Link href="/reports" className="text-foreground/60 hover:text-foreground transition-colors">
              Reports
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Analysis Status */}
        {analysisId && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-success/10 border border-success/20 rounded-xl p-4 flex items-center gap-3"
          >
            <Shield className="w-6 h-6 text-success" />
            <div>
              <p className="font-medium text-foreground">Analysis Complete</p>
              <p className="text-sm text-foreground/60">ID: {analysisId}</p>
            </div>
          </motion.div>
        )}

        {/* Page Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Analysis Dashboard</h1>
            <p className="text-foreground/60">View your genetic analysis reports and insights</p>
          </div>
          <Button variant="secondary" onClick={fetchReports} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {categoryData.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:border-primary/30 transition-all">
                <div className={`w-12 h-12 rounded-lg ${category.bgColor} flex items-center justify-center mb-3`}>
                  <category.icon className={`w-6 h-6 ${category.color}`} />
                </div>
                <h3 className="font-medium text-foreground">{category.name}</h3>
                <p className="text-sm text-foreground/60">View findings</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Reports Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Generated Reports</h2>
          
          {loading ? (
            <div className="grid md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
                  <div className="w-12 h-12 bg-border rounded-lg mb-4" />
                  <div className="h-6 bg-border rounded w-3/4 mb-2" />
                  <div className="h-4 bg-border rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : reports.length === 0 ? (
            <Card className="text-center py-12">
              <FileText className="w-12 h-12 text-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Reports Yet</h3>
              <p className="text-foreground/60 mb-4">Upload and analyze your genome file to generate reports</p>
              <Link href="/">
                <Button>Upload Genome File</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {reports.map((report, index) => {
                const Icon = reportIcons[report.type] || FileText
                return (
                  <motion.div
                    key={report.filename}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link href={`/reports/${encodeURIComponent(report.filename)}`}>
                      <Card hover className="h-full">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <CardHeader className="p-0 mb-2">
                          <CardTitle className="flex items-center justify-between">
                            {report.title}
                            <ChevronRight className="w-5 h-5 text-foreground/40" />
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <p className="text-sm text-foreground/60">
                            {new Date(report.modified).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                          <p className="text-xs text-foreground/40 mt-1">
                            {(report.size / 1024).toFixed(1)} KB
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-foreground">Upload New Genome</h3>
              <p className="text-sm text-foreground/60">Analyze another DNA file</p>
            </div>
            <Link href="/">
              <Button variant="secondary" size="sm">
                Upload
              </Button>
            </Link>
          </Card>
          
          <Card className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-foreground">View All Reports</h3>
              <p className="text-sm text-foreground/60">Browse your analysis history</p>
            </div>
            <Link href="/reports">
              <Button variant="secondary" size="sm">
                Browse
              </Button>
            </Link>
          </Card>
        </div>
      </main>
    </div>
  )
}

function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Dna className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
        <p className="text-foreground/60">Loading dashboard...</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  )
}
