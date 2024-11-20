const fs = require('fs');
const { loadContent, saveContent, loadLinks, saveLinks } = require('./utils');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected');

    const existingContent = loadContent();
    const existingLinks = loadLinks();
    socket.emit('content-update', existingContent);
    socket.emit('link-update', existingLinks);

    socket.on('text-update', (newText) => {
      const currentContent = loadContent();
      currentContent.text = newText;
      saveContent(currentContent);
      socket.broadcast.emit('text-update', newText);
    });

    socket.on('add-link', (newLink) => {
      const links = loadLinks();
      if (!links.includes(newLink)) {
        links.push(newLink);
        saveLinks(links);
        io.emit('link-update', links);
      }
    });

    socket.on('remove-link', (link) => {
      let links = loadLinks();
      links = links.filter(savedLink => savedLink !== link);
      saveLinks(links);
      io.emit('link-update', links);
    });

    socket.on('disconnect', () => {
      console.log('A user disconnected');
    });
  });
};
