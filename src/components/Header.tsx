import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { LogOut, Settings } from 'lucide-react'

export default function Header({ onUserManagement }: { onUserManagement: () => void }) {
  const { profile, signOut } = useAuth()
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto flex items-center justify-between p-4">
        <h1 className="text-xl font-bold text-gray-800">💰 Payment Collector</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {profile?.full_name || profile?.id} ({profile?.role})
          </span>
          {profile?.role === 'admin' && (
            <Button variant="outline" size="sm" onClick={onUserManagement}>
              <Settings className="w-4 h-4 mr-1" /> Users
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-1" /> Logout
          </Button>
        </div>
      </div>
    </header>
  )
}