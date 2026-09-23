import React, { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, Wifi, Shield } from 'lucide-react';

export const ActivityMonitorApp: React.FC = () => {
  const [cpuUsage, setCpuUsage] = useState(14);
  const [memoryUsage, setMemoryUsage] = useState(8.4);
  const [cpuHistory, setCpuHistory] = useState<number[]>([12, 18, 14, 22, 19, 15, 14]);

  useEffect(() => {
    const timer = setInterval(() => {
      const nextCpu = Math.floor(Math.random() * 20) + 10;
      setCpuUsage(nextCpu);
      setMemoryUsage(prev => Number((8.2 + Math.random() * 0.4).toFixed(1)));
      setCpuHistory(prev => [...prev.slice(1), nextCpu]);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const processes = [
    { name: 'WindowServer (Quartz Compositor)', pid: 182, cpu: '6.2%', mem: '420 MB', threads: 32 },
    { name: 'Abhishek OS Kernel', pid: 1, cpu: '2.4%', mem: '840 MB', threads: 64 },
    { name: 'SoundEngine (AudioContext)', pid: 219, cpu: '1.1%', mem: '140 MB', threads: 8 },
    { name: 'VirtualFileSystem (IndexedDB)', pid: 245, cpu: '0.8%', mem: '95 MB', threads: 12 },
    { name: 'Code Studio Daemon', pid: 480, cpu: '3.1%', mem: '580 MB', threads: 24 },
    { name: 'Terminal Shell (zsh)', pid: 312, cpu: '0.2%', mem: '45 MB', threads: 4 },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 select-none overflow-hidden text-white font-sans">
      {/* Top Metric Cards */}
      <div className="p-4 grid grid-cols-4 gap-3 border-b border-white/10 bg-slate-900/50">
        <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20">
          <div className="flex items-center gap-2 text-xs text-sky-400 font-bold mb-1">
            <Cpu className="w-4 h-4" />
            <span>CPU Usage</span>
          </div>
          <div className="text-2xl font-bold font-mono">{cpuUsage}%</div>
          <div className="text-[10px] text-slate-400">12-Core Neural Engine</div>
        </div>

        <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-bold mb-1">
            <Shield className="w-4 h-4" />
            <span>Memory</span>
          </div>
          <div className="text-2xl font-bold font-mono">{memoryUsage} GB</div>
          <div className="text-[10px] text-slate-400">of 32 GB Unified RAM</div>
        </div>

        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold mb-1">
            <HardDrive className="w-4 h-4" />
            <span>Disk I/O</span>
          </div>
          <div className="text-2xl font-bold font-mono">1.2 GB/s</div>
          <div className="text-[10px] text-slate-400">Read & Write Bandwidth</div>
        </div>

        <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
          <div className="flex items-center gap-2 text-xs text-purple-400 font-bold mb-1">
            <Wifi className="w-4 h-4" />
            <span>Network</span>
          </div>
          <div className="text-2xl font-bold font-mono">84 MB/s</div>
          <div className="text-[10px] text-slate-400">HyperFiber-5G Active</div>
        </div>
      </div>

      {/* Live Graph Bar */}
      <div className="px-4 py-3 bg-slate-900/30 border-b border-white/10 flex items-center gap-3">
        <span className="text-xs font-semibold text-slate-400">CPU History:</span>
        <div className="flex-1 flex items-end gap-2 h-10 bg-black/40 p-1.5 rounded-xl border border-white/10">
          {cpuHistory.map((val, i) => (
            <div
              key={i}
              className="flex-1 bg-sky-500 rounded-t transition-all duration-300"
              style={{ height: `${(val / 40) * 100}%` }}
            />
          ))}
        </div>
      </div>

      {/* Process Table */}
      <div className="flex-1 overflow-y-auto p-4 text-xs font-mono">
        <div className="grid grid-cols-12 pb-2 border-b border-white/10 text-slate-400 font-bold font-sans">
          <div className="col-span-5">Process Name</div>
          <div className="col-span-2">PID</div>
          <div className="col-span-2">% CPU</div>
          <div className="col-span-2">Memory</div>
          <div className="col-span-1 text-right">Threads</div>
        </div>
        <div className="divide-y divide-white/5">
          {processes.map(proc => (
            <div key={proc.pid} className="grid grid-cols-12 py-2 items-center text-slate-300">
              <div className="col-span-5 font-semibold text-white truncate">{proc.name}</div>
              <div className="col-span-2 text-slate-400">{proc.pid}</div>
              <div className="col-span-2 text-sky-400">{proc.cpu}</div>
              <div className="col-span-2">{proc.mem}</div>
              <div className="col-span-1 text-right text-slate-400">{proc.threads}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
