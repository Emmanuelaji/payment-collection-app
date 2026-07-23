import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { Profile } from '@/types/database'

export default function UserManagement({ onClose }: { onClose: () => void }) {
  const { toast } = useToast()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState<'admin'|'collector'>('collector')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    const { data } = await supabase.from('profiles').select('*').order('created_at')
    setUsers(data || [])
    setLoading(false)
  }

  async function createUser() {
    if (!newEmail || !newPassword) return
    setSubmitting(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          full_name: newName,
          role: newRole,
        }),
      })
      const result = await res.json()
      if (result.error) throw new Error(result.error)
      toast({ title: 'User created successfully' })
      setNewEmail(''); setNewPassword(''); setNewName(''); setNewRole('collector')
      fetchUsers()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
    setSubmitting(false)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>User Management</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="border rounded p-3 space-y-2">
            <h4 className="font-medium">Create New User</h4>
            <Input placeholder="Full Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Input placeholder="Email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            <Input placeholder="Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <Select value={newRole} onValueChange={(v: 'admin'|'collector') => setNewRole(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="collector">Collector</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={createUser} disabled={submitting} className="w-full">
              {submitting ? 'Creating...' : 'Create User'}
            </Button>
          </div>
          <div>
            <h4 className="font-medium mb-2">Existing Users</h4>
            {loading ? <p>Loading...</p> : (
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {users.map(u => (
                  <li key={u.id} className="flex justify-between items-center border-b pb-1">
                    <span>{u.full_name || 'N/A'} ({u.role})</span>
                    <span className="text-xs text-gray-500">{u.id.slice(0,8)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}