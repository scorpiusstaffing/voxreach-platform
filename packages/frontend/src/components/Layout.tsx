import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { 
  Phone, Users, PhoneCall, BarChart3, LogOut, Settings, 
  PhoneOutgoing, Zap, Wrench, CreditCard
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
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-500'
          : 'text-[#9CA3AF] hover:text-white hover:bg-[#161B22]'
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
    <div className="min-h-screen bg-[#0A0E17]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#0D1117] border-r border-[#21262D] flex flex-col z-10">
        <div className="p-6 border-b border-[#21262D]">
          <div className="flex items-center gap-2">
            <div className="text-xl font-bold text-white tracking-tight">Voxreach</div>
            <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(0,180,216,0.6)]"></div>
          </div>
          <div className="mt-1 text-xs text-[#6B7280]">{organization.name}</div>
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
            icon={<Settings className="w-5 h-5" />} 
            label="Settings" 
            href="/dashboard/settings" 
            active={pathname === '/dashboard/settings'} 
          />
        </nav>

        <div className="p-4 border-t border-[#21262D]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 rounded-full flex items-center justify-center text-cyan-400 font-medium text-sm border border-cyan-500/20">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user.name}</div>
              <div className="text-xs text-[#6B7280] truncate">{user.email}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen bg-[#0A0E17] relative">
        {/* Ambient Glow Background */}
        <div className="absolute inset-0 bg-glow-radial pointer-events-none" />
        <div className="relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
