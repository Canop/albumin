const	fs = require("fs"),
	path = require("path"),
	imagemagick= require("imagemagick-native"),
	ALWAYS_OVERWRITE = false;

class Video {

	constructor(album, srcfilename){
		this.album = album;
		this.srcfilename = srcfilename;
		this.filename = null;
		this.description = null;
		this.dstpath = null;
		this.borderColor = "#000";
		this.width = album.conf.dstwidth;
		this._read();
	}

	_read(){
		var	conf = this.album.conf,
			srcdir = this.album.srcdir,
			dstdir = this.album.dstdir,
			nameParts = this.srcfilename.match(/^(.+?)((?:\s+-\s*)(.*))?\.mp4$/i);
		if (!nameParts) throw new Error("Internal Error: failed parsing " + this.srcfilename);
		this.filename = nameParts[1]+".mp4";
		this.description = nameParts[3];
		this.dstpath = path.join(dstdir, this.filename);
	}

	build(){
		if (ALWAYS_OVERWRITE || !fs.existsSync(this.dstpath)) {
			console.log("writing", this.dstpath);
			var srcData = fs.readFileSync(path.join(this.album.srcdir, this.srcfilename));
			fs.writeFileSync(this.dstpath, srcData);
		}
	}

	html(){
		return `<video width=${this.width} title="click to start video"><source src=${this.filename} type=video/mp4></video>`;
	}

}

module.exports = Video;
