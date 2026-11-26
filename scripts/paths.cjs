// Where things live. REPO is the repository root (data/, scripts/, src/);
// SITE_DIR is the folder that gets published as www.loveandlayover.in.
const path = require('path');
const REPO = path.join(__dirname, '..');
const SITE_DIR = path.join(REPO, 'site');
module.exports = { REPO, SITE_DIR };
