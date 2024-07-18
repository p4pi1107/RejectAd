const fs = require('fs');
const path = require('path');

function parseUrls(url) {
 
    trimmedUrl = url.match(/(^https:\/\/|^http:\/\/)?(?:www.)?([^\/]+)/)
    // console.log(trimmedUrl)
    url = "*://*" + trimmedUrl[2] + "/*"
    return url
  }

// Function to read a text file and convert its contents to JSON format
async function convertTextFileToJson(inputFilePath, outputFilePath) {
  try {
    // Read the content of the text file
    const fileContent = await fs.promises.readFile(inputFilePath, 'utf8');
    
    // Split the file content into lines
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    
    // Convert lines into an array of objects (or simply an array of strings if no additional processing is needed)
    var jsonArray = lines.map(line => line.trim());
    jsonArray = jsonArray.slice(0, 25000);
    // Create a JSON object with a key "domains" to store the array
    const jsonObject = jsonArray.map(x => ({"id": jsonArray.indexOf(x) + 1, 
    "priority": 1, 
    "action": {"type": "block"}, 
    "condition": {"urlFilter": parseUrls(x), "resourceTypes": ["main_frame", "sub_frame", "script", "xmlhttprequest", "image", "stylesheet", "font", "object", "media", "websocket", "other"]}}));
    
    // Convert the JSON object to a JSON string
    const jsonString = JSON.stringify(jsonObject, null, 2);
    
    // Write the JSON string to the output file
    await fs.promises.writeFile(outputFilePath, jsonString, 'utf8');
    
    console.log(`Converted text file to JSON and saved as ${outputFilePath}`);
  } catch (error) {
    console.error('Error converting text file to JSON:', error);
  }
}


           



// Define the input and output file paths
const inputFilePath = path.join(__dirname, 'ads-and-tracking-extended.txt'); // Replace 'domains.txt' with your input text file
const outputFilePath = path.join(__dirname, 'rules.json'); // Replace 'domains.json' with your desired output JSON file

// Call the function to convert the text file to JSON
convertTextFileToJson(inputFilePath, outputFilePath);