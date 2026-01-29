'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Dna, FileText, AlertTriangle, Shield, 
  ChevronRight, Search, Filter 
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

const reportColors: Record<string, string> = {
  genetic: 'bg-teal-500/10 text-teal-400',
  disease: 'bg-red-500/10 text-red-400',
  protocol: 'bg-green-500/10 text-green-400',
  other: 'bg-gray-500/10 text-gray-400',
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch('/api/reports')
        const data = await res.json()
        setReports(data.reports || [])
      } catch (error) {
        console.error('Failed to fetch reports:', error)
      }
      setLoading(false)
    }

    fetchReports()
  }, [])

  const filteredReports = reports.filter((report) => {
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.filename.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || report.type === filterType
    return matchesSearch && matchesType
  })

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
            <Link href="/dashboard" className="text-foreground/60 hover:text-foreground transition-colors">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Reports Library</h1>
          <p className="text-foreground/60">Browse all your genetic analysis reports</p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border rounded-lg py-3 pl-10 pr-4 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-foreground/40" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-card border border-border rounded-lg py-3 px-4 text-foreground focus:outline-none focus:border-primary"
            >
              <option value="all">All Types</option>
              <option value="genetic">Genetic Reports</option>
              <option value="disease">Disease Risk</option>
              <option value="protocol">Health Protocols</option>
            </select>
          </div>
        </div>

        {/* Reports Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
                <div className="w-12 h-12 bg-border rounded-lg mb-4" />
                <div className="h-6 bg-border rounded w-3/4 mb-2" />
                <div className="h-4 bg-border rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredReports.length === 0 ? (
          <Card className="text-center py-16">
            <FileText className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-foreground mb-2">
              {searchQuery || filterType !== 'all' ? 'No Reports Found' : 'No Reports Yet'}
            </h3>
            <p className="text-foreground/60 mb-6">
              {searchQuery || filterType !== 'all' 
                ? 'Try adjusting your search or filter'
                : 'Upload and analyze your genome file to generate reports'}
            </p>
            {!searchQuery && filterType === 'all' && (
              <Link href="/">
                <Button>Upload Genome File</Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map((report, index) => {
              const Icon = reportIcons[report.type] || FileText
              const colorClasses = reportColors[report.type] || reportColors.other
              
              return (
                <motion.div
                  key={report.filename}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/reports/${encodeURIComponent(report.filename)}`}>
                    <Card hover className="h-full group">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-lg ${colorClasses.split(' ')[0]} flex items-center justify-center`}>
                          <Icon className={`w-6 h-6 ${colorClasses.split(' ')[1]}`} />
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${colorClasses}`}>
                          {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                        </span>
                      </div>
                      
                      <CardHeader className="p-0 mb-3">
                        <CardTitle className="flex items-center justify-between group-hover:text-primary transition-colors">
                          <span className="truncate pr-2">{report.title}</span>
                          <ChevronRight className="w-5 h-5 text-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent className="p-0">
                        <p className="text-sm text-foreground/60 truncate mb-1">
                          {report.filename}
                        </p>
                        <div className="flex items-center justify-between text-xs text-foreground/40">
                          <span>
                            {new Date(report.modified).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span>{(report.size / 1024).toFixed(1)} KB</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
