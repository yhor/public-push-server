module.exports = {
	badRequest: (res, message, err = null) => {
		if (err) { console.debug('err', err) };
		return res.status(400).json({
			success: false,
			message,
		});
	},
	unAuthorized: (res, message) => {
		return res.status(401).json({
			success: false,
			message,
		});
	}
}