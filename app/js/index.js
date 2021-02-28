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

var isImageSearch = false;

let extractLinks = function (html) {
    console.log("Start:\n");
    // console.log(html);

    var grid = document.getElementById("grid");
    grid.innerHTML = "";

    if(isImageSearch){
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
    else{
        // loading the HTML code
        const $ = cheerio.load(html)

        // for each link <a href=...></a>
        $('.tF2Cxc').each((i, element) => {
 
            const detail = $(element).find('.aCOpRe').text(); 
            const a = $(element).find('.yuRUbf').children().first();
            const url = a.attr("href"); 
            const title = a.children().eq(1).text(); // or $(element).find('.LC20lb').text(); 

            console.log("Title: "+title);
            console.log("Detail: "+detail);
            console.log("url: "+url);
            
        })
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
        var mod = isImageSearch? "+tbm=isch&" : "";

        //&start=20 
        //&num=10
        
        childLoadURL("https://www.google.com/search?"+mod+"q="+input.value);
    }   
    
  
});