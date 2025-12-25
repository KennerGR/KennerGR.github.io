import { useSystemStatus, useUsers } from "@/hooks/use-dashboard";
import { TerminalCard } from "@/components/TerminalCard";
import { StatusBadge } from "@/components/StatusBadge";
import { GlitchText } from "@/components/GlitchText";
import { formatDistanceToNow } from "date-fns";
import { Activity, Server, Users, Shield, Terminal, Clock, RefreshCw } from "lucide-react";

export default function Dashboard() {
  const { data: status, isLoading: isStatusLoading, refetch: refetchStatus } = useSystemStatus();
  const { data: users, isLoading: isUsersLoading } = useUsers();

  const activeUsersCount = users?.length || 0;
  const adminCount = users?.filter(u => u.role === 'admin' || u.role === 'operator').length || 0;
  const uptimeString = status ? `${Math.floor(status.uptime / 3600)}h ${Math.floor((status.uptime % 3600) / 60)}m` : "--";

  if (isStatusLoading || isUsersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-12 h-12 text-primary animate-spin" />
          <div className="font-mono text-primary animate-pulse">INITIALIZING SYSTEM...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 overflow-hidden relative">
      {/* Decorative scanline */}
      <div className="scanline" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border/50 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary/60 text-xs font-mono mb-1">
              <Terminal className="w-4 h-4" />
              <span>TERMINAL ACCESS // V.2.0.4</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter">
              <GlitchText text="NEXUS COMMAND" />
            </h1>
            <p className="text-muted-foreground font-mono max-w-lg">
              Authorized personnel only. Monitoring bot status and user activity.
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <StatusBadge 
              status={status?.status === 'online' ? 'online' : 'offline'} 
              label={status?.status === 'online' ? 'SYSTEM OPTIMAL' : 'SYSTEM CRITICAL'}
              className="text-sm px-4 py-2"
            />
            <div className="text-xs font-mono text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              LIVE CONNECTION ESTABLISHED
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <TerminalCard title="SYSTEM UPTIME" delay={0.1}>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-3xl font-bold text-primary text-glow">{uptimeString}</div>
                <div className="text-xs text-muted-foreground">SINCE LAST REBOOT</div>
              </div>
              <Clock className="w-8 h-8 text-primary/20" />
            </div>
          </TerminalCard>

          <TerminalCard title="ACTIVE USERS" delay={0.2}>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-3xl font-bold text-primary text-glow">{activeUsersCount}</div>
                <div className="text-xs text-muted-foreground">REGISTERED IDENTITIES</div>
              </div>
              <Users className="w-8 h-8 text-primary/20" />
            </div>
          </TerminalCard>

          <TerminalCard title="ADMINISTRATORS" delay={0.3}>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-3xl font-bold text-accent text-glow">{adminCount}</div>
                <div className="text-xs text-muted-foreground">ELEVATED PRIVILEGES</div>
              </div>
              <Shield className="w-8 h-8 text-accent/20" />
            </div>
          </TerminalCard>

          <TerminalCard title="SERVER LOAD" delay={0.4}>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-3xl font-bold text-green-400 text-glow">LOW</div>
                <div className="text-xs text-muted-foreground">CPU / MEMORY</div>
              </div>
              <Activity className="w-8 h-8 text-green-400/20" />
            </div>
          </TerminalCard>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* User List */}
          <div className="lg:col-span-2">
            <TerminalCard title="USER DIRECTORY" className="h-full min-h-[500px]" delay={0.5}>
              <div className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <input 
                    type="text" 
                    placeholder="SEARCH DATABASE..." 
                    className="w-full bg-background/50 border border-border px-4 py-2 text-primary placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-mono text-sm"
                  />
                  <button 
                    onClick={() => refetchStatus()}
                    className="bg-primary/10 border border-primary/50 text-primary px-4 hover:bg-primary/20 transition-colors uppercase text-xs font-bold"
                  >
                    Refresh
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/50 text-muted-foreground text-xs uppercase">
                        <th className="py-2 px-4 font-normal">ID</th>
                        <th className="py-2 px-4 font-normal">Username</th>
                        <th className="py-2 px-4 font-normal">Role</th>
                        <th className="py-2 px-4 font-normal">Registered</th>
                        <th className="py-2 px-4 font-normal text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {users?.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-muted-foreground italic">
                            No users found in database.
                          </td>
                        </tr>
                      )}
                      {users?.map((user) => (
                        <tr key={user.id} className="border-b border-border/20 hover:bg-primary/5 transition-colors group">
                          <td className="py-3 px-4 font-mono text-muted-foreground group-hover:text-primary/70 transition-colors">
                            #{user.id.toString().padStart(4, '0')}
                          </td>
                          <td className="py-3 px-4 font-bold">
                            {user.username ? `@${user.username}` : <span className="text-muted-foreground italic">Unknown</span>}
                          </td>
                          <td className="py-3 px-4">
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded border uppercase",
                              user.role === 'operator' ? "border-accent text-accent bg-accent/10" :
                              user.role === 'admin' ? "border-primary text-primary bg-primary/10" :
                              "border-muted text-muted-foreground"
                            )}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground text-xs">
                            {user.createdAt ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true }) : '-'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                              <span className="text-xs text-primary/70">ACTIVE</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TerminalCard>
          </div>

          {/* System Logs / Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <TerminalCard title="SYSTEM LOGS" delay={0.6}>
              <div className="font-mono text-xs space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex gap-2 text-muted-foreground hover:text-primary/80 transition-colors border-l border-border pl-2 py-1">
                    <span className="text-primary/40">[{new Date().toLocaleTimeString()}]</span>
                    <span>System heartbeat acknowledged.</span>
                  </div>
                ))}
                <div className="flex gap-2 text-accent border-l border-accent pl-2 py-1 bg-accent/5">
                  <span className="text-accent/60">[{new Date().toLocaleTimeString()}]</span>
                  <span>WARNING: Unverified connection attempt.</span>
                </div>
                <div className="flex gap-2 text-primary border-l border-primary pl-2 py-1">
                  <span className="text-primary/60">[{new Date().toLocaleTimeString()}]</span>
                  <span>System initialized successfully.</span>
                </div>
              </div>
            </TerminalCard>

            <TerminalCard title="CONFIGURATION" delay={0.7}>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-2 border border-border/50 bg-background/50">
                  <span className="text-xs text-muted-foreground uppercase">Bot Mode</span>
                  <span className="text-xs font-bold text-primary">AUTONOMOUS</span>
                </div>
                <div className="flex items-center justify-between p-2 border border-border/50 bg-background/50">
                  <span className="text-xs text-muted-foreground uppercase">Model</span>
                  <span className="text-xs font-bold text-primary">GPT-4o</span>
                </div>
                <div className="flex items-center justify-between p-2 border border-border/50 bg-background/50">
                  <span className="text-xs text-muted-foreground uppercase">Responses</span>
                  <span className="text-xs font-bold text-primary">ENABLED</span>
                </div>
                
                <div className="mt-4 pt-4 border-t border-border/30">
                  <button className="w-full py-2 bg-primary text-background font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                    <Server className="w-4 h-4" />
                    MANAGE CONFIG
                  </button>
                </div>
              </div>
            </TerminalCard>
          </div>
        </div>
        
        <footer className="pt-8 border-t border-border/30 text-center text-xs text-muted-foreground font-mono">
          <p>NEXUS DASHBOARD SYSTEM // SECURE CONNECTION</p>
          <div className="mt-2 flex justify-center gap-4 text-primary/40">
            <span>LATENCY: 24ms</span>
            <span>ENCRYPTION: AES-256</span>
            <span>NODE: US-EAST-1</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
