const monk = require('monk')
const db = monk('localhost:27017/activity')
const sessions = db.get('sessions')
const users = db.get('users')
const { to } = require('../utils/')

module.exports = {
	getOpenid: (session) => {
		return new Promise(async (resolve, reject) => {
			const data = await sessions.findOne({ session })
			data ? resolve(data.openid) : reject(new Error('couldn not find user'))
		})
	},
	getMyUserInfo: (openid) => {
		return new Promise(async (resolve) => {
			const user = await users.findOne({ openid })
			if (user) { resolve(user); return }
			const newUser = { openid }
			await users.insert(newUser)
			resolve(newUser)
		})
	},
	updateMyUserInfo: (openid, myUserInfo) => {
		//这里更新的对象也应该是完整的 用户表数据 userInfo
		return new Promise(async (resolve, reject) => {
			const [err, data] = await to(users.findOneAndUpdate({openid}, myUserInfo))
			if(err) reject(err)
			resolve(data)
		})
	}
}
