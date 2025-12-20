declare module 'react-leaflet-cluster' {
    import { MapLayer, MapLayerProps } from 'react-leaflet';
    import { Layer, LayerOptions } from 'leaflet';
    import { FunctionComponent, ReactNode } from 'react';

    interface MarkerClusterGroupProps extends MapLayerProps {
        children?: ReactNode;
        chunkedLoading?: boolean;
        showCoverageOnHover?: boolean;
        spiderfyOnMaxZoom?: boolean;
        maxClusterRadius?: number | ((zoom: number) => number);
        iconCreateFunction?: (cluster: any) => any;
    }

    const MarkerClusterGroup: FunctionComponent<MarkerClusterGroupProps>;
    export default MarkerClusterGroup;
}
