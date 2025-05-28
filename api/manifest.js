const { readFileSync } = require('fs');
const { join } = require('path');

module.exports = (req, res) => {
  try {
    const manifestPath = join(process.cwd(), 'public', 'manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    
    res.setHeader('Content-Type', 'application/manifest+json');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.status(200).json(manifest);
  } catch (error) {
    console.error('Error serving manifest.json:', error);
    res.status(500).json({ error: 'Failed to load manifest' });
  }
};
