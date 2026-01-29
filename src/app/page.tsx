'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Dna, Shield, Zap, FileText } from 'lucide-react'
import { FileUpload } from '@/components/upload/FileUpload'

export default function HomePage() {
  const router = useRouter()

  const handleUploadComplete = (analysisId: string) => {
    router.push(`/dashboard?id=${analysisId}`)
  }

  const features = [
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'Your genetic data never leaves your server. All analysis runs locally.',
    },
    {
      icon: Zap,
      title: 'Comprehensive Analysis',
      description: 'Cross-reference against ClinVar, PharmGKB, and curated SNP databases.',
    },
    {
      icon: FileText,
      title: 'Actionable Reports',
      description: 'Get detailed health protocols and lifestyle recommendations.',
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dna className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold gradient-text">GeneScope</span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="/dashboard" className="text-foreground/60 hover:text-foreground transition-colors">
              Dashboard
            </a>
            <a href="/reports" className="text-foreground/60 hover:text-foreground transition-colors">
              Reports
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
            <Dna className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary">Personal Genome Analysis</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
            Unlock Your{' '}
            <span className="gradient-text">Genetic Insights</span>
          </h1>
          
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
            Upload your DNA file from 23andMe, MyHeritage, or AncestryDNA and get 
            comprehensive health reports with actionable recommendations.
          </p>
        </motion.div>

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-2xl mb-16"
        >
          <FileUpload onUploadComplete={handleUploadComplete} />
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid md:grid-cols-3 gap-6 max-w-4xl w-full"
        >
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="bg-card/50 border border-border/50 rounded-xl p-6 hover:bg-card hover:border-primary/20 transition-all duration-300"
            >
              <feature.icon className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-foreground/60">{feature.description}</p>
            </div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6">
        <div className="container mx-auto px-4 text-center text-foreground/40 text-sm">
          <p>GeneScope — Personal genome analysis powered by open genetic databases.</p>
          <p className="mt-1">Your data stays private. All analysis runs locally.</p>
        </div>
      </footer>
    </div>
  )
}
