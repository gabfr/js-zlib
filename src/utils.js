function error (message) {
	var e = new zlib.Error(message);
	zlib.log(e.toString());
	throw e;
}

function getErrorMessage (status) {
	return ERROR_MESSAGES[STATUS.NEED_DICT - status];
}
