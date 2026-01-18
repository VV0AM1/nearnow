"use client";

import { useEffect, useState, useRef } from "react";
import { Terminal, ShieldCheck, Wifi, Activity } from "lucide-react";

interface LogEntry {
    id: string;
    timestamp: string;
    message: string;
    type: "info" | "success" | "warning" | "system";
}

const MESSAGES = [
    "Scanning local sector for anomalies...",
    "Live data stream active. Connection stable.",
    "Analyzing neighborhood safety patterns...",
    "Updating crime index algorithms...",
    "Regional sensors calibrated.",
    "Verified user report in grid A-7.",
    "Police activity report synchronized.",
    "Safety score recalculated.",
    "Secure connection established.",
    "Background monitoring active."
];

export function SentinelLog() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial population
    useEffect(() => {
        const initialLogs: LogEntry[] = [
            { id: "init-1", timestamp: new Date().toLocaleTimeString(), message: "System initialized.", type: "system" },
            { id: "init-2", timestamp: new Date().toLocaleTimeString(), message: "Connecting to safety grid...", type: "info" },
            { id: "init-3", timestamp: new Date().toLocaleTimeString(), message: "Connection established.", type: "success" }
        ];
        setLogs(initialLogs);
    }, []);

    // Live log simulator
    useEffect(() => {
        const interval = setInterval(() => {
            const randomMsg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
            const type = randomMsg.includes("Verified") || randomMsg.includes("score") ? "success" : "info";

            const newLog: LogEntry = {
                id: Math.random().toString(36).substr(2, 9),
                timestamp: new Date().toLocaleTimeString(),
                message: randomMsg,
                type: type as any
            };

            setLogs(prev => {
                const newLogs = [...prev, newLog];
                if (newLogs.length > 20) newLogs.shift(); // Keep last 20
                return newLogs;
            });

        }, 3500); // Add log every 3.5s

        return () => clearInterval(interval);
    }, []);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-md overflow-hidden flex flex-col h-[280px]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-500">Sentinel Log</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">LIVE</span>
                    </div>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-2 custom-scrollbar"
            >
                {logs.map((log) => (
                    <div key={log.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300">
                        <span className="text-zinc-600 shrink-0 select-none">[{log.timestamp}]</span>
                        <span className={`
                            ${log.type === 'success' ? 'text-emerald-400' : ''}
                            ${log.type === 'warning' ? 'text-yellow-400' : ''}
                            ${log.type === 'system' ? 'text-blue-400' : ''}
                            ${log.type === 'info' ? 'text-zinc-300' : ''}
                        `}>
                            {log.type === 'system' && '> '}
                            {log.message}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
