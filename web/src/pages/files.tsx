import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth'
import { filesApi, FileInfo, usersApi, User } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  FileText,
  Download,
  Trash2,
  Search,
  Eye,
  X,
  AlertCircle,
  Image as ImageIcon,
  FileType,
  ZoomIn,
  ZoomOut,
  UserPlus,
  UserMinus
} from 'lucide-react'
import { formatFileSize, formatDate, extractOwnerFromFilename, isImageFile, isPdfFile, isTextFile, isPreviewableFile, getPreviewType } from '@/lib/utils'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

export function FilesPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [ownerFilter, setOwnerFilter] = useState('')
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null)
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [assignmentFile, setAssignmentFile] = useState<FileInfo | null>(null)
  const [selectedUserId, setSelectedUserId] = useState('')

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['files', ownerFilter],
    queryFn: () => filesApi.list(ownerFilter || undefined).then(res => res.data),
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list().then(res => res.data),
    enabled: user?.role === 'ADMIN', // Only load users for admins
  })

  const deleteMutation = useMutation({
    mutationFn: (filename: string) => filesApi.delete(filename),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
      toast.success('File deleted successfully')
      setSelectedFile(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete file')
    },
  })

  const deleteAllMutation = useMutation({
    mutationFn: () => filesApi.deleteAll(),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
      const { deletedCount, errors } = response.data
      if (errors.length > 0) {
        toast.warning(`Deleted ${deletedCount} files with ${errors.length} errors`)
      } else {
        toast.success(`Successfully deleted ${deletedCount} files`)
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete files')
    },
  })

  const assignMutation = useMutation({
    mutationFn: ({ filename, userId }: { filename: string; userId: string }) =>
      filesApi.assign(filename, userId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
      toast.success(`File assigned to ${response.data.assignedTo}`)
      setAssignmentFile(null)
      setSelectedUserId('')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to assign file')
    },
  })

  const unassignMutation = useMutation({
    mutationFn: (filename: string) => filesApi.unassign(filename),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
      toast.success('File unassigned successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to unassign file')
    },
  })

  const filteredFiles = files.filter(file => {
    const matchesSearch = !searchTerm || 
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (file.owner && file.owner.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesSearch
  })

  const handlePreview = async (file: FileInfo) => {
    setSelectedFile(file)
    setPreviewContent(null)
    setPreviewError(null)

    // For text files, fetch content
    if (isTextFile(file.name) && file.size <= 2 * 1024 * 1024) { // 2MB limit
      try {
        const response = await fetch(filesApi.stream(file.name))
        if (response.ok) {
          const text = await response.text()
          setPreviewContent(text)
        } else {
          setPreviewError('Failed to load file content')
        }
      } catch (error) {
        setPreviewError('Failed to load file content')
      }
    }
  }

  const handleDownload = (file: FileInfo) => {
    // Create a temporary anchor element for proper download behavior
    const link = document.createElement('a')
    link.href = filesApi.download(file.name)
    link.download = file.name
    link.style.display = 'none'

    // Add to DOM, click, and remove
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDelete = (file: FileInfo) => {
    if (window.confirm(`Are you sure you want to delete "${file.name}"?`)) {
      deleteMutation.mutate(file.name)
    }
  }

  const handleDeleteAll = () => {
    const fileCount = filteredFiles.length
    if (fileCount === 0) {
      toast.info('No files to delete')
      return
    }

    if (window.confirm(`Are you sure you want to delete ALL ${fileCount} files? This action cannot be undone.`)) {
      deleteAllMutation.mutate()
    }
  }

  const canDeleteFile = (file: FileInfo) => {
    if (user?.role === 'ADMIN') return true
    return file.owner === user?.username
  }

  const handleAssignFile = (file: FileInfo) => {
    setAssignmentFile(file)
    setSelectedUserId('')
  }

  const handleConfirmAssignment = () => {
    if (assignmentFile && selectedUserId) {
      assignMutation.mutate({ filename: assignmentFile.name, userId: selectedUserId })
    }
  }

  const handleUnassignFile = (file: FileInfo) => {
    if (window.confirm(`Are you sure you want to unassign "${file.name}"?`)) {
      unassignMutation.mutate(file.name)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Files
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          Browse and manage your documents
        </p>
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {user?.role === 'ADMIN' && (
              <div className="w-full sm:w-48">
                <Input
                  placeholder="Filter by owner..."
                  value={ownerFilter}
                  onChange={(e) => setOwnerFilter(e.target.value)}
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="text-sm text-zinc-500">
                {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}
              </div>
              {filteredFiles.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAll}
                  disabled={deleteAllMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleteAllMutation.isPending ? 'Deleting...' : 'Delete All'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Files Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-zinc-200 rounded mb-2"></div>
                <div className="h-3 bg-zinc-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))
        ) : filteredFiles.length > 0 ? (
          filteredFiles.map((file) => (
            <Card key={file.name} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {isImageFile(file.name) ? (
                      <ImageIcon className="h-5 w-5 text-blue-500" />
                    ) : isPdfFile(file.name) ? (
                      <FileType className="h-5 w-5 text-red-500" />
                    ) : (
                      <FileText className="h-5 w-5 text-zinc-500" />
                    )}
                    <Badge variant="outline" className="text-xs">
                      {file.ext.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex space-x-1">
                    {isPreviewableFile(file.name) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePreview(file)}
                        title="Preview file"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(file)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {user?.role === 'ADMIN' && (
                      <>
                        {file.owner ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUnassignFile(file)}
                            title="Unassign file"
                            disabled={unassignMutation.isPending}
                          >
                            <UserMinus className="h-4 w-4 text-orange-500" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAssignFile(file)}
                            title="Assign file to user"
                          >
                            <UserPlus className="h-4 w-4 text-blue-500" />
                          </Button>
                        )}
                      </>
                    )}
                    {canDeleteFile(file) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(file)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium text-sm truncate" title={file.name}>
                    {file.name}
                  </h3>
                  
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>{formatFileSize(file.size)}</span>
                    <span>{formatDate(file.modifiedAt)}</span>
                  </div>
                  
                  {file.owner ? (
                    <Badge variant="secondary" className="text-xs">
                      {file.owner}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Unassigned (Admin only)
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                  No files found
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  {searchTerm || ownerFilter
                    ? 'Try adjusting your search or filter criteria.'
                    : user?.role === 'USER'
                      ? `Upload files with your username prefix (${user.username}_filename.ext) to see them here.`
                      : 'Files will appear here once they are indexed.'
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h2 className="text-lg font-semibold">{selectedFile.name}</h2>
                <p className="text-sm text-zinc-500">
                  {formatFileSize(selectedFile.size)} • {formatDate(selectedFile.modifiedAt)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(selectedFile)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                {canDeleteFile(selectedFile) && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(selectedFile)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-4 overflow-auto max-h-[calc(90vh-120px)]">
              <FilePreview file={selectedFile} content={previewContent} error={previewError} />
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {assignmentFile && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold">Assign File</h2>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setAssignmentFile(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                  Assign "{assignmentFile.name}" to:
                </p>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full p-2 border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-950"
                >
                  <option value="">Select a user...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username} ({user.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setAssignmentFile(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmAssignment}
                  disabled={!selectedUserId || assignMutation.isPending}
                >
                  {assignMutation.isPending ? 'Assigning...' : 'Assign'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface FilePreviewProps {
  file: FileInfo
  content: string | null
  error: string | null
}

function FilePreview({ file, content, error }: FilePreviewProps) {
  const [imageError, setImageError] = React.useState(false)
  const [imageLoaded, setImageLoaded] = React.useState(false)

  React.useEffect(() => {
    // Reset states when file changes
    setImageError(false)
    setImageLoaded(false)
  }, [file.name])

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  const previewType = getPreviewType(file.name)

  if (previewType === 'image') {
    if (imageError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load image. The image file may be corrupted or in an unsupported format.
            <br />
            <small className="text-xs mt-2 block">
              URL: {filesApi.stream(file.name)}
            </small>
          </AlertDescription>
        </Alert>
      )
    }

    return (
      <div className="flex justify-center">
        {!imageLoaded && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        <img
          src={filesApi.stream(file.name)}
          alt={file.name}
          className={`max-w-full max-h-[60vh] object-contain rounded-xl border ${!imageLoaded ? 'hidden' : ''}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      </div>
    )
  }

  if (previewType === 'pdf') {
    return <PDFPreview file={file} />
  }

  if (isTextFile(file.name)) {
    if (file.size > 2 * 1024 * 1024) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            File is too large to preview (over 2MB). Please download to view.
          </AlertDescription>
        </Alert>
      )
    }

    if (content) {
      return (
        <pre className="text-sm overflow-auto bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl border">
          {content}
        </pre>
      )
    }

    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="text-center py-8">
      <FileText className="h-16 w-16 text-zinc-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
        Preview not available
      </h3>
      <p className="text-zinc-600 dark:text-zinc-400 mb-4">
        Preview is only supported for: JPG, JPEG, PNG, SVG, GIF, and PDF files.
      </p>
      <Button onClick={() => handleDownload(file)}>
        <Download className="h-4 w-4 mr-2" />
        Download File
      </Button>
    </div>
  )
}

interface PDFPreviewProps {
  file: FileInfo
}

function PDFPreview({ file }: PDFPreviewProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoading(false)
    setError(null)
  }

  const onDocumentLoadError = (error: Error) => {
    setLoading(false)
    setError('Failed to load PDF document')
    console.error('PDF load error:', error)
  }

  const goToPrevPage = () => {
    setPageNumber(page => Math.max(1, page - 1))
  }

  const goToNextPage = () => {
    setPageNumber(page => Math.min(numPages, page + 1))
  }

  const zoomIn = () => {
    setScale(scale => Math.min(2.0, scale + 0.2))
  }

  const zoomOut = () => {
    setScale(scale => Math.max(0.5, scale - 0.2))
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 border rounded-xl bg-zinc-50 dark:bg-zinc-900">
          <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
          <p className="text-lg font-medium mb-2">PDF Preview Error</p>
          <p className="text-zinc-500 mb-4">{error}</p>
          <Button onClick={() => handleDownload(file)}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* PDF Controls */}
      <div className="flex items-center justify-between mb-4 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border">
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
          >
            ←
          </Button>
          <span className="text-sm">
            Page {pageNumber} of {numPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
          >
            →
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={zoomOut}
            disabled={scale <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <Button
            size="sm"
            variant="outline"
            onClick={zoomIn}
            disabled={scale >= 2.0}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Document */}
      <div className="flex justify-center">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        <Document
          file={filesApi.stream(file.name)}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading=""
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            className="border rounded-xl shadow-sm"
          />
        </Document>
      </div>
    </div>
  )
}
