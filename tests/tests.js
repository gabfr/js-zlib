JSTest.TestCase({
	name: "Adler32 Tests",
	
	testBadInputFails: function () {
		this.assertRaises(Error, zlib.utils.adler32, null);
		this.assertRaises(Error, zlib.utils.adler32, undefined);
		this.assertRaises(Error, zlib.utils.adler32, true);
		this.assertRaises(Error, zlib.utils.adler32, {});
		this.assertRaises(Error, zlib.utils.adler32, []);
		this.assertRaises(Error, zlib.utils.adler32, 10);
	},
	
	testChecksumWikipedia: function () {
		this.assertEqual(zlib.utils.adler32("Wikipedia"), 300286872);
	},
	
	testUpdatingChecksumWikipedia: function () {
		var adler = zlib.utils.adler32("Wiki");
		adler = zlib.utils.adler32("pedia", adler);
		this.assertEqual(adler, 300286872);
	}
});

JSTest.TestCase({
	name: "Compression Tests",
	
	testBadInputFails: function () {
		this.assertRaises(zlib.Error, zlib.compress, null, null);
		this.assertRaises(zlib.Error, zlib.compress, null, undefined);
		this.assertRaises(zlib.Error, zlib.compress, null, 123);
		this.assertRaises(zlib.Error, zlib.compress, null, {});
		this.assertRaises(zlib.Error, zlib.compress, null, []);
	},
	
	testCompressSmallBuffer: function () {
		var input  = "hello";
		var output = "\x78\x9c\xcb\x48\xcd\xc9\xc9\x07\x00\x06\x2c\x02\x15"
		
		this.assertEqual(zlib.compress(input), output);
	},
});
