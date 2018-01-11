const express = require('express')
const router = express.Router()
const monk = require('monk')
const db = monk('localhost:27017/activity')
const sessions = db.get('sessions')
const request = require('request')
const {getRandomString} = require('../utils/') 

router.get('/', (req, res) => {
	const appid = 'wx86d9bed97bc5b99c'
	const secret = 'd90d8665027fbaed766eda29107c3307'
	const code = req.query.code
	const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`
	request(url, async (error, response, body) => {
		const {openid, session_key} = JSON.parse(body)
		if (!openid) { res.status(502).send(body); return }
		const newSession = { openid, session_key, session: await getRandomString() }
		const {session} = await sessions.findOneAndUpdate({openid}, newSession, {upsert: true})
		res.send({session})
	})
})

router.post('/', async (req, res) => {
	const { session } = req.body
	const hasSession = await sessions.findOne({ session })
	console.log(hasSession)
	res.send({ result: !!hasSession })
})

module.exports = router
