// Import the mailparser and imap packages
const mailparser = require("mailparser");
const imap = require("imap");
const fs = require("fs");
const path = require("path");
const { READ_MAIL_CONFIG } = require("./config");
const createFile = require("create-file");

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

      // Create a write stream to the attachments folder
      const writeStream = fs.createWriteStream(`${path}/${filename}`);

      // Write the content to the file
      writeStream.write(content);

      // Listen for the finish event
      writeStream.on("finish", () => {
        console.log(`Downloaded ${filename}.`);
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

// Define a function to get emails
const getEmails = () => {
  try {
    // Create a new imap connection
    const imapConnection = new imap(READ_MAIL_CONFIG);

    // Listen for the ready event
    imapConnection.once("ready", () => {
      // Open the inbox folder
      imapConnection.openBox("INBOX", false, () => {
        // Search for unread messages
        imapConnection.search(["UNSEEN"], (err, results) => {
          // Check for errors
          if (err) {
            throw err;
          }

          // Check if there are any results
          if (results.length === 0) {
            console.log("No unread messages found.");
            imapConnection.end();
            return;
          }

          // Fetch the messages as a stream
          const fetchStream = imapConnection.fetch(results, { bodies: "" });

          // Listen for the message event
          fetchStream.on("message", (msg) => {
            // Listen for the body event
            msg.on("body", (stream) => {
              // Parse the stream using mailparser
              mailparser.simpleParser(stream, async (err, parsed) => {
                // Check for errors
                if (err) {
                  throw err;
                }

                // Get the content, from, to, and subject of the message
                const { text, from, to, subject } = parsed;

                const timestamp = Date.now();

                // Create a folder name with the timestamp
                const folderName = `${timestamp}`;

                // Create a folder path with the system temp directory and the folder name
                const folderPath = `${__dirname}/MAIL/${folderName}`;
                downloadAttachments(folderPath, parsed);

                // Create the folder
                fs.mkdirSync(folderPath);

                createFile(
                  `${folderPath}/${folderName}.body`,
                  text,
                  function (err) {}
                );
                createFile(
                  `${folderPath}/${folderName}.from`,
                  from.text,
                  function (err) {}
                );
                createFile(
                  `${folderPath}/${folderName}.object`,
                  subject,
                  function (err) {}
                );
                createFile(
                  `${folderPath}/${folderName}.to`,
                  to.text,
                  function (err) {}
                );
                // await createFile(`${folderPath}/${folderName}.body`, text)
                // await createFile(`${folderPath}/${folderName}.from`,  from.text)
                // await createFile(`${folderPath}/${folderName}.object`,subject)
                // await createFile(`${folderPath}/${folderName}.to`, to.text)

                // Print the message details
                console.log("Content:", text);
                console.log("From:", from.text);
                console.log("To:", to.text);
                console.log("Subject:", subject);
                // console.log("CC:", cc.text);
                console.log("----------------------");
              });
            });

            // Listen for the attributes event
            msg.once("attributes", (attrs) => {
              // Get the uid of the message
              const { uid } = attrs;

              // Mark the message as seen
              imapConnection.addFlags(uid, ["\\Seen"], () => {
                console.log("Marked as seen.");
              });
            });
          });

          // Listen for the error event
          fetchStream.once("error", (err) => {
            throw err;
          });

          // Listen for the end event
          fetchStream.once("end", () => {
            console.log("Done fetching all messages.");
            imapConnection.end();
          });
        });
      });
    });

    // Listen for the error event
    imapConnection.once("error", (err) => {
      throw err;
    });

    // Listen for the end event
    imapConnection.once("end", () => {
      console.log("Connection ended.");
    });

    // Connect to the imap server
    imapConnection.connect();
  } catch (err) {
    console.error("An error occurred:", err);
  }
};

// Call the getEmails function
getEmails();
