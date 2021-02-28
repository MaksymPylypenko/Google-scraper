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

var isImageSearch = true;

var imgGridLoaded = false;
var webGridLoaded = false;
const image_btn = document.getElementById("image-option");
const web_btn = document.getElementById("web-option");
const img_grid = document.getElementById("img-grid");
const web_grid = document.getElementById("web-grid");
var input = document.getElementById("search_input");

image_btn.onclick = function() {
    isImageSearch = true;
    this.classList.add("on");    
    web_btn.classList.remove("on");
    web_grid.classList.add("hide");
    img_grid.classList.remove("hide");

    if(!(input.value==="") && !imgGridLoaded){
        childLoadURL("https://www.google.com/search?tbm=isch&q="+input.value);
        imgGridLoaded = true;
    }
};

web_btn.onclick = function() {
    isImageSearch = false;
    this.classList.add("on");
    image_btn.classList.remove("on");
    img_grid.classList.add("hide");
    web_grid.classList.remove("hide");   
    
    if(!(input.value==="") && !webGridLoaded){
        childLoadURL("https://www.google.com/search?q="+input.value);
        webGridLoaded = true;
    }
};


input.addEventListener("keyup", function(event) {
    if (event.key == "Enter") {
        console.log(input.value); // need to replace spaces with 

        //&start=20 
        //&num=10

        var mod = isImageSearch? "tbm=isch&" : "";           

        childLoadURL("https://www.google.com/search?"+mod+"q="+input.value);         
    }      
});


let extractLinks = function (html) {
    console.log("Start:\n");
    // console.log(html);

    if(isImageSearch){
        img_grid.innerHTML = "";
    }
    else{
        web_grid.innerHTML = ""; 
    }   
    

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

            function addRightClickEvent(elem, source){ 
                elem.addEventListener('contextmenu', function(ev) {
                    var link = document.createElement('a');
                    link.href = source;
                    link.download = 'Download.jpg';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);    
                });    
            }
            addRightClickEvent(img, "https://" + m[4]);           
            img_grid.appendChild(img);
    
            img.onerror = function () {
                //this.src = 'https://www.minculture.gov.ma/fr/wp-content/themes/mculture/images/no-img.jpg'; // place your error.png image instead
                this.remove();
            };

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

            let div = document.createElement('div');
            div.classList.add('entry');          
      
            let entry_title = document.createElement('div');
            entry_title.classList.add('entry-title');
            entry_title.innerText = title;

            let entry_details = document.createElement('div');
            entry_details.classList.add('entry-details');
            entry_details.innerText = detail;

            div.appendChild(entry_title);
            div.appendChild(entry_details);

            div.addEventListener('click', function() {
                const shell = require('electron').shell;
                shell.openExternal(url);
            }, false);

            web_grid.appendChild(div);            
        })
    }

    isImageSearch ? imgGridLoaded=true : webGridLoaded=true;  
}

let childLoadURL = function (url) {
  ipcRenderer.send('scrapeurl', url)
}

ipcRenderer.on('extracthtml', (event, html) => {
  console.log('extract html given by child window')
  extractLinks(html)
})