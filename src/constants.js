// ----------------------------------------------------------------------------
// zlib constants
// ----------------------------------------------------------------------------

var ZLIB_VERSION      = "1.2.5";

var MAX_WINDOW_BITS   = 15;

var MIN_MATCH         = 3;

var DEFAULT_MEM_LEVEL = 8;

var MAX_MEM_LEVEL     = 9; // Or 8?

var DEFLATED          = 8;

var COMPRESSION_LEVEL = {
	DEFAULT:              6, // Don't know why 6, but that's how it is in zlib
	NONE:                 0,
	BEST_SPEED:           1,
	BEST_COMPRESSION:     9
};

var STRATEGY = {
	DEFAULT:              0,
	FILTERED:             1,
	HUFFMAN_ONLY:         2,
	RLE:                  3,
	FIXED:                4
};

var FLUSH = {
	NONE:                 0,
	PARTIAL:              1,
	SYNC:                 2,
	FULL:                 3,
	FINISH:               4,
	BLOCK:                5,
	TREES:                6
};

var STATUS = {
	OK:                   0,
	STREAM_END:           1,
	NEED_DICT:            2,
	ERRNO:               -1, // wtf is errno? "error number"? "no error"? :/
	STREAM_ERROR:        -2,
	DATA_ERROR:          -3,
	MEM_ERROR:           -4,
	BUF_ERROR:           -5,
	VERSION_ERROR:       -6
};

var DATA_TYPE = {
	BINARY:               0,
	TEXT:                 1,
	ASCII:                1, // For compatibility with 1.2.2 and earlier
	UNKNOWN:              2
};

var STREAM_STATUS = {
	INIT_STATE:           42,
	EXTRA_STATE:          69,
	NAME_STATE:           73,
	COMMENT_STATE:        91,
	HCRC_STATE:           103,
	BUSY_STATE:           113,
	FINISH_STATE:         666
};

var ERROR_MESSAGES = [
	"need dictionary",			// STATUS.NEED_DICT
	"stream end",				// STATUS.STREAM_END
	"",							// STATUS.OK
	"file error",				// STATUS.ERRNO
	"stream error",				// STATUS.STREAM_ERROR
	"data error",				// STATUS.DATA_ERROR
	"insufficient memory",		// STATUS.MEM_ERROR
	"buffer error",				// STATUS.BUF_ERROR
	"incompatible version"		// STATUS.VERSION_ERROR
];
