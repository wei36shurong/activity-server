module.exports = function (collectionName) {
	const express = require('express')
	const router = express.Router()
	const monk = require('monk')
	const db = monk('localhost:27017/activity')
	const collection = db.get(collectionName)
	const {to} = require('../utils/') 

	router.get('/(:id)?', async (req, res) => {
		let { filter, ids } = req.query
		const {id: _id} = req.params
		if (filter) {
			filter = JSON.parse(req.query.filter || '{}')
			const [err, data] = await to(collection.find(filter))
			if (err) throw new Error(err)
			res.send(data)
			return
		}
		if (ids) {
			ids = ids.split(',')
			const [err, data] = await to(Promise.all(ids.map(id => {
				return new Promise(async (resolve, reject) => {
					const [err, data] = await to(collection.findOne({_id: id}))
					if (err) reject(err)
					resolve(data)
				})
			})))
			if (err) throw new Error(err)
			res.send(data)
			return
		}
		if (_id) {
			if (!_id) { res.sendStatus(400); return }
			const [err, data] = await to(collection.findOne({_id}))
			if (err) throw new Error(err)
			res.send(data)
		}
		const [err, data] = await to(collection.find({}))
		if (err) throw new Error(err)
		res.send(data)
		
	})

	router.post('/searches', async (req, res) => {
		const [err, data] = await to(collection.find(req.body))
		if (err) throw new Error(err)
		res.send(data)
	})

	router.post('/', async (req, res) => {
		const [err, data] = await to(collection.insert(req.body))
		if (err) throw new Error(err)
		res.send(data)
	})

	router.put('/(:id)?', async (req, res) => {
		const _id = req.params.id || req.body._id
		if (!_id) { res.sendStatus(400); return }
		const [err, data] = await to(collection.findOneAndUpdate({_id}, req.body))
		if (err) throw new Error(err)
		res.send(data)
	})
	return router
}