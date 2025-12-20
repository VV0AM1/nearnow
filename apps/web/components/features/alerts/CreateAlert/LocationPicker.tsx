import { MapPin } from "lucide-react";
import LocationSearch from "../../feed/LocationSearch";
import MapLoader from "../../map/MapLoader";

interface LocationPickerProps {
    isPicking: boolean;
    setIsPicking: (v: boolean) => void;
    selectedLocation: { lat: number; long: number };
    onLocationSelect: (lat: number, long: number, displayName?: string) => void;
    addressDisplay: string;
    biasLocation: { lat: number; long: number };
}

export function LocationPicker({
    isPicking,
    setIsPicking,
    selectedLocation,
    onLocationSelect,
    addressDisplay,
    biasLocation
}: LocationPickerProps) {
    return (
        <div className="pt-2">
            {isPicking ? (
                <div className="space-y-2">
                    <div className="h-[300px] w-full rounded-xl overflow-hidden border border-border relative">
                        <MapLoader
                            posts={[]}
                            center={selectedLocation}
                            onMapClick={(lat, long) => onLocationSelect(lat, long)}
                            interactiveOnly={true}
                        />
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1 rounded-full z-[1000] pointer-events-none">
                            Tap anywhere to pin
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setIsPicking(false)}
                            className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg font-bold hover:bg-primary/90 transition-all font-sm"
                        >
                            Confirm Location
                        </button>
                    </div>
                </div>
            ) : (
                <div>
                    <label className="block text-sm font-medium mb-1">Location</label>
                    <div className="flex gap-2 mb-2">
                        <div className="flex-1">
                            <LocationSearch
                                biasLocation={biasLocation}
                                onLocationSelect={onLocationSelect}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsPicking(true)}
                            className="h-10 px-3 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 transition-colors border border-input"
                            title="Pick on Map"
                        >
                            <MapPin className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/10 p-2 rounded mt-2">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="line-clamp-1">
                            {addressDisplay || `Current: ${selectedLocation.lat.toFixed(4)}, ${selectedLocation.long.toFixed(4)}`}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
