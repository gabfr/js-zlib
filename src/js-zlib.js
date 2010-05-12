var zlib = {
	VERSION: "0.0.1",
	
	// ======================================================================
	// zlib constants
	// ======================================================================
	
	DEFLATED: 				8,
	
	LEVEL: {
		DEFAULT: 		   -1,
		NONE: 				0,
		BEST_SPEED: 		1,
		BEST_COMPRESSION: 	9
	},
	
	STRATEGY: {
		DEFAULT: 			0,
		FILTERED: 			1,
		HUFFMAN_ONLY: 		2,
		RLE: 				3,
		FIXED: 				4
	},
	
	FLUSH: {
		NONE: 				0,
		PARTIAL: 			1,
		SYNC: 				2,
		FULL: 				3,
		FINISH: 			4,
		BLOCK: 				5,
		TREES: 				6
	},
	
	STATUS: {
		OK: 				0,
		STREAM_END: 		1,
		NEED_DICT: 			2,
		ERRNO: 			   -1, // wtf is errno? "error number"? "no error"? :/
		STREAM_ERROR: 	   -2,
		DATA_ERROR: 	   -3,
		MEM_ERROR: 		   -4,
		BUF_ERROR: 		   -5,
		VERSION_ERROR: 	   -6
	},
	
	DATA_TYPE: {
		BINARY: 			0,
		TEXT: 				1,
		ASCII: 				1, // For compatibility with 1.2.2 and earlier
		UNKNOWN: 			2
	},
	
	// ======================================================================
	// zlib implementation
	// ======================================================================
	
	compress: function (input, level) {
		level = level | zlib.LEVEL.DEFAULT;
	}
};
