import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi, User } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Users,
  UserPlus,
  Trash2,
  Shield,
  User as UserIcon,
  AlertCircle,
  Upload,
  Download,
  X,
  Edit,
  Key
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

export function UsersPage() {
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [importResults, setImportResults] = useState<{
    successful: number
    failed: number
    errors: string[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'USER' as 'ADMIN' | 'USER'
  })

  // Edit user state
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    username: '',
    role: 'USER' as 'ADMIN' | 'USER'
  })

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    password: '',
    confirmPassword: ''
  })
  const [passwordUser, setPasswordUser] = useState<User | null>(null)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list().then(res => res.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: { username: string; password: string; role: 'ADMIN' | 'USER' }) =>
      usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User created successfully')
      setShowCreateForm(false)
      setNewUser({ username: '', password: '', role: 'USER' })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create user')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete user')
    },
  })

  const bulkCreateMutation = useMutation({
    mutationFn: async (users: Array<{ username: string; password: string; role: 'ADMIN' | 'USER' }>) => {
      const results = { successful: 0, failed: 0, errors: [] as string[] }

      for (const user of users) {
        try {
          await usersApi.create(user)
          results.successful++
        } catch (error: any) {
          results.failed++
          results.errors.push(`${user.username}: ${error.response?.data?.error || 'Failed to create user'}`)
        }
      }

      return results
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setImportResults(results)

      if (results.successful > 0) {
        toast.success(`Successfully created ${results.successful} user(s)`)
      }
      if (results.failed > 0) {
        toast.error(`Failed to create ${results.failed} user(s)`)
      }
    },
    onError: () => {
      toast.error('Failed to process bulk import')
    },
  })

  const editMutation = useMutation({
    mutationFn: (data: { id: string; username?: string; role?: 'ADMIN' | 'USER' }) =>
      usersApi.update(data.id, { username: data.username, role: data.role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User updated successfully')
      setShowEditModal(false)
      setEditingUser(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update user')
    },
  })

  const passwordMutation = useMutation({
    mutationFn: (data: { id: string; password: string }) =>
      usersApi.changePassword(data.id, { password: data.password }),
    onSuccess: () => {
      toast.success('Password changed successfully')
      setShowPasswordModal(false)
      setPasswordUser(null)
      setPasswordForm({ password: '', confirmPassword: '' })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to change password')
    },
  })

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newUser.username.trim() || !newUser.password.trim()) {
      toast.error('Username and password are required')
      return
    }

    if (newUser.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    createMutation.mutate(newUser)
  }

  const handleDeleteUser = (user: User) => {
    if (window.confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      deleteMutation.mutate(user.id)
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setEditForm({
      username: user.username,
      role: user.role
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingUser) return

    if (!editForm.username.trim() || editForm.username.trim().length < 3) {
      toast.error('Username must be at least 3 characters')
      return
    }

    editMutation.mutate({
      id: editingUser.id,
      username: editForm.username.trim(),
      role: editForm.role
    })
  }

  const handleChangePassword = (user: User) => {
    setPasswordUser(user)
    setPasswordForm({ password: '', confirmPassword: '' })
    setShowPasswordModal(true)
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!passwordUser) return

    if (!passwordForm.password || passwordForm.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (passwordForm.password !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    passwordMutation.mutate({
      id: passwordUser.id,
      password: passwordForm.password
    })
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

        if (jsonData.length < 2) {
          toast.error('Excel file must contain at least a header row and one data row')
          return
        }

        const headers = jsonData[0].map(h => h?.toString().toLowerCase().trim())
        const usernameIndex = headers.findIndex(h => h === 'username')
        const passwordIndex = headers.findIndex(h => h === 'password')
        const roleIndex = headers.findIndex(h => h === 'role')

        if (usernameIndex === -1 || passwordIndex === -1 || roleIndex === -1) {
          toast.error('Excel file must contain columns: username, password, role')
          return
        }

        const users = []
        const errors = []

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i]
          const username = row[usernameIndex]?.toString().trim()
          const password = row[passwordIndex]?.toString().trim()
          const role = row[roleIndex]?.toString().trim().toUpperCase()

          if (!username || !password || !role) {
            errors.push(`Row ${i + 1}: Missing required fields`)
            continue
          }

          if (!['ADMIN', 'USER'].includes(role)) {
            errors.push(`Row ${i + 1}: Role must be ADMIN or USER`)
            continue
          }

          if (password.length < 6) {
            errors.push(`Row ${i + 1}: Password must be at least 6 characters`)
            continue
          }

          users.push({ username, password, role: role as 'ADMIN' | 'USER' })
        }

        if (errors.length > 0) {
          toast.error(`Found ${errors.length} error(s) in Excel file. Please fix and try again.`)
          console.error('Excel validation errors:', errors)
          return
        }

        if (users.length === 0) {
          toast.error('No valid users found in Excel file')
          return
        }

        bulkCreateMutation.mutate(users)
      } catch (error) {
        toast.error('Failed to parse Excel file. Please check the format.')
        console.error('Excel parsing error:', error)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const downloadTemplate = () => {
    const templateData = [
      ['username', 'password', 'role'],
      ['john.doe', 'password123', 'USER'],
      ['jane.admin', 'admin123', 'ADMIN']
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users')
    XLSX.writeFile(workbook, 'user_import_template.xlsx')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Users
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Manage system users and their permissions
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New User</CardTitle>
            <CardDescription>
              Add a new user to the system with appropriate permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium">
                    Username
                  </label>
                  <Input
                    id="username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="Enter username"
                    required
                  />
                  <p className="text-xs text-zinc-500">
                    Must match the prefix in file names for ownership
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Enter password"
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-zinc-500">
                    Minimum 6 characters
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="USER"
                      checked={newUser.role === 'USER'}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'USER' })}
                    />
                    <span>User</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="ADMIN"
                      checked={newUser.role === 'ADMIN'}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'ADMIN' })}
                    />
                    <span>Admin</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Creating...
                    </>
                  ) : (
                    'Create User'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false)
                    setNewUser({ username: '', password: '', role: 'USER' })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            System Users ({users.length})
          </CardTitle>
          <CardDescription>
            All users registered in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-zinc-200 rounded-full"></div>
                    <div>
                      <div className="h-4 bg-zinc-200 rounded w-24 mb-1"></div>
                      <div className="h-3 bg-zinc-200 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="h-8 bg-zinc-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : users.length > 0 ? (
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                      {user.role === 'ADMIN' ? (
                        <Shield className="h-5 w-5 text-primary" />
                      ) : (
                        <UserIcon className="h-5 w-5 text-zinc-500" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{user.username}</h3>
                        <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-500">
                        Created {formatDate(user.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                      disabled={editMutation.isPending}
                      title="Edit user"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleChangePassword(user)}
                      disabled={passwordMutation.isPending}
                      title="Change password"
                    >
                      <Key className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(user)}
                      disabled={deleteMutation.isPending}
                      title="Delete user"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                No users found
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Create your first user to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Username Convention:</strong> The username should match the prefix used in file names
          (e.g., if files are named "john_document.pdf", the username should be "john") for proper file ownership.
        </AlertDescription>
      </Alert>

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Edit User</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <Input
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  placeholder="Enter username"
                  required
                />
                <p className="text-xs text-zinc-500 mt-1">Must be at least 3 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'ADMIN' | 'USER' })}
                  className="w-full p-2 border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-950"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editMutation.isPending}
                  className="flex-1"
                >
                  {editMutation.isPending ? 'Updating...' : 'Update User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && passwordUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Change Password</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPasswordModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  New Password for {passwordUser.username}
                </label>
                <Input
                  type="password"
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                  placeholder="Enter new password"
                  required
                />
                <p className="text-xs text-zinc-500 mt-1">Minimum 6 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Confirm Password</label>
                <Input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  required
                />
                {passwordForm.confirmPassword && passwordForm.password !== passwordForm.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={passwordMutation.isPending || passwordForm.password !== passwordForm.confirmPassword}
                  className="flex-1"
                >
                  {passwordMutation.isPending ? 'Changing...' : 'Change Password'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
