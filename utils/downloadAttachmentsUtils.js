const fs = require("fs");

const downloadAttachments = (path, parsed) => {
    try {
      // Get the attachments array from the parsed message
      const { attachments } = parsed;
      // Check if there are any attachments
      if (attachments.length === 0) {
        console.log("No attachments found.");
        return;
      }
  
      // Loop through the attachments
      for (let attachment of attachments) {
        // Get the filename and content of the attachment
        const { filename, content } = attachment;
        const folderNamePrefix = path.split('/').pop()
        // Create a write stream to the attachments folder
        const writeStream = fs.createWriteStream(`${path}/${folderNamePrefix}#${filename}`);
  
        // Write the content to the file
        writeStream.write(content);
  
        // Listen for the finish event
        writeStream.on("finish", () => {
          // console.log(`Downloaded ${filename}.`);
        });
  
        // Listen for the error event
        writeStream.on("error", (err) => {
          throw err;
        });
  
        // End the write stream
        writeStream.end();
      }
    } catch (err) {
      console.error("An error occurred:", err);
    }
  };

  module.exports  = downloadAttachments