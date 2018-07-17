const	fs = require("fs"),
	path = require("path"),
	util = require("util"),
	ALWAYS_OVERWRITE = false,
	sharp = require("sharp");

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
		let	conf = this.album.conf,
			srcdir = this.album.srcdir,
			dstdir = this.album.dstdir,
			nameParts = this.srcfilename.match(/^(.+?)((?:\s+-\s*)(.*))?\.jpe?g$/i);
		if (!nameParts) throw new Error("Internal Error: failed parsing " + this.srcfilename);
		this.filename = nameParts[1]+"-"+conf.dstwidth+"x"+conf.dstheight+".jpeg";
		this.description = nameParts[3];
		this.dstpath = path.join(dstdir, this.filename);
	}

	async build(){
		let conf = this.album.conf;
		console.log("working on", this.dstpath);
		let srcpath = path.join(this.album.srcdir, this.srcfilename);

		let img = sharp(srcpath);
		let srcinfo = await img.metadata();

		if (ALWAYS_OVERWRITE || !(fs.existsSync(this.dstpath))) {
			await img
			.rotate()
			.resize(
				Math.min(conf.dstwidth, srcinfo.width),
				Math.min(conf.dstheight, srcinfo.height),
			)
			.max()
			.toFile(this.dstpath);
		}

		img = sharp(this.dstpath);
		let { data, info:{width, height, channels} } = await img.raw().toBuffer({resolveWithObject: true});
		this.width = width;
		this.height = height;
		this.borderColor = 'rgb('+[0,0,0].map((v, c)=>{
			for (let y=0; y<height; y++) {
				v += data[width*y*channels+c]+data[(width*y+width-1)*channels+c];
			}
			return Math.ceil(v/(2*height));
		})+')';
	}

	html(){
		return `<img src=${this.filename} width=${this.width} height=${this.height}>`;
	}
}

module.exports = Image;
