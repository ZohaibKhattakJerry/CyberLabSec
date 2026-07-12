import Link from "next/link";
import { Shield, Users, Briefcase, Lock } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-3xl w-full flex flex-col items-center text-center space-y-12">
        
        {/* Logo & Header */}
        <div className="space-y-4">
          <div className="w-24 h-24 bg-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_-12px_rgba(168,85,247,0.5)] border border-purple-500/30">
            <Shield className="w-12 h-12 text-purple-400" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-white">
            CyberLabSec <span className="text-purple-400">Platform</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-xl mx-auto">
            Centralized portal for careers, employee management, and company administration.
          </p>
        </div>

        {/* Portal Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-8">
          
          <Link href="/careers" className="group flex flex-col items-center p-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:bg-zinc-900 hover:border-purple-500/50 transition-all">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Briefcase className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Careers</h3>
            <p className="text-sm text-zinc-500 text-center">View job postings and apply for open positions.</p>
          </Link>

          <Link href="/portal/login" className="group flex flex-col items-center p-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:bg-zinc-900 hover:border-purple-500/50 transition-all">
            <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Employee Portal</h3>
            <p className="text-sm text-zinc-500 text-center">Access your tasks, announcements, and profile.</p>
          </Link>

          <Link href="/admin/login" className="group flex flex-col items-center p-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:bg-zinc-900 hover:border-purple-500/50 transition-all">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Lock className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Admin</h3>
            <p className="text-sm text-zinc-500 text-center">Manage postings, employees, and team tasks.</p>
          </Link>

        </div>

      </div>
    </div>
  );
}
