const fs = require('fs');
const path = require('path');

// We will create the public/icons directory and generate SVG and minimal PNG icons
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icon
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="96" fill="#082f49"/>
  <circle cx="256" cy="256" r="180" fill="#0284c7" opacity="0.2"/>
  <path d="M256 90 C256 90 140 230 140 310 C140 376.27 191.73 430 256 430 C320.27 430 372 376.27 372 310 C372 230 256 90 256 90 Z" fill="#38bdf8"/>
  <path d="M256 140 C256 140 180 250 180 310 C180 351.97 214.03 386 256 386 C297.97 386 332 351.97 332 310 C332 250 256 140 256 140 Z" fill="#0284c7"/>
  <ellipse cx="225" cy="280" rx="25" ry="45" transform="rotate(-30 225 280)" fill="#ffffff" opacity="0.45"/>
  <text x="256" y="470" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="900" fill="#bae6fd" text-anchor="middle" letter-spacing="4">ÁGUA BELLE</text>
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgIcon);

// We create valid base64 PNG placeholders for 192x192 and 512x512
// Simple 1x1 png expanded or basic PNG buffer
const samplePngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAEeAFgYjQn3gAAAABJRU5ErkJggg==";
const samplePngBuffer = Buffer.from(samplePngBase64, 'base64');

fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), samplePngBuffer);
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), samplePngBuffer);

console.log('✅ PWA Icons generated successfully!');
