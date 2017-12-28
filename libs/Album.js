const	fs = require("fs"),
	path = require("path"),
	pug = require("pug"),
	Image = require("./Image.js"),
	Video = require("./Video.js");

const	pagePug = pug.compileFile("views/page.pug"),
	summaryPug = pug.compileFile("views/summary.pug");

class Album {

	constructor(parentAlbum, title, srcdir, dstdir){
		this.parentAlbum = parentAlbum;
		this.srcdir = srcdir;
		this.dstdir = dstdir;
		this.pageName = path.basename(dstdir);
		this.elements = []; // images & videos
		this.albums = [];
		this.conf = {
			dstwidth: 1000,
			dstheight: 700,
		};
		this.title = title;
		this._read();
	}

	_read(){
		var	srcdir = this.srcdir,
			dstdir = this.dstdir,
			srcstats = fs.statSync(srcdir);
		if (!srcstats.isDirectory()) {
			throw new Error("not a directory:", srcdir);
		}
		console.log('title:', this.title);
		var children = fs.readdirSync(srcdir);
		children
		.filter(c => c[0]!=="." && c[0]!=="_") // exclude hidden files and work files
		.forEach(c=>{
			var	childsrcpath = path.join(srcdir, c),
				cstats = fs.statSync(childsrcpath);
			if (cstats.isDirectory()) {
				var	nameToken = path.basename(c).split(/\s+-\s*/g),
					childtitle = nameToken[nameToken.length-1],
					childdstpath = path.join(dstdir, nameToken[0]);
				this.albums.push(new Album(this, childtitle, childsrcpath, childdstpath));
			} else if (/[^\/]+\.jpe?g$/i.test(c)) {
				this.elements.push(new Image(this, c));
			} else if (/[^\/]+\.mp4$/i.test(c)) {
				this.elements.push(new Video(this, c));
			} else {
				console.log("ignored file:", c );
			}
		});
	}

	_writeIndex(){
		var titles = [];
		for (var a = this; a; a = a.parentAlbum) {
			titles.unshift({title:a.title});
		}
		for (var i=0; i<titles.length; i++) {
			titles[i].href="../".repeat(titles.length-1-i);
		}
		console.log(this.dstdir);
		var pug = this.albums.length ? summaryPug : pagePug;
		fs.writeFileSync(path.join(this.dstdir, "index.html"), pug({
			album: this,
			titles
		}));
	}


	build(){
		if (!fs.existsSync(this.dstdir)) {
			fs.mkdirSync(this.dstdir);
		}
		this.elements.forEach(a=>{
			a.build();
		});
		this.albums.forEach(a=>{
			a.build();
		});
		this._writeIndex();
	}
}

module.exports = Album;
