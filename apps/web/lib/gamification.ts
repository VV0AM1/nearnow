export type Rank = 'Novice' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

interface GamificationStats {
    level: number;
    rank: Rank;
    points: number;
    nextLevelPoints: number;
    progress: number; // 0-100%
}

export function calculateGamification(points: number): GamificationStats {
    // Logic: Level up every 5 points
    // Level 1: 0-4 pts
    // Level 2: 5-9 pts
    // Level 3: 10-14 pts ...

    // Note: User can have 0 points, so level should handle that.
    // Ensure points is non-negative
    const safePoints = Math.max(0, points);

    const POINTS_PER_LEVEL = 5;

    // Calculate Level (Starts at 1)
    const level = Math.floor(safePoints / POINTS_PER_LEVEL) + 1;

    // Calculate Rank based on Level
    let rank: Rank = 'Novice';
    if (level >= 50) rank = 'Platinum';
    else if (level >= 30) rank = 'Gold';
    else if (level >= 15) rank = 'Silver';
    else if (level >= 5) rank = 'Bronze';

    // Calculate Progress to next level
    // Current level starts at: (level - 1) * 5
    // Next level starts at: level * 5
    const currentLevelStartPoints = (level - 1) * POINTS_PER_LEVEL;
    const nextLevelStartPoints = level * POINTS_PER_LEVEL;
    const pointsInCurrentLevel = safePoints - currentLevelStartPoints;

    const progress = (pointsInCurrentLevel / POINTS_PER_LEVEL) * 100;

    return {
        level,
        rank,
        points: safePoints,
        nextLevelPoints: nextLevelStartPoints,
        progress
    };
}

export interface Badge {
    id: string;
    label: string;
    description: string;
    icon: string; // Emoji for MVP
    color: string;
}

export const BADGES: Badge[] = [
    { id: 'guardian', label: 'Guardian', description: 'Posted 5+ alerts', icon: '🛡️', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' }, // Updated color to class
    { id: 'night_owl', label: 'Night Owl', description: 'Active at night', icon: '🦉', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
    { id: 'helper', label: 'Top Helper', description: 'Earned 50+ points', icon: '🤝', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
    { id: 'pioneer', label: 'Pioneer', description: 'Early adopter', icon: '🚀', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
];

export function calculateBadges(user: { reputation?: number, _count?: { posts: number, votes: number }, createdAt?: string }) {
    const earnedBadges: Badge[] = [];

    // Guardian: 5+ posts
    if ((user._count?.posts || 0) >= 5) {
        earnedBadges.push(BADGES.find(b => b.id === 'guardian')!);
    }

    // Helper: 50+ reputation
    if ((user.reputation || 0) >= 50) {
        earnedBadges.push(BADGES.find(b => b.id === 'helper')!);
    }

    // Pioneer: Created account in 2024 or earlier (Mock logic for now)
    // if (new Date(user.createdAt || '').getFullYear() <= 2024) earnedBadges.push(BADGES.find(b => b.id === 'pioneer')!);

    return earnedBadges;
}

export const RANK_COLORS: Record<Rank, string> = {
    Novice: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
    Bronze: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    Silver: 'text-slate-300 bg-slate-300/10 border-slate-300/20',
    Gold: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    Platinum: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
};

export const RANK_ICONS: Record<Rank, string> = {
    Novice: '🌱',
    Bronze: '🥉',
    Silver: '🥈',
    Gold: '🥇',
    Platinum: '💎',
};
