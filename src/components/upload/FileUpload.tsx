'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, File, CheckCircle, AlertCircle, Dna, Loader2 } from 'lucide-react'
import { cn, formatBytes, detectGenomeFormat } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface FileUploadProps {
  onUploadComplete: (analysisId: string) => void
}

type UploadState = 'idle' | 'selected' | 'uploading' | 'analyzing' | 'complete' | 'error'

export function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState<string>('')
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setUploadState('selected')
    setError('')

    // Detect format
    const text = await selectedFile.text()
    const detectedFormat = detectGenomeFormat(text)
    setFormat(detectedFormat)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'text/tab-separated-values': ['.tsv'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  })

  const handleAnalyze = async () => {
    if (!file) return

    try {
      setUploadState('uploading')
      setProgress('Uploading genome file...')

      // Upload file
      const formData = new FormData()
      formData.append('file', file)
      formData.append('format', format)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) {
        throw new Error('Upload failed')
      }

      const { filename } = await uploadRes.json()

      setUploadState('analyzing')
      setProgress('Running genetic analysis... This may take a few minutes.')

      // Start analysis
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      })

      if (!analyzeRes.ok) {
        const errData = await analyzeRes.json()
        throw new Error(errData.error || 'Analysis failed')
      }

      const { analysisId } = await analyzeRes.json()
      
      setUploadState('complete')
      setProgress('Analysis complete!')
      
      setTimeout(() => {
        onUploadComplete(analysisId)
      }, 1500)

    } catch (err) {
      setUploadState('error')
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const formatLabels: Record<string, { label: string; color: string }> = {
    myheritage: { label: 'MyHeritage', color: 'text-purple-400' },
    '23andme': { label: '23andMe', color: 'text-green-400' },
    ancestry: { label: 'AncestryDNA', color: 'text-blue-400' },
    unknown: { label: 'Unknown Format', color: 'text-yellow-400' },
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {uploadState === 'idle' || uploadState === 'selected' ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div
              {...getRootProps()}
              className={cn(
                'relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 cursor-pointer',
                isDragActive
                  ? 'border-primary bg-primary/10 scale-[1.02]'
                  : 'border-border hover:border-primary/50 hover:bg-card/50',
                file && 'border-primary/50 bg-card/50'
              )}
            >
              <input {...getInputProps()} />
              
              <div className="flex flex-col items-center text-center">
                <motion.div
                  animate={isDragActive ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {file ? (
                    <File className="w-16 h-16 text-primary mb-4" />
                  ) : (
                    <Upload className="w-16 h-16 text-primary/60 mb-4" />
                  )}
                </motion.div>

                {file ? (
                  <>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{file.name}</h3>
                    <p className="text-foreground/60 mb-2">{formatBytes(file.size)}</p>
                    <p className={cn('font-medium', formatLabels[format]?.color || 'text-foreground')}>
                      Detected: {formatLabels[format]?.label || format}
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {isDragActive ? 'Drop your genome file here' : 'Upload your DNA file'}
                    </h3>
                    <p className="text-foreground/60 mb-4">
                      Drag and drop or click to select
                    </p>
                    <p className="text-sm text-foreground/40">
                      Supports 23andMe, MyHeritage, AncestryDNA (.txt, .csv)
                    </p>
                  </>
                )}
              </div>

              {/* Animated border gradient */}
              <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 via-transparent to-primary/20 blur-xl" />
              </div>
            </div>

            {file && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 flex justify-center"
              >
                <Button onClick={handleAnalyze} size="lg">
                  <Dna className="w-5 h-5 mr-2" />
                  Analyze My Genome
                </Button>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="progress"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card border border-border rounded-2xl p-12"
          >
            <div className="flex flex-col items-center text-center">
              {uploadState === 'uploading' || uploadState === 'analyzing' ? (
                <>
                  <div className="relative mb-6">
                    <Loader2 className="w-16 h-16 text-primary animate-spin" />
                    <Dna className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {uploadState === 'uploading' ? 'Uploading...' : 'Analyzing...'}
                  </h3>
                  <p className="text-foreground/60">{progress}</p>
                  
                  {uploadState === 'analyzing' && (
                    <div className="mt-6 w-full max-w-xs">
                      <div className="h-2 bg-border rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-primary to-primary-light"
                          initial={{ width: '0%' }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 60, ease: 'linear' }}
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : uploadState === 'complete' ? (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <CheckCircle className="w-16 h-16 text-success mb-4" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Analysis Complete!</h3>
                  <p className="text-foreground/60">Redirecting to your results...</p>
                </>
              ) : uploadState === 'error' ? (
                <>
                  <AlertCircle className="w-16 h-16 text-danger mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Analysis Failed</h3>
                  <p className="text-foreground/60 mb-6">{error}</p>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setUploadState('selected')
                      setError('')
                    }}
                  >
                    Try Again
                  </Button>
                </>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
