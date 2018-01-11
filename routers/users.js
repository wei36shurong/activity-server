const express = require('express')
const router = express.Router()
// const monk = require('monk')
// const db = monk('localhost:27017/activity')
// const users = db.get('users')
const { to } = require('../utils/')
const CRUD = require('./CRUD')('users')
const { getOpenid, getMyUserInfo, updateMyUserInfo } = require('../utils/dbAction')

router.get('/me', async (req, res) => {
	const { session } = req.query
	const [err, openid] = await to(getOpenid(session))
	if (err) { res.sendStatus(404); return }
	const myUserInfo = await getMyUserInfo(openid)

	delete myUserInfo.openid
	res.send(myUserInfo)
})

router.put('/me', async (req, res) => {
	const {session} = req.body
	const [err, openid] = await to(getOpenid(session))
	let {myUserInfo} = req.body
	console.log(myUserInfo)
	if (err) { res.sendStatus(404); return }
	myUserInfo.openid = openid
	console.log(openid)
	const data = await updateMyUserInfo(openid, myUserInfo)
	res.status(201).send(data)
})

router.use(CRUD)

module.exports = router