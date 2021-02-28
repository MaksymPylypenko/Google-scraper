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
        
            var img = document.createElement("FIGURE");
            img.setAttribute("itemprop","associatedMedia");
            img.setAttribute("itemtype","http://schema.org/ImageObject");
            img.setAttribute("itemscope",true);            
            
            img.innerHTML = `          
                <a href="https://`+m[4]+`" itemprop="contentUrl" data-size="`+m[6]+`x`+m[5]+`">
                    <img src="https://`+unicodeToChar(m[1])+`" itemprop="thumbnail"" />
                </a>`;

            // img.setAttribute("src", "https://"+unicodeToChar(m[1])); // error when using ""
            // img.setAttribute("width", m[3]);
            // img.setAttribute("height", m[2]);
            // img.setAttribute("alt", "n/a");

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
    
            img.onerror = function () {
                //this.src = 'https://www.minculture.gov.ma/fr/wp-content/themes/mculture/images/no-img.jpg'; // place your error.png image instead
                this.remove();
            };

        }

        // gallery
        initPhotoSwipeFromDOM('.my-gallery');
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



// Gallery
// https://photoswipe.com/documentation/getting-started.html

var initPhotoSwipeFromDOM = function(gallerySelector) {

    // parse slide data (url, title, size ...) from DOM elements 
    // (children of gallerySelector)
    var parseThumbnailElements = function(el) {
        var thumbElements = el.childNodes,
            numNodes = thumbElements.length,
            items = [],
            figureEl,
            linkEl,
            size,
            item;

        for(var i = 0; i < numNodes; i++) {

            figureEl = thumbElements[i]; // <figure> element

            // include only element nodes 
            if(figureEl.nodeType !== 1) {
                continue;
            }

            linkEl = figureEl.children[0]; // <a> element

            size = linkEl.getAttribute('data-size').split('x');

            // create slide object
            item = {
                src: linkEl.getAttribute('href'),
                w: parseInt(size[0], 10),
                h: parseInt(size[1], 10)
            };



            if(figureEl.children.length > 1) {
                // <figcaption> content
                item.title = figureEl.children[1].innerHTML; 
            }

            if(linkEl.children.length > 0) {
                // <img> thumbnail element, retrieving thumbnail url
                item.msrc = linkEl.children[0].getAttribute('src');
            } 

            item.el = figureEl; // save link to element for getThumbBoundsFn
            items.push(item);
        }

        return items;
    };

    // find nearest parent element
    var closest = function closest(el, fn) {
        return el && ( fn(el) ? el : closest(el.parentNode, fn) );
    };

    // triggers when user clicks on thumbnail
    var onThumbnailsClick = function(e) {
        e = e || window.event;
        e.preventDefault ? e.preventDefault() : e.returnValue = false;

        var eTarget = e.target || e.srcElement;

        // find root element of slide
        var clickedListItem = closest(eTarget, function(el) {
            return (el.tagName && el.tagName.toUpperCase() === 'FIGURE');
        });

        if(!clickedListItem) {
            return;
        }

        // find index of clicked item by looping through all child nodes
        // alternatively, you may define index via data- attribute
        var clickedGallery = clickedListItem.parentNode,
            childNodes = clickedListItem.parentNode.childNodes,
            numChildNodes = childNodes.length,
            nodeIndex = 0,
            index;

        for (var i = 0; i < numChildNodes; i++) {
            if(childNodes[i].nodeType !== 1) { 
                continue; 
            }

            if(childNodes[i] === clickedListItem) {
                index = nodeIndex;
                break;
            }
            nodeIndex++;
        }



        if(index >= 0) {
            // open PhotoSwipe if valid index found
            openPhotoSwipe( index, clickedGallery );
        }
        return false;
    };

    // parse picture index and gallery index from URL (#&pid=1&gid=2)
    var photoswipeParseHash = function() {
        var hash = window.location.hash.substring(1),
        params = {};

        if(hash.length < 5) {
            return params;
        }

        var vars = hash.split('&');
        for (var i = 0; i < vars.length; i++) {
            if(!vars[i]) {
                continue;
            }
            var pair = vars[i].split('=');  
            if(pair.length < 2) {
                continue;
            }           
            params[pair[0]] = pair[1];
        }

        if(params.gid) {
            params.gid = parseInt(params.gid, 10);
        }

        return params;
    };

    var openPhotoSwipe = function(index, galleryElement, disableAnimation, fromURL) {
        var pswpElement = document.querySelectorAll('.pswp')[0],
            gallery,
            options,
            items;

        items = parseThumbnailElements(galleryElement);

        // define options (if needed)
        options = {

            // define gallery index (for URL)
            galleryUID: galleryElement.getAttribute('data-pswp-uid'),

            getThumbBoundsFn: function(index) {
                // See Options -> getThumbBoundsFn section of documentation for more info
                var thumbnail = items[index].el.getElementsByTagName('img')[0], // find thumbnail
                    pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
                    rect = thumbnail.getBoundingClientRect(); 

                return {x:rect.left, y:rect.top + pageYScroll, w:rect.width};
            },

            shareButtons: [               
                {id:'download', label:'Download image', url:'{{raw_image_url}}', download:true}
            ],

        };

        // PhotoSwipe opened from URL
        if(fromURL) {
            if(options.galleryPIDs) {
                // parse real index when custom PIDs are used 
                // http://photoswipe.com/documentation/faq.html#custom-pid-in-url
                for(var j = 0; j < items.length; j++) {
                    if(items[j].pid == index) {
                        options.index = j;
                        break;
                    }
                }
            } else {
                // in URL indexes start from 1
                options.index = parseInt(index, 10) - 1;
            }
        } else {
            options.index = parseInt(index, 10);
        }

        // exit if index not found
        if( isNaN(options.index) ) {
            return;
        }

        if(disableAnimation) {
            options.showAnimationDuration = 0;
        }

        // Pass data to PhotoSwipe and initialize it
        gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, items, options);
        gallery.init();
    };

    // loop through all gallery elements and bind events
    var galleryElements = document.querySelectorAll( gallerySelector );

    for(var i = 0, l = galleryElements.length; i < l; i++) {
        galleryElements[i].setAttribute('data-pswp-uid', i+1);
        galleryElements[i].onclick = onThumbnailsClick;
    }

    // Parse URL and open gallery if it contains #&pid=3&gid=1
    var hashData = photoswipeParseHash();
    if(hashData.pid && hashData.gid) {
        openPhotoSwipe( hashData.pid ,  galleryElements[ hashData.gid - 1 ], true, true );
    }
};



