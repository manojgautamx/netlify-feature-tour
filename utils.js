const fs = require('fs');
const CONTENT_FILE = './content.json'; // Path to the content file
const LINKS_FILE = './links.json';     // Path to the links file

// Load the stored content from the content file (text)
function loadContent() {
    try {
        const data = fs.readFileSync(CONTENT_FILE, 'utf8');
        return JSON.parse(data); // Parse and return JSON content
    } catch (err) {
        console.error('Error loading content:', err);
        return {
            text: {
                ops: [
                    { insert: "\n" } // Default text structure
                ]
            }
        };
    }
}

// Save the updated content (text) back to the content file
function saveContent(content) {
    try {
        fs.writeFileSync(CONTENT_FILE, JSON.stringify(content, null, 2), 'utf8');
        console.log('Content saved successfully');
    } catch (err) {
        console.error('Error saving content:', err);
    }
}

// Load the stored links from the links file
function loadLinks() {
    try {
        const data = fs.readFileSync(LINKS_FILE, 'utf8');
        return JSON.parse(data); // Parse and return JSON content
    } catch (err) {
        console.error('Error loading links:', err);
        return [];
    }
}

// Save the updated links to the links file
function saveLinks(links) {
    try {
        fs.writeFileSync(LINKS_FILE, JSON.stringify(links, null, 2), 'utf8');
        console.log('Links saved successfully');
    } catch (err) {
        console.error('Error saving links:', err);
    }
}

module.exports = { loadContent, saveContent, loadLinks, saveLinks };
