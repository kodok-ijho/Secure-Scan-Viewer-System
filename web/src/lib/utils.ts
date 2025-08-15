import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

export function extractOwnerFromFilename(filename: string): string | null {
  const parts = filename.split('_')
  if (parts.length >= 2) {
    return parts[0]
  }
  return null
}

export function isImageFile(filename: string): boolean {
  const ext = getFileExtension(filename)
  return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(ext)
}

export function isPdfFile(filename: string): boolean {
  return getFileExtension(filename) === 'pdf'
}

export function isPreviewableFile(filename: string): boolean {
  const ext = getFileExtension(filename)
  return ['jpg', 'jpeg', 'png', 'svg', 'pdf', 'gif'].includes(ext)
}

export function getPreviewType(filename: string): 'image' | 'pdf' | 'unsupported' {
  const ext = getFileExtension(filename)

  if (['jpg', 'jpeg', 'png', 'svg', 'gif'].includes(ext)) {
    return 'image'
  }

  if (ext === 'pdf') {
    return 'pdf'
  }

  return 'unsupported'
}

export function isTextFile(filename: string): boolean {
  const ext = getFileExtension(filename)
  return ['txt', 'csv', 'log', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts'].includes(ext)
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
