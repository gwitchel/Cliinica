const fs = require("fs");
const path = require("path");

const saveJSONFile = (filename, data) => {
  try {
    // Convert data to JSON string
    const jsonData = JSON.stringify(data, null, 2); // `null, 2` adds indentation for readability

    // Define the file path
    console.log("Filepath, ", filename)
    // Write the JSON string to a file
    console.log("Writing to filepath", filename)
    fs.writeFileSync(filename, jsonData, "utf-8");

    console.log(`JSON saved successfully to ${filename}`);
  } catch (error) {
    console.error("Error saving JSON:", error);
  }
};

module.exports = {saveJSONFile}