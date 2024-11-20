const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const os = require('os');

const socketHandler = require('./socketHandler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const CONTENT_FILE = './content.json'; // Path to the content file
const LINKS_FILE = './links.json'; // Path to the links file

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

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

// Save the updated content (text) back to the content file
function saveContent(content) {
    try {
        fs.writeFileSync(CONTENT_FILE, JSON.stringify(content, null, 2), 'utf8');
        console.log('Content saved successfully');
    } catch (err) {
        console.error('Error saving content:', err);
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

// Handle socket connections
io.on('connection', (socket) => {
    console.log('A user connected');

    // Load and send the existing content and links to the newly connected user
    const existingContent = loadContent();
    const existingLinks = loadLinks();
    socket.emit('content-update', existingContent); // Send the text content to the client
    socket.emit('link-update', existingLinks); // Send the existing links to the client

    // Listen for 'text-update' event from a client and update the text content
    socket.on('text-update', (newText) => {
        const currentContent = loadContent(); // Load current content from file
        currentContent.text = newText; // Update only the text part, keeping links intact
        saveContent(currentContent); // Save the updated content back to the file
        socket.broadcast.emit('text-update', newText); // Broadcast updated text content to all clients
    });

    socket.on('add-link', (newLink) => {
        const links = loadLinks();  // Load existing links from the file
        if (!links.includes(newLink)) {
            links.push(newLink);  // Add the new link to the array
            saveLinks(links);  // Save the updated list of links back to the file
            console.log('Updated links:', links);  // Check if links are updated
            io.emit('link-update', links);  // Broadcast the updated list to all clients
        }
    });
    
    // Listen for 'remove-link' event from a client to remove a link
    socket.on('remove-link', (link) => {
        let links = loadLinks(); // Load existing links
        links = links.filter(savedLink => savedLink !== link); // Remove the link
        saveLinks(links); // Save the updated links
        io.emit('link-update', links); // Broadcast the updated links to all clients
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

const UPLOAD_DIR = path.join(__dirname, 'shared-files');

// Ensure the 'shared-files' directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure storage to keep the file on the uploader's PC
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'shared-files/'); // Store files in the shared folder
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Save the file with its original name
  }
});

const upload = multer({ storage });

// Serve static files (HTML/CSS/JS)
app.use(express.static('public'));

// Endpoint for file upload
app.post('/upload', upload.single('file'), (req, res) => {
    const fileUrl = `http://${req.hostname}:${PORT}/shared-files/${req.file.filename}`;
    res.json({ message: 'File uploaded successfully', fileUrl });  // Return as JSON for easier handling
});
  

// Endpoint to get the list of uploaded files
app.get('/files', (req, res) => {
  fs.readdir(UPLOAD_DIR, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to read uploaded files' });
    }
    const fileUrls = files.map(file => ({
      name: file,
      url: `http://${req.hostname}:${PORT}/shared-files/${file}`
    }));
    res.json(fileUrls);
  });
});

// Serve uploaded files
app.use('/shared-files', express.static(UPLOAD_DIR));

app.delete('/delete-file', (req, res) => {
    const fileName = req.query.name;
    const filePath = path.join(UPLOAD_DIR, fileName);
  
    fs.unlink(filePath, (err) => {
      if (err) {
        return res.status(500).json({ error: 'File deletion failed' });
      }
      res.json({ message: 'File deleted successfully' });
    });
  });

  socketHandler(io);
  

  

// Get local IP address
function getLocalIPAddress() {
    const interfaces = os.networkInterfaces();
    for (const interfaceName in interfaces) {
        for (const iface of interfaces[interfaceName]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address; // Return the first non-internal IPv4 address
            }
        }
    }
    return 'localhost'; // Fallback if no external IP is found
}

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    const ipAddress = getLocalIPAddress();
    console.log(`Server is running on http://${ipAddress}:${PORT}`);
});