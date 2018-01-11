const exec = require('child_process').exec
const cmdRandStr = 'head -n 80 /dev/urandom | tr -dc A-Za-z0-9 | head -c 16'

module.exports = {
	to: function (promise) {
		return promise.then(data => {
			return [null, data]
		}).catch(err => [err])
	},
	getRandomString: function () {
		return new Promise((resolve, reject) => {
			exec(cmdRandStr, (error, stdout) => {
				if (error) reject(error)
				resolve(stdout)
			})
		})
	}
}