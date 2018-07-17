
const	Album = require("./libs/Album.js");

if (process.argv.length<4) {
	console.log("Call the application with source and destination directories as arguments");
	return;
}

var	src = process.argv[2],
	dst = process.argv[3];

var	album = new Album(null, "Album", src, dst);

!(async()=>{
	await album.build();
})();
