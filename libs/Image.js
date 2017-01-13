const	fs = require("fs"),
	path = require("path"),
	imagemagick= require("imagemagick-native"),
	ALWAYS_OVERWRITE = false;

// add to options the parameters needed to apply automatic orientation
//  according to Exif data
function autoOrient(exif, options){
	if (!exif) return;
	switch (exif.orientation) {
	case 2:
		options.rotate = 180;
		options.flip = true;
		break;
	case 3:
		options.rotate = 180;
		break;
	case 4:
		options.flip = true;
		break;
	case 5: // unverified, probably wrong
		options.rotate = 270;
		options.flip = true;
		break;
	case 6:
		options.rotate = 90;
		break;
	case 7: // unverified, probably wrong
		options.rotate = 90;
		options.flip = true;
		break;
	case 8:
		options.rotate = -90;
		break;
	}
}

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
		var conversion = {
			srcData,
			width: Math.min(conf.dstwidth, srcDesc.width),
			height: Math.min(conf.dstheight, srcDesc.height),
			resizeStyle: "aspectfit"
		};
		autoOrient(srcDesc.exif, conversion);
		dstData = imagemagick.convert(conversion);
		dstDesc = imagemagick.identify({srcData:dstData});

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
		if (ALWAYS_OVERWRITE || !fs.existsSync(this.dstpath)) {
			fs.writeFileSync(this.dstpath, dstData);
		}
	}

}

module.exports = Image;
