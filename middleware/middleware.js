const jwt = require('jsonwebtoken');
const jsend = require('jsend');

// Middleware to verify JWT tokens
function isAuth(req, res, next) {
	try {
		// Get the authorization header
		const authHeader = req.headers['authorization'];

		if (!authHeader) {
			return res.status(401).jsend.fail({ message: 'No token provided.' });
		}

		const token = authHeader.split(' ')[1];
		if (!token) {
			return res.status(401).jsend.fail({ message: 'No token provided.' });
		}

		// Verify the token
		const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
		req.user = decoded; // Attach decoded token data (id, email, etc.)
		next(); // Move on to the next middleware or route handler
	} catch (error) {
		console.error('Authentication error:', error);
		return res.status(403).jsend.fail({ message: 'Invalid or expired token.' });
	}
}

module.exports = isAuth;