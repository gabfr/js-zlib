JSTest.TestCase({
	name: 'Basic Tests',
	
	testCompressSmallBuffer: function () {
		var input  = "hello";
		var output = "\x78\x9c\xcb\x48\xcd\xc9\xc9\x07\x00\x06\x2c\x02\x15"
		
		this.assertEqual(zlib.compress(input), output);
	},
});
