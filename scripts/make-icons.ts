import fs from "fs";
import path from "path";

// Simple SVG icon → we'll render to PNG via a data approach
// For now, create an SVG and you convert it, OR use a placeholder service

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#080814"/>
  <circle cx="256" cy="256" r="180" fill="none" stroke="#22d3ee" stroke-width="20"/>
  <text x="256" y="310" font-size="200" font-family="sans-serif" font-weight="bold" fill="#22d3ee" text-anchor="middle">DS</text>
</svg>`;

fs.writeFileSync(path.join(process.cwd(), "public", "icon.svg"), svg);
console.log("✅ Created public/icon.svg — convert to PNG (see instructions)");
