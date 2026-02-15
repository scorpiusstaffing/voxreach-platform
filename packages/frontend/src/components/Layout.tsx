import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { 
  Phone, Users, PhoneCall, BarChart3, LogOut, Settings, 
  PhoneOutgoing, Zap, Wrench 
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

function NavItem({ 
  icon, 
  label, 
  href, 
  active 
}: { 
  icon: React.ReactNode; 
  label: string; 
  href: string; 
  active?: boolean;
}) {
  return (
    <Link
      to={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-brand-50 text-brand-700'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

export default function Layout({ children }: LayoutProps) {
  const { user, organization, logout } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;

  if (!user || !organization) return null;

  const isOutbound = organization.intent === 'outbound';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 flex flex-col z-10">
        <div className="p-6 border-b border-gray-100">
          <div className="text-xl font-bold text-brand-700 tracking-tight">Voxreach</div>
          <div className="mt-1 text-xs text-gray-400">{organization.name}</div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavItem 
            icon={<BarChart3 className="w-5 h-5" />} 
            label="Dashboard" 
            href="/dashboard" 
            active={pathname === '/dashboard'} 
          />
          <NavItem 
            icon={<Users className="w-5 h-5" />} 
            label="Agents" 
            href="/dashboard/agents" 
            active={pathname === '/dashboard/agents'} 
          />
          <NavItem 
            icon={<Wrench className="w-5 h-5" />} 
            label="Tools" 
            href="/dashboard/tools" 
            active={pathname === '/dashboard/tools'} 
          />
          <NavItem 
            icon={<Phone className="w-5 h-5" />} 
            label="Phone Numbers" 
            href="/dashboard/numbers" 
            active={pathname === '/dashboard/numbers'} 
          />
          <NavItem 
            icon={<PhoneCall className="w-5 h-5" />} 
            label="Calls" 
            href="/dashboard/calls" 
            active={pathname === '/dashboard/calls'} 
          />
          {isOutbound && (
            <NavItem 
              icon={<PhoneOutgoing className="w-5 h-5" />} 
              label="Campaigns" 
              href="/dashboard/campaigns" 
              active={pathname === '/dashboard/campaigns'} 
            />
          )}
          <NavItem 
            icon={<Settings className="w-5 h-5" />} 
            label="Settings" 
            href="/dashboard/settings" 
            active={pathname === '/dashboard/settings'} 
          />
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-medium text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
              <div className="text-xs text-gray-400 truncate">{user.email}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64">
        {children}
      </main>
    </div>
  );
}
