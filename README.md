## Google search scraping in Electron
Simple image & web scraper by using regex expressions 

![Image](https://github.com/MaksymPylypenko/Google-scraper/blob/main/example.png)
## Image scraper
Looking for low & original resolution of the image.
``` regex
/\["https:\/\/(.*)",([1-9][0-9]*),([1-9][0-9]*)]\s,\["https:\/\/(.*)",([1-9][0-9]*),([1-9][0-9]*)]/gm
```
e.g:
``` javascript
["https://encrypted-tbn0.gstatic.com/images?q\u003dtbn:ANd9GcQntO1ba63A1B1v0r6ilfBDcnfArFpIRcmyYg\u0026usqp\u003dCAU",183,275]
,["https://i.cbc.ca/1.5448015.1580501469!/fileImage/httpImage/cat-in-pain-facial-expression-scale.JPG",853,1280]
```
Scrolling down increases the number of images (in the DOM), however they are staying in low resolution. The original link is revealed (unencryped?) when the user clicks on the image. 

## Web scraper
Looking for URL, Title and Description. 
``` regex
/<div class="yuRUbf"><a href="(.*?)"|<h3 class="LC20lb DKV0Md"><span>(.*?)<\/span>|<span class="aCOpRe"><span>(.*?)<\/span>/gm
```
Note, that some descriptions have their date of publication included in another `<span>`. That is why I used 1 more group:
``` regex
<span class="aCOpRe"><span class="f">(.*?)<\/span><span>(.*?)<\/span>
```

### Setup
Install [NodeJS](https://nodejs.org/) then :

```bash
npm install
npm run start
```

### Issues
* Some links to original images are deleted. 
* Only the first 100 images have their original links stored in plain text. The rest can be uploaded on demand by clicking on individual images.
* In Google's source code the ratio of very large images is croped to 1x1. This causes an issue with the gallery. (e.g. it expects original width & height).
