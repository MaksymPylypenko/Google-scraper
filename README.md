## Google search scraping with Electron
(images & web)

### Issues
* Some links to original images are deleted. 
* Only the first 100 images have their original links stored in plain text. The rest can be uploaded on demand by clicking on individual images.
* In Google's source code the ratio of very large images is croped to 1x1. This causes an issue with the gallery. (e.g. it expects original width & height).
* The order of images is vertical (up-->down), this makes poor results appear in the first row (e.g. on the rigth side).

![Image](https://github.com/MaksymPylypenko/Google-scraper/blob/main/example.png)

### Setup
Install [NodeJS](https://nodejs.org/) then :

```bash
git clone git@github.com:MaksymPylypenko/Google-scraper.git
cd sample-web-scraping-with-electron
npm install
npm run start
```
