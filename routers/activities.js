const express = require('express')
const router = express.Router()
const monk = require('monk')
const db = monk('localhost:27017/activity')
const activities = db.get('activities')
const users = db.get('users')
const {to} = require('../utils/') 
const CRUD = require('./CRUD')('activities')

router.use(CRUD)

router.get('/:id/users', async (req, res) => {
	const {id: _id} = req.params
	const [, { users: user_ids }] = await to(activities.findOne({ _id }, 'users'))
	const [err, data] = await to(Promise.all(user_ids.map(_id => {
		return new Promise(async (resolve) => {
			const [, data] = await to(users.findOne({_id}, '-activities'))
			resolve(data)
		})
	})))
	if (err) throw new Error(err)
	res.send(data.filter(item => item))
})

router.post('/:id/users', async (req, res) => {
	const newUser = req.body
	const [, user] = await to(users.insert(newUser))
	console.log(user)
	await to(activities.findOneAndUpdate({_id: user._id}, { $push: { users: user._id } }))

	res.send(user)
})

router.post('/:id/draws/:index/winners')

module.exports = router
