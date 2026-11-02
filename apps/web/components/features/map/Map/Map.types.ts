export interface MapProps {
    posts: any[];
    center?: [number, number];
    zoom?: number;
    /** Area radius in km, drawn as a circle. */
    radius?: number;
    onMapClick?: (lat: number, long: number) => void;
    /** Location picking: no markers or area circle. */
    interactiveOnly?: boolean;
    highlightedPostId?: string | null;
    /** When set, markers select a post instead of opening a popup. */
    onSelectPost?: (id: string) => void;
    showZoom?: boolean;
}
