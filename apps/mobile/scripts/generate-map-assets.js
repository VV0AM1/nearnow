const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '../assets');
const OUTPUT_FILE = path.join(__dirname, '../app/(app)/map-assets.ts');

const files = {
    js: 'leaflet.js',
    css: 'leaflet.css',
    clusterJs: 'markercluster.js',
    clusterCss: 'markercluster.css',
    clusterDefaultCss: 'markercluster.default.css'
};

let output = 'export const LEAFLET_ASSETS = {\n';

for (const [key, filename] of Object.entries(files)) {
    const filePath = path.join(ASSETS_DIR, filename);
    if (fs.existsSync(filePath)) {
        console.log(`Reading ${filename}...`);
        let content = fs.readFileSync(filePath, 'utf8');
        // Escape backticks and backslashes for template literal safety
        content = content.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
        output += `  ${key}: \`${content}\`,\n`;
    } else {
        console.error(`Missing file: ${filename}`);
        process.exit(1);
    }
}

output += '};\n';

fs.writeFileSync(OUTPUT_FILE, output);
console.log(`Generated ${OUTPUT_FILE}`);
