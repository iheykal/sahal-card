const fs = require('fs');
const path = require('path');

// Function to copy directory recursively
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy frontend build to backend directory
const frontendBuildPath = path.join(__dirname, '../../frontend/build');
const backendFrontendPath = path.join(__dirname, '../frontend/build');

console.log('Copying frontend build...');
console.log('From:', frontendBuildPath);
console.log('To:', backendFrontendPath);

if (fs.existsSync(frontendBuildPath)) {
  copyDir(frontendBuildPath, backendFrontendPath);
  console.log('✅ Frontend build copied successfully!');
} else {
  console.log('❌ Frontend build not found at:', frontendBuildPath);
  process.exit(1);
}
