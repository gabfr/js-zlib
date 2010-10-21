// ================================================================================
// js-zlib: A port of zlib to JavaScript.
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
// 
// Author: William Bowers <william.bowers@gmail.com>
// Credits: zlib (http://www.zlib.net/) was written by Jean-loup Gailly
//          (http://gailly.net/) and Mark Adler
//          (http://en.wikipedia.org/wiki/Mark_Adler).
// ================================================================================

var zlib = (function () {

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

function error (message) {
	var e = new zlib.Error(message);
	zlib.log(e.toString());
	throw e;
}

function getErrorMessage (status) {
	return ERROR_MESSAGES[STATUS.NEED_DICT - status];
}

var ADLER32_MOD = 65521; // Largest prime smaller than 65536
var ADLER_NMAX = 5552; // From zlib docs: the largest n such that 255n(n+1)/2 + (n+1)(BASE-1) <= 2^32-1

/**
 * From Wikipedia: Adler-32 is a checksum algorithm which
 * was invented by Mark Adler in 1995. Compared to a cyclic
 * redundancy check of the same length, it trades reliability
 * for speed. Adler-32 is more reliable than Fletcher-16,
 * and slightly less reliable than Fletcher-32.
 * 
 * @return number The checksum of the given string buffer
 * @throws Error when given anything but a string
 */
function adler32 (buffer, adler)
{
	if (typeof buffer != "string") {
		throw new Error("adler32 received a buffer that is not a string");
	}
	
	var s1 = adler === undefined ? 1 : (adler &  0xFFFF); // Sum of all bytes
	var s2 = adler === undefined ? 0 : (adler >> 16);     // Sum of all s1 values
	var length = buffer.length;
	var n, i = 0;
	
	while (length > 0) {
		n = Math.min(length, ADLER_NMAX);
		length -= n;
		for (; n >= 16; n -= 16) {
			// s2 += (s1 += buffer.charCodeAt(i++)); // Maybe this one is slightly better? Need to test.
			s1 += buffer.charCodeAt(i++); s2 += s1;
			s1 += buffer.charCodeAt(i++); s2 += s1;
			s1 += buffer.charCodeAt(i++); s2 += s1;
			s1 += buffer.charCodeAt(i++); s2 += s1;
			s1 += buffer.charCodeAt(i++); s2 += s1;
			s1 += buffer.charCodeAt(i++); s2 += s1;
			s1 += buffer.charCodeAt(i++); s2 += s1;
			s1 += buffer.charCodeAt(i++); s2 += s1;
			s1 += buffer.charCodeAt(i++); s2 += s1;
			s1 += buffer.charCodeAt(i++); s2 += s1;
			s1 += buffer.charCodeAt(i++); s2 += s1;
			s1 += buffer.charCodeAt(i++); s2 += s1;
			s1 += buffer.charCodeAt(i++); s2 += s1;
			s1 += buffer.charCodeAt(i++); s2 += s1;
			s1 += buffer.charCodeAt(i++); s2 += s1;
			s1 += buffer.charCodeAt(i++); s2 += s1;
		}
		while (n > 0) {
			s1 += buffer.charCodeAt(i++); s2 += s1;
			n--;
		}
		s1 %= ADLER32_MOD;
		s2 %= ADLER32_MOD;
	}
	
	return (s2 << 16) | s1; // or: (s2 * 65536) + s1
}

/**
 * This is a slower, but more straight-forward implementation.
 */
// function adler32 (buffer)
// {
// 	if (typeof buffer != "string") {
// 		throw new Error("adler32 received a buffer that is not a string");
// 	}
// 	
// 	var s1 = 1; // Sum of all bytes
// 	var s2 = 0; // Sum of all s1 values
// 	var b; // The current byte
// 	var i;
// 	
// 	for (i = 0; i < buffer.length; i++) {
// 		b = buffer.charCodeAt(i);
// 		s1 = (s1 + b)  % ADLER32_MOD;
// 		s2 = (s2 + s1) % ADLER32_MOD;
// 	}
// 	
// 	return (s2 << 16) | s1; // or: (s2 * 65536) + s1
// }

// ----------------------------------------------------------------------------
// zlib implementation
// ----------------------------------------------------------------------------

var Stream = function (input) {
	this.output = null;
	this.errorMessage = null;
	this.state = new DeflateState(this);
	
	// typedef struct z_stream_s {
	//     Bytef    *next_in;  /* next input byte */
	//     uInt     avail_in;  /* number of bytes available at next_in */
	//     uLong    total_in;  /* total nb of input bytes read so far */
	// 
	//     Bytef    *next_out; /* next output byte should be put there */
	//     uInt     avail_out; /* remaining free space at next_out */
	//     uLong    total_out; /* total nb of bytes output so far */
	// 
	//     struct internal_state FAR *state; /* not visible by applications */
	// 
	//     alloc_func zalloc;  /* used to allocate the internal state */
	//     free_func  zfree;   /* used to free the internal state */
	//     voidpf     opaque;  /* private data object passed to zalloc and zfree */
	// 
	//     int     data_type;  /* best guess about the data type: binary or text */
	//     uLong   adler;      /* adler32 value of the uncompressed data */
	//     uLong   reserved;   /* reserved for future use */
	// } z_stream;
};

var DeflateState = function (stream) {
	this.stream = stream;
	
	// typedef struct internal_state {
	//     z_streamp strm;      /* pointer back to this zlib stream */
	//     int   status;        /* as the name implies */
	//     Bytef *pending_buf;  /* output still pending */
	//     ulg   pending_buf_size; /* size of pending_buf */
	//     Bytef *pending_out;  /* next pending byte to output to the stream */
	//     uInt   pending;      /* nb of bytes in the pending buffer */
	//     int   wrap;          /* bit 0 true for zlib, bit 1 true for gzip */
	//     gz_headerp  gzhead;  /* gzip header information to write */
	//     uInt   gzindex;      /* where in extra, name, or comment */
	//     Byte  method;        /* STORED (for zip only) or DEFLATED */
	//     int   last_flush;    /* value of flush param for previous deflate call */
	// 
	//                 /* used by deflate.c: */
	// 
	//     uInt  w_size;        /* LZ77 window size (32K by default) */
	//     uInt  w_bits;        /* log2(w_size)  (8..16) */
	//     uInt  w_mask;        /* w_size - 1 */
	// 
	//     Bytef *window;
	//     /* Sliding window. Input bytes are read into the second half of the window,
	//      * and move to the first half later to keep a dictionary of at least wSize
	//      * bytes. With this organization, matches are limited to a distance of
	//      * wSize-MAX_MATCH bytes, but this ensures that IO is always
	//      * performed with a length multiple of the block size. Also, it limits
	//      * the window size to 64K, which is quite useful on MSDOS.
	//      * To do: use the user input buffer as sliding window.
	//      */
	// 
	//     ulg window_size;
	//     /* Actual size of window: 2*wSize, except when the user input buffer
	//      * is directly used as sliding window.
	//      */
	// 
	//     Posf *prev;
	//     /* Link to older string with same hash index. To limit the size of this
	//      * array to 64K, this link is maintained only for the last 32K strings.
	//      * An index in this array is thus a window index modulo 32K.
	//      */
	// 
	//     Posf *head; /* Heads of the hash chains or NIL. */
	// 
	//     uInt  ins_h;          /* hash index of string to be inserted */
	//     uInt  hash_size;      /* number of elements in hash table */
	//     uInt  hash_bits;      /* log2(hash_size) */
	//     uInt  hash_mask;      /* hash_size-1 */
	// 
	//     uInt  hash_shift;
	//     /* Number of bits by which ins_h must be shifted at each input
	//      * step. It must be such that after MIN_MATCH steps, the oldest
	//      * byte no longer takes part in the hash key, that is:
	//      *   hash_shift * MIN_MATCH >= hash_bits
	//      */
	// 
	//     long block_start;
	//     /* Window position at the beginning of the current output block. Gets
	//      * negative when the window is moved backwards.
	//      */
	// 
	//     uInt match_length;           /* length of best match */
	//     IPos prev_match;             /* previous match */
	//     int match_available;         /* set if previous match exists */
	//     uInt strstart;               /* start of string to insert */
	//     uInt match_start;            /* start of matching string */
	//     uInt lookahead;              /* number of valid bytes ahead in window */
	// 
	//     uInt prev_length;
	//     /* Length of the best match at previous step. Matches not greater than this
	//      * are discarded. This is used in the lazy match evaluation.
	//      */
	// 
	//     uInt max_chain_length;
	//     /* To speed up deflation, hash chains are never searched beyond this
	//      * length.  A higher limit improves compression ratio but degrades the
	//      * speed.
	//      */
	// 
	//     uInt max_lazy_match;
	//     /* Attempt to find a better match only when the current match is strictly
	//      * smaller than this value. This mechanism is used only for compression
	//      * levels >= 4.
	//      */
	// #   define max_insert_length  max_lazy_match
	//     /* Insert new strings in the hash table only if the match length is not
	//      * greater than this length. This saves time but degrades compression.
	//      * max_insert_length is used only for compression levels <= 3.
	//      */
	// 
	//     int level;    /* compression level (1..9) */
	//     int strategy; /* favor or force Huffman coding*/
	// 
	//     uInt good_match;
	//     /* Use a faster search when the previous match is longer than this */
	// 
	//     int nice_match; /* Stop searching when current match exceeds this */
	// 
	//                 /* used by trees.c: */
	//     /* Didn't use ct_data typedef below to supress compiler warning */
	//     struct ct_data_s dyn_ltree[HEAP_SIZE];   /* literal and length tree */
	//     struct ct_data_s dyn_dtree[2*D_CODES+1]; /* distance tree */
	//     struct ct_data_s bl_tree[2*BL_CODES+1];  /* Huffman tree for bit lengths */
	// 
	//     struct tree_desc_s l_desc;               /* desc. for literal tree */
	//     struct tree_desc_s d_desc;               /* desc. for distance tree */
	//     struct tree_desc_s bl_desc;              /* desc. for bit length tree */
	// 
	//     ush bl_count[MAX_BITS+1];
	//     /* number of codes at each bit length for an optimal tree */
	// 
	//     int heap[2*L_CODES+1];      /* heap used to build the Huffman trees */
	//     int heap_len;               /* number of elements in the heap */
	//     int heap_max;               /* element of largest frequency */
	//     /* The sons of heap[n] are heap[2*n] and heap[2*n+1]. heap[0] is not used.
	//      * The same heap array is used to build all trees.
	//      */
	// 
	//     uch depth[2*L_CODES+1];
	//     /* Depth of each subtree used as tie breaker for trees of equal frequency
	//      */
	// 
	//     uchf *l_buf;          /* buffer for literals or lengths */
	// 
	//     uInt  lit_bufsize;
	//     /* Size of match buffer for literals/lengths.  There are 4 reasons for
	//      * limiting lit_bufsize to 64K:
	//      *   - frequencies can be kept in 16 bit counters
	//      *   - if compression is not successful for the first block, all input
	//      *     data is still in the window so we can still emit a stored block even
	//      *     when input comes from standard input.  (This can also be done for
	//      *     all blocks if lit_bufsize is not greater than 32K.)
	//      *   - if compression is not successful for a file smaller than 64K, we can
	//      *     even emit a stored file instead of a stored block (saving 5 bytes).
	//      *     This is applicable only for zip (not gzip or zlib).
	//      *   - creating new Huffman trees less frequently may not provide fast
	//      *     adaptation to changes in the input data statistics. (Take for
	//      *     example a binary file with poorly compressible code followed by
	//      *     a highly compressible string table.) Smaller buffer sizes give
	//      *     fast adaptation but have of course the overhead of transmitting
	//      *     trees more frequently.
	//      *   - I can't count above 4
	//      */
	// 
	//     uInt last_lit;      /* running index in l_buf */
	// 
	//     ushf *d_buf;
	//     /* Buffer for distances. To simplify the code, d_buf and l_buf have
	//      * the same number of elements. To use different lengths, an extra flag
	//      * array would be necessary.
	//      */
	// 
	//     ulg opt_len;        /* bit length of current block with optimal trees */
	//     ulg static_len;     /* bit length of current block with static trees */
	//     uInt matches;       /* number of string matches in current block */
	//     int last_eob_len;   /* bit length of EOB code for last block */
	// 
	// #ifdef DEBUG
	//     ulg compressed_len; /* total bit length of compressed file mod 2^32 */
	//     ulg bits_sent;      /* bit length of compressed data sent mod 2^32 */
	// #endif
	// 
	//     ush bi_buf;
	//     /* Output buffer. bits are inserted starting at the bottom (least
	//      * significant bits).
	//      */
	//     int bi_valid;
	//     /* Number of valid bits in bi_buf.  All bits above the last valid bit
	//      * are always zero.
	//      */
	// 
	//     ulg high_water;
	//     /* High water mark offset in window for initialized bytes -- bytes above
	//      * this are set to zero in order to avoid memory check warnings when
	//      * longest match routines access bytes past the input.  This is then
	//      * updated to the new high water mark.
	//      */
	// 
	// } FAR deflate_state;
};

function deflateInit (stream, level, version) {
	// FIXME: This whole method should really be in the Stream "constructor".
	zlib.log("+ calling deflateInit");
	
	version = version || ZLIB_VERSION;
	var method = STRATEGY.DEFLATED;
	var windowBits = MAX_WINDOW_BITS;
	var memLevel = DEFAULT_MEM_LEVEL;
	var strategy = STRATEGY.DEFAULT;
	
	var wrap = 1;
	
	// zlib comments:
	//     We overlay pending_buf and d_buf+l_buf. This works since the average
	//     output size for (length,distance) codes is <= 24 bits.
	var overlay; // This is of type "ushf". What is that?
	
	if (!version || version[0] != ZLIB_VERSION[0]) {
		error("Version error: " + version + " not compatible " +
			"with " + ZLIB_VERSION);
	}
	
	if (!stream) {
		error("Invalid stream: " + stream);
	}
	
	// What is "windowBits"?
	if (windowBits < 0) {
		wrap = 0; // "Suppress the zlib wrapper" (what does that mean?)
		windowBits = -windowBits;
	}
	
	if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method != STRATEGY.DEFLATED ||
		windowBits < 8 || windowBits > 15 || level < 0 || level > 9 ||
		strategy < 0 || strategy > STRATEGY.FIXED) {
		// What's going on here? There are too many conditions to get a
		// good read on what the actual problem is.
		error("FIXME: Write a proper error message");
	}
	
	if (windowBits == 8)
		windowBits = 9 // "until 256-byte window bug fixed"
	
	var s = stream.state; // Just an alias to reduce typing/clutter
	s.wrap = wrap;
	s.gzhead = null;
	s.windowBits = windowBits;
	s.windowSize = 1 << s.windowBits;
	s.windowMask = s.windowSize - 1;
	s.hashBits = memLevel + 7;
	s.hashSize = 1 << s.hashBits;
	s.hashMask = s.hashSize - 1;
	s.hashShift = ((s.hashBits + MIN_MATCH - 1) / MIN_MATCH);
	// TODO: Figure out what "Bytef", "Byte", "Posf" and "Pos" are.
	//s.window = (Bytef *) ZALLOC(strm, s->w_size, 2*sizeof(Byte));
	//s.prev = (Posf *)  ZALLOC(strm, s->w_size, sizeof(Pos));
	//s.head = (Posf *)  ZALLOC(strm, s->hash_size, sizeof(Pos));
	s.highWater = 0; // "nothing written to s->window yet". What is this?
	s.litBufSize = 1 << (memLevel + 6); // "16K elements by default"
	//overlay = (ushf *) ZALLOC(strm, s->lit_bufsize, sizeof(ush)+2);
	s.pendingBuffer = overlay;
	//s.pendingBufferSize = s.litBufSize * (sizeof(ush)+2L);
	
	if (!s.window || !s.prev || !s.head || !s.pendingBuffer) {
		s.status = STREAM_STATUS.FINISH_STATE;
		stream.errorMessage = getErrorMessage(STATUS.MEM_ERROR);
		deflateEnd(stream);
		// error("Memory error");
	}
	
	// Something will have to replace all this sizeof() stuff.
	//s.dBuf = overlay + (s.litBufSize / sizeof(ush));
	//s.lBuf = s.pendingBuffer + (1 + sizeof(ush)) * s.litBufSize;
	
	s.level = level;
	s.strategy = strategy;
	s.method = method;
	
	return deflateReset(stream);
}

function deflateReset (stream) {
	zlib.log("+ calling deflateReset");
//     deflate_state *s;
// 
//     if (strm == Z_NULL || strm->state == Z_NULL ||
//         strm->zalloc == (alloc_func)0 || strm->zfree == (free_func)0) {
//         return Z_STREAM_ERROR;
//     }
// 
//     strm->total_in = strm->total_out = 0;
//     strm->msg = Z_NULL; /* use zfree if we ever allocate msg dynamically */
//     strm->data_type = Z_UNKNOWN;
// 
//     s = (deflate_state *)strm->state;
//     s->pending = 0;
//     s->pending_out = s->pending_buf;
// 
//     if (s->wrap < 0) {
//         s->wrap = -s->wrap; /* was made negative by deflate(..., Z_FINISH); */
//     }
//     s->status = s->wrap ? INIT_STATE : BUSY_STATE;
//     strm->adler =
// #ifdef GZIP
//         s->wrap == 2 ? crc32(0L, Z_NULL, 0) :
// #endif
//         adler32(0L, Z_NULL, 0);
//     s->last_flush = Z_NO_FLUSH;
// 
//     _tr_init(s);
//     lm_init(s);
// 
//     return Z_OK;
}

function deflate (stream) {
	zlib.log("+ calling deflate");
}

function deflateEnd (stream) {
	zlib.log("+ calling deflateEnd");
}

// ----------------------------------------------------------------------------
// Public API
// ----------------------------------------------------------------------------

return {
	VERSION: "0.0.1",
	
	utils: {
		adler32: adler32
	},
	
	/**
	 * This method is here so that one method can be called and it will
	 * work regardless of if we're running in a browser or in node.js
	 * (if we're in node.js, this will be replaced with sys.puts).
	 */
	log: function () {
		if (typeof(console) == "object" && console.log) {
			console.log.apply(console, arguments);
		}
	},
	
	/**
	 * The exception type thrown by this zlib implementation any time
	 * an error occurs.
	 * 
	 * @param message [string] The error message to display.
	 */
	Error: function (message) {
		this.toString = function () {
			return "zlib.Error: " + message;
		};
	},
	
	/**
	 * Takes a string as input, compresses the data, and returns the compressed
	 * output (another string).
	 * 
	 * @param input [string] 
	 * @param level [int] The compression level. One of the COMPRESSION_LEVEL
	 *                    values. Default is COMPRESSION_LEVEL.DEFAULT.
	 */
	compress: function (input, level) {
		if (typeof(input) != "string") {
			error("Cannot operate on input of type " +
				typeof(input) + " (" + input + ")");
		}
		
		zlib.log("Compressing '" + input.slice(0, 10) + "'...");
		
		level = level | COMPRESSION_LEVEL.DEFAULT;
		var stream = new Stream(input);
		
		// Initialize deflate.
		// Throw if not STATUS.OK
		deflateInit(stream, level);
		
		// Perform deflate.
		// Throw if not STATUS.STREAM_END
		//		- do 'deflateEnd(stream)'
		//      - also 'stream.availOut = stream.totalOut;'
		// 		- convert STATUS.OK to STATUS.BUF_ERROR
		deflate(stream, FLUSH.FINISH);
		
		// Finish deflate.
		// Throw if there are any problems
		deflateEnd(stream);
		
		// Return the output if everything goes well.
		return stream.output;
	}
};

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

