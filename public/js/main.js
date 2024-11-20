// From index.html

const socket = io();
  
let quill = new Quill('#editor-container', {
    theme: 'snow'
});

let isReceiving = false; // Prevents feedback loop for text
let debounceTimeout;

async function fetchLinks() {
  try {
    const response = await fetch('/links.json'); // Fetch the links from the server
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const links = await response.json(); // Parse the JSON from links.json
    displayLinks(links); // Call the display function to render the links
  } catch (error) {
    console.error('Error fetching links:', error);
  }
}

function displayLinks(links) {
  const linkDisplay = document.getElementById("link-display");
  const linkList = document.getElementById("link-list");

  // Clear the current list of links
  linkList.innerHTML = "";

  if (links.length > 0) {
      linkDisplay.style.display = "block"; // Show the link display area

      links.forEach((link, index) => {
          const listItem = document.createElement("li");
          listItem.classList.add("link-container");

          const anchor = document.createElement("a");
          anchor.href = link;
          anchor.textContent = link;
          anchor.target = "_blank"; // Open link in new tab

          // Create a copy button
          const copyBtn = document.createElement("button");
          copyBtn.classList.add("copy-btn");
          copyBtn.innerHTML = '<ion-icon id="copy-icon" class="iconex" name="copy-outline"></ion-icon>';

          copyBtn.addEventListener("click", () => {
              copyToClipboard(link); // Copy link to clipboard
              copyBtn.innerHTML = '<ion-icon id="copy-icon" class="iconex copy-btn-success" name="checkmark-outline"></ion-icon>'; // Change to tick icon
              setTimeout(() => {
                  copyBtn.innerHTML = '<ion-icon id="copy-icon" class="iconex" name="copy-outline"></ion-icon>'; // Revert back after 2 seconds
              }, 3000); // Adjust time as needed
          });

          // Create a delete button
          const deleteBtn = document.createElement("button");
          deleteBtn.classList.add("delete-btn");
          deleteBtn.innerHTML = '<ion-icon name="trash-outline"></ion-icon>';

          // Attach click event to remove the link when delete button is clicked
          deleteBtn.addEventListener("click", () => {
              links.splice(index, 1); // Remove the link from the array
              socket.emit('remove-link', link); // Emit event to remove link from the server
              displayLinks(links); // Re-render the link list
          });

          listItem.appendChild(anchor);
          listItem.appendChild(copyBtn); // Add the copy button to the list item
          listItem.appendChild(deleteBtn);
          linkList.appendChild(listItem);
      });
  } else {
      linkDisplay.style.display = "block"; // Ensure the link display area is shown
      const noLinksMessage = document.createElement("li");
      noLinksMessage.textContent = "No clickable links in the server."; // Message for no links
      linkList.appendChild(noLinksMessage); // Show a message when there are no links
  }
}

// Call fetchLinks() to load and display the links on page load
fetchLinks();


  // Fetch the existing content (including links) when the page loads
  socket.on('content-update', (content) => {
      // Load the saved links immediately
      links = content.links || []; // Ensure links are updated separately
      displayLinks(links); // Display the links

      // Update the Quill editor with the saved text
      quill.setContents(content.text || []); // Set the Quill editor contents
  });

  // Listen for 'link-update' events from the server and update the UI
  socket.on('link-update', (updatedLinks) => {
      console.log('Updated links:', updatedLinks); // Log the updated links received from the server
      links = updatedLinks; // Update local links array
      displayLinks(links); // Update the UI with the new links
  });


  // Handle 'text-change' event with debounce for text changes
  quill.on('text-change', () => {
      if (!isReceiving) {
          clearTimeout(debounceTimeout);
          debounceTimeout = setTimeout(() => {
              const content = quill.getContents(); // Get content in Delta format
              socket.emit('text-update', content); // Send the text content to the server
          }, 300); // Send update after user stops typing for 300ms
      }
  });

  // Listen for 'text-update' events from the server
  socket.on('text-update', (content) => {
      isReceiving = true; // Prevent sending another update in response to this
      const currentSelection = quill.getSelection(); // Save cursor position
      quill.setContents(content); // Update the editor with the new content
      if (currentSelection) {
          quill.setSelection(currentSelection.index, currentSelection.length); // Restore cursor position
      }
      isReceiving = false; // Re-enable sending updates
  });


  // Function to add a new link
  function addNewLink(link) {
      if (link) { // Ensure the link is not empty
          socket.emit('add-link', link); // Emit add-link event with the new link
      }
  }

  // Function to remove a link
  function removeLink(index) {
    links.splice(index, 1); // Remove the link from the local array
    socket.emit('remove-link', links); // Send the updated links array to the server
    displayLinks(links); // Re-render the updated links
}

  function addLink(newLink) {
    if (newLink && !links.includes(newLink)) {
        links.push(newLink);  // Add to the local links array
        socket.emit('add-link', newLink);  // Emit the event to the server
        displayLinks(links);  // Update the UI immediately
    }
  }

  $(document).ready(function() {
    // Event listener for when the Files button is clicked
    $('a[href="#files"]').on('click', function() {
        // Fetch the list of uploaded files from the server
        fetch('/files')
            .then(response => response.json())
            .then(data => { 
                const fileList = $('#file-list');
                const noFilesMessage = $('#no-files-message');
                
                // Clear the current list
                fileList.empty();
  
                if (data.success && data.files.length > 0) {
                    // Hide the "No files uploaded" message
                    noFilesMessage.hide();
  
                    // Populate the list with the uploaded files
                    data.files.forEach(file => {
                        const listItem = $('<li class="file-list"></li>');
                        const link = $(`<a href="${file.path}" target="_blank">${file.name}</a>`);
                        listItem.append(link);
                        fileList.append(listItem);
                    });
                } else {
                    // Show the "No files uploaded" message
                    noFilesMessage.show();
                }
            })
            .catch(err => {
                console.error('Error fetching files:', err);
                alert('An error occurred while fetching the files.');
            });
    });
  });
  

document.addEventListener("DOMContentLoaded", function () {
  const dropArea = document.getElementById("drop-area");
  const fileInput = document.getElementById("file-input");
  const uploadButton = document.getElementById("upload-button");
  const progressBar = document.getElementById("progress-bar");
  const progressContainer = document.getElementById("progress-container");
  const fileList = document.getElementById("file-list");
  
  // Prevent default drag behaviors
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false)
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  // Highlight drop area when item is dragged over
  ['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => {
      dropArea.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => {
      dropArea.classList.remove('dragover');
    }, false);
  });

  // Handle dropped files
  dropArea.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    handleFiles(files);
  });

  // Handle file selection through the input
  uploadButton.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    const files = e.target.files;
    handleFiles(files);
  });

  function handleFiles(files) {
    [...files].forEach(uploadFile);
  }

  function uploadFile(file) {
    const url = '/upload';
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);

    xhr.upload.addEventListener('progress', (e) => {
      const percent = (e.loaded / e.total) * 100;
      progressBar.style.width = percent + '%';
    });

    xhr.onloadstart = () => {
      progressContainer.style.display = 'block';
      progressBar.style.width = '0%';
    };

    xhr.onloadend = () => {
      if (xhr.status === 200) {
        // Dynamically create the list item for the uploaded file
        const li = document.createElement('li');
        li.className = 'upload-item';
  
        const link = document.createElement('a');
        link.href = '/uploads/' + file.name; // Adjust this path according to your server
        link.download = file.name;
        link.textContent = file.name;
  
        const downloadButton = document.createElement('button');
            downloadButton.className = 'download-btn';

            // Create the Ion icon element for download
            const downloadIcon = document.createElement('ion-icon');
            downloadIcon.setAttribute('name', 'download-outline');

            // Append the icon to the download button
            downloadButton.appendChild(downloadIcon);

            downloadButton.addEventListener('click', () => {
                link.click();
            });

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-btn';

            // Create the Ion icon element for delete
            const deleteIcon = document.createElement('ion-icon');
            deleteIcon.setAttribute('name', 'trash-outline'); // Use trash icon

            // Append the icon to the delete button
            deleteButton.appendChild(deleteIcon);

            deleteButton.addEventListener('click', () => {
                li.remove(); // Remove from the UI (you can also handle file deletion from the server here)
            });

            li.appendChild(link);
            li.appendChild(downloadButton);
            li.appendChild(deleteButton);
            fileList.appendChild(li);
        }
        progressContainer.style.display = 'none';
    };

    xhr.send(formData);
  }
});
  
  

async function fetchFiles() {
  try {
      const response = await fetch('/files');
      const files = await response.json();
      const fileListElement = document.getElementById('file-list');
      const noFilesMessage = document.getElementById('no-files-message');

      // Clear the file list
      fileListElement.innerHTML = '';

      // Check if there are any files
      if (files.length === 0) {
          noFilesMessage.style.display = 'block'; // Show message if no files
      } else {
          noFilesMessage.style.display = 'none'; // Hide message if there are files

          // Add each file as a list item
          files.forEach(file => {
              const listItem = document.createElement('li');
              const link = document.createElement('a');
              link.href = file.url;
              link.textContent = file.name;
              link.download = file.name; // Allow file download

              const downloadButton = document.createElement('button');
              downloadButton.className = 'download-btn';
              
              // Create the Ion icon element for download
              const downloadIcon = document.createElement('ion-icon');
              downloadIcon.setAttribute('name', 'download-outline');
              downloadButton.appendChild(downloadIcon);
              downloadButton.addEventListener('click', () => {
                  link.click(); // Trigger download
              });

              const deleteButton = document.createElement('button');
              deleteButton.className = 'delete-btn';
              
              // Create the Ion icon element for delete
              const deleteIcon = document.createElement('ion-icon');
              deleteIcon.setAttribute('name', 'trash-outline');
              deleteButton.appendChild(deleteIcon);
              deleteButton.addEventListener('click', () => {
                  deleteFile(file.name, listItem); // Call a function to delete file
              });

              listItem.appendChild(link);
              listItem.appendChild(downloadButton);
              listItem.appendChild(deleteButton);
              fileListElement.appendChild(listItem);
          });
      }
  } catch (error) {
      console.error('Error fetching files:', error);
  }
}

// Fetch the files when the page loads
window.onload = () => { 
  fetchFiles();
};

function deleteFile(fileName, listItem) {
  fetch(`/delete-file?name=${fileName}`, { method: 'DELETE' })
      .then(response => {
          if (response.ok) {
              listItem.remove(); // Remove from UI if deletion succeeds
              checkNoFiles(); // Check if the file list is now empty
          }
      })
      .catch(err => console.error('Error deleting file:', err));
}

// Function to check if no files exist and display message
function checkNoFiles() {
  const fileListElement = document.getElementById('file-list');
  const noFilesMessage = document.getElementById('no-files-message');

  if (fileListElement.children.length === 0) {
      noFilesMessage.style.display = 'block'; // Show the "No files" message
  }
}


// Store the links in an array (in-memory for now)
let savedLinks = [];

// Function to debounce (delay) URL extraction until the user pauses typing
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// Function to extract and display links after validation
function extractLinks(content) {
  const links = content.match(/https?:\/\/[^\s]+\.[^\s]+/g); // Find all potential URLs that include a dot followed by valid characters

  if (links) {
      links.forEach(link => {
          if (!savedLinks.includes(link) && isValidURL(link)) {
              savedLinks.push(link); // Save new, valid link
              // Emit event to add link to the server
              socket.emit('add-link', link);
          }
      });
  }

  displayLinks(); // Call function to display the saved links
}



// Function to copy text to clipboard
function copyToClipboard(text) {
  const tempInput = document.createElement("textarea");
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand("copy");
  document.body.removeChild(tempInput);
}



// Function to validate if a URL is genuine using the URL constructor
function isValidURL(link) {
  try {
    new URL(link); // Will throw an error if invalid
    return true;  // URL is valid
  } catch (e) {
    return false; // Invalid URL
  }
}

// Listen for changes in Quill editor content with a debounce delay
quill.on('text-change', debounce(function() {
  const editorContent = quill.getText(); // Get the plain text content from Quill
  
  // Only extract and validate links when a space or enter key is typed
  if (editorContent.slice(-1) === ' ' || editorContent.slice(-1) === '\n') {
    extractLinks(editorContent); // Extract and validate links
  }
}, 500)); // Debounce with 500ms delay

// Copy content function (no changes needed)
function copyContent() {
  const editorContent = quill.getText(); // Get the plain text content from Quill
  
  const tempInput = document.createElement("textarea");
  tempInput.value = editorContent;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand("copy");
  document.body.removeChild(tempInput);

  document.getElementById("copy-icon").setAttribute("name", "checkmark-outline");
  document.getElementById("copy-text").textContent = "Copied";

  setTimeout(() => {
    document.getElementById("copy-icon").setAttribute("name", "copy-outline");
    document.getElementById("copy-text").textContent = "Copy";
  }, 3000);
}


document.getElementById('file-upload-btn').addEventListener('click', () => {
  document.getElementById('file-input').click();
});

document.getElementById('file-input').addEventListener('change', (event) => {
  const files = event.target.files;
  uploadFiles(files); // Call the function to upload files
});

function uploadFiles(files) {
  const formData = new FormData();
  for (const file of files) {
      formData.append('files', file);
  }

  const uploadProgress = document.getElementById('upload-progress');
  uploadProgress.style.display = 'block'; // Show progress overlay

  fetch('/upload', {
      method: 'POST',
      body: formData
  })
  .then(response => response.json())
  .then(result => {
      uploadProgress.style.display = 'none'; // Hide progress overlay
      if (result.success) {
          displayUploadedFiles(result.files); // Display uploaded files
          alert('Files uploaded successfully!'); // Notify user
      } else {
          alert('Failed to upload files: ' + result.message); // Show error message
      }
  })
  .catch(err => {
      uploadProgress.style.display = 'none'; // Hide progress overlay
      alert('An error occurred while uploading the files: ' + err); // Show error
      console.error(err);
  });
}

function displayUploadedFiles(files) {
  const uploadList = document.getElementById('upload-list');
  uploadList.innerHTML = ''; // Clear existing file list

  files.forEach(file => {
      const listItem = document.createElement('li');
      listItem.textContent = file.originalname; // Display the file name
      uploadList.appendChild(listItem);
  });
}

// Load existing links when the page loads
socket.on('load-links', (links) => {
  savedLinks = links; // Load the links into the savedLinks array
  displayLinks(); // Display the links on the page
});

// Listen for the initial link loading when the user connects
socket.on('connect', () => {
  // Request the existing links when connecting
  socket.emit('request-links');
});


// Handle file upload
document.getElementById('file-upload-btn').addEventListener('click', () => {
  document.getElementById('file-input').click();
});

document.getElementById('file-input').addEventListener('change', (event) => {
  const files = event.target.files; // Get the uploaded files
  const uploadProgress = document.getElementById('upload-progress');

  uploadProgress.style.display = 'flex'; // Show upload overlay

  // Simulate file upload delay (add your actual upload logic here)
  setTimeout(() => {
      uploadProgress.style.display = 'none'; // Hide upload overlay when done
      displayUploadedFiles(files); // Call the function to display files
      alert('Files uploaded successfully!');
  }, 3000); // Simulated upload time
});

$(document).ready(function() {
  // Show file input dialog when button is clicked
  $('#file-upload-btn').on('click', function() {
      $('#file-input').click();
  });

  // Handle file selection
  $('#file-input').on('change', function(event) {
      const files = event.target.files;
      if (files.length > 0) {
          uploadFiles(files);
      }
  });

  function uploadFiles(files) {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
          formData.append('file', files[i]); // Append each file
      }

      // Show uploading progress
      $('#upload-progress').show();

      $.ajax({
          url: '/upload',
          type: 'POST',
          data: formData,
          processData: false, // Important for file uploads
          contentType: false, // Important for file uploads
          success: function(response) {
              if (response.success) {
                  // Add the uploaded file to the list
                  $('#upload-list').append(`<li>${response.fileName}</li>`);
              } else {
                  alert('File upload failed: ' + response.message);
              }
          },
          error: function(err) {
              console.error('Upload error:', err);
              alert('An error occurred while uploading the file.');
          },
          complete: function() {
              $('#upload-progress').hide(); // Hide progress after upload
          }
      });
  }

  // Listen for socket events for file uploads
  socket.on('file-uploaded', function(fileName) {
      $('#upload-list').append(`<li>${fileName}</li>`);
  });
});


// Toggle display for sections
function toggleDisplay(section) {
  // const linkDisplay = document.getElementById('link-display');
  const uploadDisplay = document.getElementById('upload-display');
  const fileDisplay = document.getElementById('file-display');

  // Hide all sections first
  // linkDisplay.style.display = 'block';
  uploadDisplay.style.display = 'none';
  fileDisplay.style.display = 'none';

  // Show the selected section
  if (section === 'upload-display') {
    uploadDisplay.style.display = 'block';
  } else if (section === 'file-display') {
    fileDisplay.style.display = 'block';  // Show upload section
  }
}



