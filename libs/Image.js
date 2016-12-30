const	fs = require("fs"),
	path = require("path"),
	imagemagick= require("imagemagick-native");

class Image {

	constructor(album, srcfilename){
		this.album = album;
		this.srcfilename = srcfilename;
		this.filename = null;
		this.description = null;
		this.dstpath = null;
		this.borderColor = null;
		this.width = 0;
		this.height = 0;
		this._read();
	}

	_read(){
		var	conf = this.album.conf,
			srcdir = this.album.srcdir,
			dstdir = this.album.dstdir,
			nameParts = this.srcfilename.match(/^(.+?)((?:\s+-\s*)(.*))?\.jpe?g$/i);
		if (!nameParts) throw new Error("Internal Error: failed parsing " + this.srcfilename);
		this.filename = nameParts[1]+"-"+conf.dstwidth+"x"+conf.dstheight+".jpeg";
		this.description = nameParts[3];
		this.dstpath = path.join(dstdir, this.filename);
	}

	build(){
		var conf = this.album.conf;
		console.log("writing", this.dstpath);
		var	srcData = fs.readFileSync(path.join(this.album.srcdir, this.srcfilename)),
			srcDesc = imagemagick.identify({srcData}),
			dstData,
			dstDesc;
		if (srcDesc.width>conf.dstwidth || srcDesc.height>conf.dstheight) {
			dstData = imagemagick.convert({
				srcData,
				width: conf.dstwidth,
				height: conf.dstheight,
				resizeStyle: "aspectfit"
			});
			dstDesc = imagemagick.identify({srcData:dstData});
		} else {
			dstData = srcData;
			dstDesc = srcDesc;
		}

		this.width = dstDesc.width;
		this.height = dstDesc.height;
		var pixels = imagemagick.getConstPixels({
			srcData: dstData,
			x: 0,
			y: 0,
			columns: 1,
			rows: dstDesc.height
		}).concat(imagemagick.getConstPixels({
			srcData: dstData,
			x: dstDesc.width-1,
			y: 0,
			columns: 1,
			rows: dstDesc.height
		}));
		this.borderColor = 'rgb('+["red", "green", "blue"].map(function(key){
			return Math.ceil(
				pixels.reduce((s,p)=>s+p[key], 0) / (256* pixels.length)
			);
		}).join(',')+')';
		if (fs.existsSync(this.dstpath)) {
			return;
		}
		fs.writeFileSync(this.dstpath, dstData);
	}

}

module.exports = Image;
