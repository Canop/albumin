const	fs = require("fs"),
	path = require("path"),
	util = require("util"),
	ALWAYS_OVERWRITE = false,
	jo = require('jpeg-autorotate'),
	Jimp = require("jimp");

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

		// we use jpeg-autorotate to fix the orientation because jimp is buggy on this
		let img = fs.readFileSync(srcpath)
		let rotated = await jo.rotate(img, {quality: 30})
			.catch(err => {
				// jo throws an error when the image is already right ^^
				//console.log(err);
			});
		if (rotated) {
			img = rotated;
		}

		await Jimp.read(img.buffer)
			.then(img => {
				let dst = img
					.scaleToFit(conf.dstwidth, conf.dstheight)
					.write(this.dstpath);
				let width = this.width = dst.bitmap.width;
				let height = this.height = dst.bitmap.height;
				let data = dst.bitmap.data;
				this.borderColor = 'rgb('+[0,0,0].map((v, c)=>{
					for (let y=0; y<height; y++) {
						v += data[width*y*4+c]+data[(width*y+width-1)*4+c];
					}
					return Math.ceil(v/(2*height));
				})+')';
				return dst;
			})
			.catch(err => {
				console.error(err);
			});
	}

	html(){
		return `<img src=${this.filename} width=${this.width} height=${this.height}>`;
	}
}

module.exports = Image;
