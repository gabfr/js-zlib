var sys = require("sys"),
	zlib = require("../build/zlib");

sys.puts(zlib.compress("hello"));
