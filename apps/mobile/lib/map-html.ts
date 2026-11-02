import { LEAFLET_ASSETS } from './map-assets';

/**
 * Static Leaflet page. Built once per theme/mode; all data arrives later through
 * `window.__nn.receive` (see map-bridge.ts). Only numbers and fixed strings are
 * interpolated here.
 */
export function buildMapHtml(opts: { dark: boolean; lat: number; lng: number; zoom: number; pinMode: boolean }): string {
  const lat = Number(opts.lat).toFixed(6);
  const lng = Number(opts.lng).toFixed(6);
  const zoom = Math.round(opts.zoom);
  // Keyless OpenStreetMap raster tiles (CARTO basemaps now require an API key).
  // Only the Expo Go fallback uses this page; dark mode is a CSS filter on the tiles.
  const tiles = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const darkTiles = opts.dark ? '.leaflet-tile-pane{filter:invert(1) hue-rotate(180deg) brightness(.9) contrast(.9);}' : '';
  const bg = opts.dark ? '#0b1220' : '#f8fafc';

  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<style>
${LEAFLET_ASSETS.css}
${LEAFLET_ASSETS.clusterCss}
${LEAFLET_ASSETS.clusterDefaultCss}
html,body,#map{height:100%;width:100%;margin:0;padding:0;background:${bg};}
.leaflet-control-zoom{display:none;}
${darkTiles}
.nn-m{width:18px;height:18px;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);box-sizing:border-box;}
.nn-circle{border-radius:50%;}
.nn-square{border-radius:3px;}
.nn-diamond{transform:rotate(45deg);border-radius:2px;width:15px;height:15px;margin:1px;}
.nn-triangle{width:0;height:0;border:none;box-shadow:none;border-left:10px solid transparent;border-right:10px solid transparent;border-bottom-width:18px;border-bottom-style:solid;}
.nn-dim{opacity:.45;}
.nn-area{pointer-events:none;}
</style>
<script>${LEAFLET_ASSETS.js}</script>
<script>${LEAFLET_ASSETS.clusterJs}</script>
</head><body><div id="map"></div><script>
(function(){
  function post(m){ if(window.ReactNativeWebView){ window.ReactNativeWebView.postMessage(JSON.stringify(m)); } }
  var map = L.map('map',{zoomControl:false, attributionControl:true}).setView([${lat},${lng}],${zoom});
  map.attributionControl.setPrefix(false);
  var tiles = L.tileLayer('${tiles}',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
  var tileErrors = 0;
  tiles.on('tileerror', function(){ tileErrors++; if(tileErrors===3){ post({type:'TILE_ERROR'}); } });
  var cluster = L.markerClusterGroup({showCoverageOnHover:false, maxClusterRadius:50, spiderfyOnMaxZoom:true});
  map.addLayer(cluster);
  var areaCircle = null;
  var programmatic = false;
  var COLOR = /^#[0-9a-fA-F]{6}$/;
  var SHAPES = {circle:1,square:1,diamond:1,triangle:1};
  function icon(m){
    var shape = SHAPES[m.shape] ? m.shape : 'circle';
    var color = COLOR.test(m.color) ? m.color : '#2563eb';
    var style = shape==='triangle' ? 'border-bottom-color:'+color : 'background:'+color;
    return L.divIcon({className:'', html:'<div class="nn-m nn-'+shape+(m.dim?' nn-dim':'')+'" style="'+style+'"></div>', iconSize:[20,20], iconAnchor:[10,10]});
  }
  function radiusKm(){
    var b = map.getBounds(); var c = map.getCenter();
    return Math.max(c.distanceTo(b.getNorthEast()), 1)/1000;
  }
  map.on('moveend', function(){
    var c = map.getCenter();
    post({type:'MOVE_END', lat:c.lat, lng:c.lng, radiusKm:radiusKm(), byUser:!programmatic});
    programmatic = false;
  });
  window.__nn = { receive: function(msg){
    if(!msg || typeof msg.type!=='string') return;
    if(msg.type==='SET_MARKERS' && Array.isArray(msg.markers)){
      cluster.clearLayers();
      var layers = [];
      for(var i=0;i<msg.markers.length;i++){
        var m = msg.markers[i];
        if(typeof m.lat!=='number'||typeof m.lng!=='number'||typeof m.id!=='string') continue;
        var mk = L.marker([m.lat,m.lng],{icon:icon(m), keyboard:true});
        (function(id){ mk.on('click', function(){ post({type:'MARKER_PRESS', id:id}); }); })(m.id);
        layers.push(mk);
      }
      cluster.addLayers(layers);
    } else if(msg.type==='SET_VIEW' && typeof msg.lat==='number' && typeof msg.lng==='number'){
      programmatic = true;
      map.setView([msg.lat,msg.lng], typeof msg.zoom==='number'?msg.zoom:map.getZoom());
    } else if(msg.type==='SET_AREA' && typeof msg.lat==='number'){
      if(areaCircle){ map.removeLayer(areaCircle); }
      areaCircle = L.circle([msg.lat,msg.lng],{radius:msg.radiusKm*1000, color:'#2563eb', weight:1, fillOpacity:0.04, className:'nn-area', interactive:false}).addTo(map);
    }
  }};
  post({type:'READY'});
})();
</script></body></html>`;
}
