const express = require('express')
const router = express.Router()
const monk = require('monk')
const db = monk('localhost:27017/activity')
const users = db.get('users')
const {to} = require('../utils/') 

router.get('/:id', async (req, res) => {
	const _id = req.params.id
	if (!_id) { res.sendStatus(400); return }
	const [err, data] = await to(users.findOne({_id}))
	if (err) throw new Error(err)
	res.send(data)
})

router.get('/', async (req, res) => {
	const filter = JSON.parse(req.query.filter || '{}')
	const [err, data] = await to(users.find(filter))
	if (err) throw new Error(err)
	res.send(data)
})

router.post('/searches', async (req, res) => {
	const [err, data] = await to(users.find(req.body))
	if (err) throw new Error(err)
	res.send(data)
})

router.post('/', async (req, res) => {
	const [err, data] = await to(users.insert(req.body))
	if (err) throw new Error(err)
	res.send(data)
})

router.put('/(:id)?', async (req, res) => {
	const _id = req.params.id || req.body._id
	if (!_id) { res.sendStatus(400); return }
	const [err, data] = await to(users.findOneAndUpdate({_id}, req.body))
	if (err) throw new Error(err)
	res.send(data)
})

module.exports = router