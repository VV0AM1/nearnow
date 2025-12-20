import { motion } from "framer-motion";

export const SafetyLeaderboard = ({ data }: { data: any[] }) => {
    return (
        <div className="w-full bg-black/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-white/5 text-zinc-500 text-xs uppercase tracking-wider">
                        <th className="p-4 font-medium">Rank</th>
                        <th className="p-4 font-medium">Neighborhood</th>
                        <th className="p-4 font-medium text-right">Safety Score</th>
                        <th className="p-4 font-medium text-right">Alerts (7d)</th>
                        <th className="p-4 font-medium text-right">Trend</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {data.map((item, index) => (
                        <motion.tr
                            key={item.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="text-zinc-300 hover:bg-white/5 transition-colors group cursor-pointer"
                        >
                            <td className="p-4 font-mono text-zinc-500">#{index + 1}</td>
                            <td className="p-4 font-medium text-white group-hover:text-blue-400 transition-colors">{item.name}</td>
                            <td className="p-4 text-right font-bold text-emerald-400">{item.score}</td>
                            <td className="p-4 text-right">{item.alerts}</td>
                            <td className="p-4 text-right">
                                <span className={`text-xs px-2 py-1 rounded-full ${item.trend === 'up' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                    {item.trend === 'up' ? '▲ Rising' : '▼ Improving'}
                                </span>
                            </td>
                        </motion.tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
