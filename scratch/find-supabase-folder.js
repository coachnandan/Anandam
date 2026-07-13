import fs from 'fs';
import path from 'path';

const projectRoot = 'c:\\Users\\swati\\Documents\\desh';

function searchDir(dir) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (file === '.supabase') {
          console.log("Found .supabase directory at:", fullPath);
          const subfiles = fs.readdirSync(fullPath);
          console.log("Files inside:", subfiles);
        }
        // Don't recurse into node_modules or .git
        if (file !== 'node_modules' && file !== '.git') {
          searchDir(fullPath);
        }
      }
    }
  } catch (err) {
    // ignore
  }
}

searchDir(projectRoot);
console.log("Search finished.");
