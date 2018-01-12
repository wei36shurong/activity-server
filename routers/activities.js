const express = require('express')
const router = express.Router()
const monk = require('monk')
const db = monk('localhost:27017/activity')
const activities = db.get('activities')
const users = db.get('users')
const {to} = require('../utils/') 
const CRUD = require('./CRUD')('activities')
const { getOpenid } = require('../utils/dbAction')


router.get('/:_id/users', async (req, res) => {
	const {_id} = req.params
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

router.post('/:_id/users', async (req, res) => {
	const {session} = req.body
	const {_id: activityId} = req.params
	const openid = await getOpenid(session)
	const {_id: userId} = await users.findOne({openid})
	const hasSignedIn = await activities.findOne({_id: activityId}, { 
		$in: { users:  [userId] } 
	})
	if (hasSignedIn) { 
		res.status(400).send('user has already voted')
		return 
	}
	const {users} = await activities.findOneAndUpdate({_id: activityId}, { 
		$push: { 'users':  userId } 
	})
	const user = await users.findOneAndUpdate({_id: userId}, { 
		$push: { 'activities':  activityId } 
	})
	delete user.openid
	res.status(201).send(user)
})

router.delete('/:_id/votes/:vote_index/options/:item_index/voters', async (req, res, next) => {
	const {_id, vote_index, item_index} = req.params
	const {session} = req.body
	let {userId} = req.body
	try {
		if (session) { 
			const openid = await getOpenid(session)
			const {_id} = await users.findOne({openid}, '_id')
			userId = _id
		}
		await activities.findOneAndUpdate({_id}, { 
			$pull: { [`votes.${vote_index}.options.${item_index}.voters`]: userId } 
		})
		res.sendStatus(200)
	} catch(error) {
		next(error)
	}
})
router.post('/:_id/votes/:vote_index/options/:item_index/voters', async (req, res, next) => {
	const {_id, vote_index, item_index} = req.params
	const {session} = req.body
	let {userId} = req.body
	try {
		if (session) { 
			const openid = await getOpenid(session)
			const {_id} = await users.findOne({openid}, '_id')
			userId = _id
		}
		const {votes} = await activities.findOne({_id}, 'votes')
		const voters = votes[vote_index].options[item_index].voters
		const hasVoted = voters.some(id => String(id) == userId)
		if (hasVoted) { 
			res.status(400).send('user has already voted')
			return 
		}
		const activity = await activities.findOneAndUpdate({_id}, { 
			$push: { [`votes.${vote_index}.options.${item_index}.voters`]: userId } 
		})
		if (!activity) {res.sendStatus(404); return}
		res.status(201).send(activity.votes[vote_index].options[item_index].voters)
	} catch (error) {
		next(error)
	}
})

router.post('/:_id/votes/:vote_index/options/:item_index/bonus', async (req, res, next) => {
	const {_id, vote_index, item_index} = req.params
	const {bonus} = req.body
	try {
		const data = await activities.findOneAndUpdate({_id}, { 
			$set: { [`votes.${vote_index}.options.${item_index}.bonus`]: bonus } 
		})
		if (!data) {res.sendStatus(404); return}
		res.status(201).send(data.votes[vote_index].options[item_index])
	} catch (error) {
		next(error)
	}
})

router.put('/:_id/votes/:index/status', async (req, res) => {
	const {_id, index} = req.params
	const {status} = req.body
	const [, data] = await to(activities.findOneAndUpdate({_id}, { 
		$set: { [`votes.${index}.status`]: status }
	}))
	res.status(201).send(data)
})

router.post('/:_id/draws/:index/winners', async (req, res) => {
	const {_id, index} = req.params
	const winnerId = req.body.userId
	const [, data] = await to(activities.findOneAndUpdate({_id}, { 
		$push: { [`draws.${index}.winners`]:  winnerId } 
	}))
	res.send(data)
})

router.get('/:_id/votes', async (req, res) => {
	const {_id} = req.params
	const [, {votes}] = await to(activities.findOne({_id}, 'votes'))
	const data = votes.map(vote => {
		return vote.items.map(item => {
			item.voters_count = item.voters.length
			delete item.voters
			return item
		})
	})
	res.send(data)
})

router.use(CRUD)


module.exports = router
