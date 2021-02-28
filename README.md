### Google search (web & images) scraping with Electron

![Image](https://github.com/MaksymPylypenko/Google-scraper/blob/main/example.png)

#### Issues
* Only the first 100 images have their original links stored in plain text. The rest could be uploaded on demand by clicking on individual images.
* Some link to original images are deleted. 
* Ratio of very large images is croped to 1x1. This causes issues with the gallery, since it expects the original width & height.
* The order of images is vertical (up-->down), this makes poor results appear in the first row (e.g. on the rigth part).

#### Install

Install [NodeJS](https://nodejs.org/) then :

```bash
git clone git@github.com:MaksymPylypenko/Google-scraper.git
cd sample-web-scraping-with-electron
npm install
npm run start
```
