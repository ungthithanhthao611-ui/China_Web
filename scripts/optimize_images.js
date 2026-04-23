import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

const targetDir = 'd:/china/China_Web/src';

walk(targetDir, (filePath) => {
    if (filePath.endsWith('.vue') || filePath.endsWith('.js')) {
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('res.cloudinary.com')) {
            // Replace /upload/ with /upload/f_auto,q_auto/ if not already present
            let newContent = content.replace(/\/upload\/(?!(f_auto,q_auto\/))/g, '/upload/f_auto,q_auto/');
            if (newContent !== content) {
                fs.writeFileSync(filePath, newContent, 'utf8');
                console.log(`Updated: ${filePath}`);
            }
        }
    }
});
