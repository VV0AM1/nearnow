import L from "leaflet";

export const createCustomIcon = (colorClass: string) => {
    let color = "#3b82f6";
    if (colorClass.includes("red")) color = "#ef4444";
    if (colorClass.includes("green")) color = "#22c55e";
    if (colorClass.includes("yellow")) color = "#eab308";
    if (colorClass.includes("purple")) color = "#a855f7";
    if (colorClass.includes("pink")) color = "#ec4899";

    return L.divIcon({
        className: "custom-marker",
        html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 0 3px rgba(0,0,0,0.3), 0 0 10px ${color};"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
        popupAnchor: [0, -10],
    });
};

export const userIcon = L.divIcon({
    className: "user-marker",
    html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 20px #3b82f6;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
});

export const createClusterIcon = (count: number) => {
    let colorClass = "bg-emerald-500";
    if (count > 5) colorClass = "bg-yellow-500";
    if (count > 20) colorClass = "bg-red-600";

    return L.divIcon({
        html: `<div class="flex items-center justify-center w-full h-full rounded-full ${colorClass}/20 backdrop-blur-md border border-${colorClass.replace("bg-", "")}/50 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
                 <span class="text-xs font-bold text-white">${count}</span>
               </div>`,
        className: "custom-cluster-icon",
        iconSize: L.point(40, 40, true),
    });
};
