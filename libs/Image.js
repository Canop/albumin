const	fs = require("fs"),
	path = require("path"),
	convert = require("imagemagick-native").convert;

class Image {

	constructor(album, srcfilename){
		this.album = album;
		this.srcfilename = srcfilename;
		this.filename = null;
		this.description = null;
		this.dstpath = null;
		this._read();
	}

	_read(){
		var	conf = this.album.conf,
			srcdir = this.album.srcdir,
			dstdir = this.album.dstdir,
			nameParts = this.srcfilename.match(/^([^\/]+?)(\s-.*)?\.jpe?g$/i);
		this.filename = nameParts[0]+"-"+conf.dstwidth+"x"+conf.dstheight+".jpeg";
		this.description = nameParts[1];
		this.dstpath = path.join(dstdir, this.filename);
	}

	build(){
		var conf = this.album.conf;
		console.log("writing", this.dstpath);
		fs.writeFileSync(this.dstpath, convert({
			srcData: fs.readFileSync(path.join(this.album.srcdir, this.srcfilename)),
			width: conf.dstwidth,
			height: conf.dstheight,
			resizeStyle: "aspectfit"
		}));
	}

}

module.exports = Image;
