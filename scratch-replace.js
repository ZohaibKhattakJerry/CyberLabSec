const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./app');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Replace CSS variables and classes
    content = content.replace(/var\(--red\)/g, 'var(--purple)');
    content = content.replace(/var\(--red-dark\)/g, 'var(--purple-dark)');
    content = content.replace(/var\(--red-light\)/g, 'var(--purple-light)');
    content = content.replace(/var\(--red-glow\)/g, 'var(--purple-glow)');
    content = content.replace(/var\(--red-glow-strong\)/g, 'var(--purple-glow-strong)');
    
    content = content.replace(/badge-red/g, 'badge-purple');
    content = content.replace(/dot-red/g, 'dot-purple');
    content = content.replace(/text-glow-red/g, 'text-glow-purple');
    content = content.replace(/shadow-red/g, 'shadow-purple');
    content = content.replace(/shadow-red-strong/g, 'shadow-purple-strong');

    // Replace rgb/rgba strings
    content = content.replace(/rgba?\(220,\s*38,\s*38/g, 'rgba(168,85,247');
    content = content.replace(/rgba?\(220,38,38/g, 'rgba(168,85,247');
    // Replace hex
    content = content.replace(/#dc2626/gi, '#A855F7');
    content = content.replace(/#b91c1c/gi, '#6D28D9');
    content = content.replace(/#ef4444/gi, '#C084FC');

    if (original !== content) {
        fs.writeFileSync(file, content);
        console.log('Updated', file);
    }
});
