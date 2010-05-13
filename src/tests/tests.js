JSTest.TestCase({
	name: 'Basic Tests',
	
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
