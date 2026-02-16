import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { 
  Phone, Users, PhoneCall, BarChart3, LogOut, Settings, 
  PhoneOutgoing, Wrench, CreditCard, Calendar, CalendarDays
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
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-amber-50 text-amber-700'
          : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
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
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-stone-200 flex flex-col z-10">
        <div className="p-6 border-b border-stone-100">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src="/assets/logo.svg" alt="Voxreach" className="h-8 w-auto" />
          </Link>
          <div className="mt-2 text-xs text-stone-400">{organization.name}</div>
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
            icon={<CreditCard className="w-5 h-5" />} 
            label="Billing" 
            href="/dashboard/billing" 
            active={pathname === '/dashboard/billing'} 
          />
          <NavItem 
            icon={<Calendar className="w-5 h-5" />} 
            label="Calendar" 
            href="/dashboard/calendar" 
            active={pathname === '/dashboard/calendar'} 
          />
          <NavItem 
            icon={<CalendarDays className="w-5 h-5" />} 
            label="Meetings" 
            href="/dashboard/meetings" 
            active={pathname === '/dashboard/meetings'} 
          />
          <NavItem 
            icon={<Settings className="w-5 h-5" />} 
            label="Settings" 
            href="/dashboard/settings" 
            active={pathname === '/dashboard/settings'} 
          />
        </nav>

        <div className="p-4 border-t border-stone-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-stone-600 font-medium text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-stone-900 truncate">{user.name}</div>
              <div className="text-xs text-stone-400 truncate">{user.email}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 relative">
        <div className="relative z-10 p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
