// UI
var isImageSearch = true

const shell = require('electron').shell // to save images (e.g. using rightclick)
const image_btn = document.getElementById("image-option")
const web_btn = document.getElementById("web-option")
const img_grid = document.getElementById("img-grid")
const web_grid = document.getElementById("web-grid")
const input = document.getElementById("search_input")
const loader = document.getElementById("loader")
const page_set = document.getElementById("page-settings")
const page_num = document.getElementById("page-num")
const page_num_left = document.getElementById("page-num-left")
const page_num_right = document.getElementById("page-num-right")

page_num_left.addEventListener("click", function() {
  let val = parseInt(page_num.innerHTML);
  if (val > 1) {
    page_num.innerHTML = val - 1
    childLoadURL("https://www.google.com/search?" + getQuery())
  }
})

page_num_right.addEventListener("click", function() {
  let val = parseInt(page_num.innerHTML)
  if (val < 10) {
    page_num.innerHTML = 1 + val
    childLoadURL("https://www.google.com/search?" + getQuery())
  }
})


image_btn.addEventListener("click", function() {
  isImageSearch = true
  this.classList.add("on")
  web_btn.classList.remove("on")
  web_grid.classList.add("hide")
  img_grid.classList.remove("hide")
  page_set.className="hide"
});

web_btn.addEventListener("click", function() {
  isImageSearch = false
  this.classList.add("on")
  image_btn.classList.remove("on")
  img_grid.classList.add("hide")
  web_grid.classList.remove("hide")
  page_set.classList.remove("hide")
});

input.addEventListener("keyup", function(event) {
  if (event.key == "Enter") {
    console.log(input.value) // need to replace spaces with       
    page_num.innerHTML = 1
    childLoadURL("https://www.google.com/search?" + getQuery())
  }
});


let getQuery = function() {
  const count = 20
  let start = "&start=" + parseInt(page_num.innerHTML) * count
  let num = "&num=" + count
  let mod = isImageSearch ? "tbm=isch&" : ""
  let words = input.value.split(' ').join('+')
  return mod + "q=" + words + num + start
}

// Inter-process communication

const {
  ipcRenderer
} = require('electron')

// Asking hidden window to load URL 
let childLoadURL = function(url) {
  isImageSearch ? img_grid.innerHTML = "" : web_grid.innerHTML = "";
  loader.classList.remove("hide")
  ipcRenderer.send('scrapeurl', url)
}

// Receiving HTML from a hidden window
ipcRenderer.on('extracthtml', (event, html) => {
  console.log('Extracting HTML from a hidden window')
  extractLinks(html)
})


// Using regex to exctract data from HTML
let extractLinks = function(html) {
  loader.classList.add("hide")
  let t0 = performance.now()

  if (isImageSearch) {
    const regex = /\["https:\/\/(.*)",([1-9][0-9]*),([1-9][0-9]*)]\s,\["https:\/\/(.*)",([1-9][0-9]*),([1-9][0-9]*)]/gm
    let m
    while ((m = regex.exec(html)) !== null) {
      if (m.index === regex.lastIndex) {
        regex.lastIndex++
      }

      const img = document.createElement("FIGURE")
      img.setAttribute("itemprop", "associatedMedia")
      img.setAttribute("itemtype", "http://schema.org/ImageObject")
      img.setAttribute("itemscope", true)
      img.className = "grid-item"

      img.innerHTML = `          
                <a href="https://` + m[4] + `" itemprop="contentUrl" data-size="` + m[6] + `x` + m[5] + `">
                    <img src="https://` + unicodeToChar(m[1]) + `" itemprop="thumbnail"" />
                </a>`;

      //console.log("Image: "+m[4]);

      function addRightClickEvent(elem, source) {
        elem.addEventListener('contextmenu', function(ev) {
          ev.preventDefault()
          var link = document.createElement('a')
          link.href = source
          link.download = 'Download.jpg'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          return false
        })
      }
      addRightClickEvent(img, "https://" + m[4])
      img_grid.appendChild(img)

    }

    // gallery
    initPhotoSwipeFromDOM('.my-gallery');
  } else {
    const regex = /<div class="yuRUbf"><a href="(.*?)"|<h3 class="LC20lb DKV0Md"><span>(.*?)<\/span>|<span class="aCOpRe"><span>(.*?)<\/span>|<span class="aCOpRe"><span class="f">(.*?)<\/span><span>(.*?)<\/span>/gm;

    let m
    let num = 1
    let url
    let title
    let detail

    while ((m = regex.exec(html)) !== null) {
      if (m.index === regex.lastIndex) {
        regex.lastIndex++
      }
      if (m[1] != null) {
        url = m[1]
      } else if (m[2] != null) {
        title = num + ". " + m[2]
        num += 1
      } else {
        // some details have "date", so the order is mixed..
        detail = htmlToText((m[3] != null) ? m[3] : m[5])

        // console.log("Title: "+title);
        // console.log("Detail: "+detail);
        // console.log("url: "+url);    

        let div = document.createElement('div')
        div.classList.add('entry')

        let entry_title = document.createElement('div')
        entry_title.classList.add('entry-title')
        entry_title.innerText = title

        let entry_details = document.createElement('div')
        entry_details.classList.add('entry-details')
        entry_details.innerText = detail

        div.appendChild(entry_title)
        div.appendChild(entry_details)

        div.addEventListener('click', function() {
          shell.openExternal(url)
        }, false);

        web_grid.appendChild(div)
      }
    }
  }

  let t1 = performance.now()
  console.log("Pasring HTML took " + (t1 - t0) + " milliseconds.")
}


// Converters

// https://stackoverflow.com/questions/17267329/converting-unicode-character-to-string-format
function unicodeToChar(text) {
  return text.replace(/\\u[\dA-F]{4}/gi,
    function(match) {
      return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16))
    });
}

// https://stackoverflow.com/questions/8299742/is-there-a-way-to-convert-html-into-normal-text-without-actually-write-it-to-a-s
function htmlToText(html) {
  let temp = document.createElement('div')
  temp.innerHTML = html
  return temp.textContent // Or return temp.innerText if you need to return only visible text. It's slower.
}