export interface MapProps {
    posts: any[];
    center?: [number, number];
    zoom?: number;
    radius?: number;
    onMapClick?: (lat: number, long: number) => void;
    interactiveOnly?: boolean;
    highlightedPostId?: string | null;
}
