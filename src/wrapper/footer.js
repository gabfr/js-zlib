})();

// Set this library up to work with node.js
if (typeof(window) == "undefined" &&
	typeof(global) == "object" &&
	typeof(require) == "function" &&
	typeof(exports) == "object") {
	// FIXME: Find a better way to tell we're running in node.js
	for (var key in zlib) {
		if (zlib.hasOwnProperty(key)) {
			exports[key] = zlib[key];
		}
	}
	
	zlib.log = require("sys").puts;
}
