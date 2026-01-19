"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { userIcon } from "./MapConfig";
import { useMapFilters } from "./useMapFilters";
import { MapProps } from "./Map.types";
import { MapController, ChangeView, MapClickHandler } from "./components/MapControllers";
import MapMarkers from "./components/MapMarkers";
import MobileMapFilter from "../MobileMapFilter";
import MapControls from "../MapControls";
import MapFilterControl from "../MapFilterControl";

export default function Map({ posts, center = [37.7749, -122.4194], zoom = 16, radius, onMapClick, interactiveOnly = false, highlightedPostId }: MapProps) {
    const {
        selectedCategory,
        setSelectedCategory,
        timeRange,
        setTimeRange,
        filteredPosts
    } = useMapFilters(posts);

    return (
        <div className="h-full w-full rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative group bg-[#0a0a0a]">

            {!interactiveOnly && (
                <>
                    <MobileMapFilter
                        selectedCategory={selectedCategory}
                        timeRange={timeRange}
                        onTimeRangeChange={setTimeRange}
                        onSelect={(id) => {
                            const handleToggle = (id: string) => {
                                if (id === 'ALL') {
                                    setSelectedCategory(['ALL']);
                                    return;
                                }
                                let newSelected = selectedCategory.includes('ALL') ? [] : [...selectedCategory];
                                if (newSelected.includes(id)) {
                                    newSelected = newSelected.filter(c => c !== id);
                                } else {
                                    newSelected.push(id);
                                }
                                if (newSelected.length === 0) newSelected = ['ALL'];
                                setSelectedCategory(newSelected);
                            };
                            handleToggle(id);
                        }}
                    />

                    <div className="hidden xl:block">
                        <MapControls
                            selectedCategory={selectedCategory}
                            onSelectCategory={setSelectedCategory}
                        />
                    </div>

                    <div className="hidden xl:block">
                        <MapFilterControl
                            timeRange={timeRange}
                            onTimeRangeChange={setTimeRange}
                        />
                    </div>
                </>
            )}

            <MapContainer
                center={center}
                zoom={zoom}
                zoomControl={false}
                style={{ height: "100%", width: "100%" }}
                className="z-0 bg-[#0a0a0a]"
            >
                <ChangeView center={center} zoom={zoom} />
                <MapController onZoomChange={() => { }} />
                {onMapClick && <MapClickHandler onMapClick={onMapClick} />}

                <TileLayer
                    attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                <Marker position={center} icon={userIcon} zIndexOffset={1000}>
                    <Popup className="glass-popup">
                        <span className="text-xs font-bold text-blue-400">You are here</span>
                    </Popup>
                </Marker>

                <MapMarkers posts={filteredPosts} highlightedPostId={highlightedPostId} />

            </MapContainer>
            <div className="absolute inset-0 pointer-events-none rounded-3xl ring-1 ring-white/10 z-[500]"></div>
        </div>
    );
}


