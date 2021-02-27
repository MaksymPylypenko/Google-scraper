const cheerio = require('cheerio')
const { ipcRenderer } = require('electron')

var webview = document.createElement('webview');

webview.addEventListener('dom-ready', () => {
  let currentURL = webview.getURL()
  let titlePage = webview.getTitle()
  console.log('currentURL is : ' + currentURL)
  console.log('titlePage is : ' + titlePage)

  webview.executeJavaScript(`function gethtml () {
    return new Promise((resolve, reject) => { resolve(document.documentElement.innerHTML); });
    }
    gethtml();`).then((html) => {
    extractLinks(html)
  })  
})

let extractLinks = function (html) {
    console.log("Start:\n");
    // console.log(html);

    var grid = document.getElementById("grid");
    grid.innerHTML = "";

    const regex = /\["https:\/\/(.*)",([1-9][0-9]*),([1-9][0-9]*)]\s,\["https:\/\/(.*)",([1-9][0-9]*),([1-9][0-9]*)]/gm;
    let m;

    while ((m = regex.exec(html)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }
       
        // https://stackoverflow.com/questions/17267329/converting-unicode-character-to-string-format
        function unicodeToChar(text) {
            return text.replace(/\\u[\dA-F]{4}/gi, 
                   function (match) {
                        return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
                   });
        }
    
        var img = document.createElement("IMG");
        img.setAttribute("src", "https://"+unicodeToChar(m[1])); // error when using ""
        img.setAttribute("width", m[3]);
        img.setAttribute("height", m[2]);
        img.setAttribute("alt", "n/a");
        grid.appendChild(img);

        img.onerror = function () {
            //this.src = 'https://www.minculture.gov.ma/fr/wp-content/themes/mculture/images/no-img.jpg'; // place your error.png image instead
            this.remove();
        };
        
        // The result can be accessed through the `m`-variable.
        // m.forEach((match, groupIndex) => {
        //     console.log(`Found match, group ${groupIndex}: ${match}`);
        // });
    }
}

let childLoadURL = function (url) {
  ipcRenderer.send('scrapeurl', url)
}

ipcRenderer.on('extracthtml', (event, html) => {
  console.log('extract html given by child window')
  extractLinks(html)
})


// Get the input field
var input = document.getElementById("search_input");

// Execute a function when the user releases a key on the keyboard
input.addEventListener("keyup", function(event) {
  // Number 13 is the "Enter" key on the keyboard

    if (event.key == "Enter") {
        console.log(input.value); // need to replace spaces with 
        childLoadURL("https://www.google.com/search?tbm=isch&q="+input.value);
    }   
    
  
});