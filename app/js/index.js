// UI

const image_btn = document.getElementById("image-option");
const web_btn = document.getElementById("web-option");
const img_grid = document.getElementById("img-grid");
const web_grid = document.getElementById("web-grid");
var input = document.getElementById("search_input");
var isImageSearch = true;
const loader = document.getElementById("loader");

image_btn.addEventListener("click", function(){ 
    isImageSearch = true;
    this.classList.add("on");    
    web_btn.classList.remove("on");
    web_grid.classList.add("hide");
    img_grid.classList.remove("hide");
});

web_btn.addEventListener("click", function(){ 
    isImageSearch = false;
    this.classList.add("on");
    image_btn.classList.remove("on");
    img_grid.classList.add("hide");
    web_grid.classList.remove("hide");   
});

input.addEventListener("keyup", function(event) {
    if (event.key == "Enter") {
        console.log(input.value); // need to replace spaces with 
        //&start=20 
        var count = 20;
        var num = "&num="+count;
        var mod = isImageSearch? "tbm=isch&" : "";       
        var words = input.value.split(' ').join('+');
        
        childLoadURL("https://www.google.com/search?"+mod+"q="+words+num);         
    }      
});


// Extracting html in a child window

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

let childLoadURL = function (url) {
    if(isImageSearch){
        img_grid.innerHTML = "";
    }
    else{
        web_grid.innerHTML = ""; 
    }   
    loader.classList.remove("hide");
    ipcRenderer.send('scrapeurl', url)
}
  
ipcRenderer.on('extracthtml', (event, html) => {
    console.log('Extracting html from child window') // hidden
    extractLinks(html)
})


// Processing extracted html

// https://stackoverflow.com/questions/17267329/converting-unicode-character-to-string-format
function unicodeToChar(text) {
return text.replace(/\\u[\dA-F]{4}/gi, 
    function (match) {
        return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
    });
}

// https://stackoverflow.com/questions/8299742/is-there-a-way-to-convert-html-into-normal-text-without-actually-write-it-to-a-s
function htmlToText(html) {
    var temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent; // Or return temp.innerText if you need to return only visible text. It's slower.
}

let extractLinks = function (html) {
    loader.classList.add("hide");    

    var t0 = performance.now()

    if(isImageSearch){
        const regex = /\["https:\/\/(.*)",([1-9][0-9]*),([1-9][0-9]*)]\s,\["https:\/\/(.*)",([1-9][0-9]*),([1-9][0-9]*)]/gm;
        let m;
    
        while ((m = regex.exec(html)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
                         
            var img = document.createElement("FIGURE");
            img.setAttribute("itemprop","associatedMedia");
            img.setAttribute("itemtype","http://schema.org/ImageObject");
            img.setAttribute("itemscope",true);            
            
            img.innerHTML = `          
                <a href="https://`+m[4]+`" itemprop="contentUrl" data-size="`+m[6]+`x`+m[5]+`">
                    <img src="https://`+unicodeToChar(m[1])+`" itemprop="thumbnail"" />
                </a>`;

            //console.log("Image: "+m[4]);

            function addRightClickEvent(elem, source){ 
                elem.addEventListener('contextmenu', function(ev) {
                    ev.preventDefault();
                    var link = document.createElement('a');
                    link.href = source;
                    link.download = 'Download.jpg';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);    
                    return false;
                });    
            }
            addRightClickEvent(img, "https://" + m[4]);           
            img_grid.appendChild(img);    
        }

        // gallery
        initPhotoSwipeFromDOM('.my-gallery');
    }
    else{
        const regex = /<div class="yuRUbf"><a href="(.*?)"|<h3 class="LC20lb DKV0Md"><span>(.*?)<\/span>|<span class="aCOpRe"><span>(.*?)<\/span>|<span class="aCOpRe"><span class="f">(.*?)<\/span><span>(.*?)<\/span>/gm;

        let m;

        // the normal order of groups: 1,2,3
        // however, if group 3 is null, use group 5 instead

        var num = 1;
        var url;
        var title;
        var detail;
           
        while ((m = regex.exec(html)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            if(m[1]!=null){
                url = m[1];
            }
            else if(m[2]!=null){
                title = num+". "+m[2];
                num+=1;
            }
            else{
                detail = htmlToText((m[3]!=null) ? m[3]:m[5]);

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
            }        
        }
    }

    var t1 = performance.now()
    console.log("Processing HTML took " + (t1 - t0) + " milliseconds.")
}