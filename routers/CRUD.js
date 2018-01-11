module.exports = function (collectionName) {
	const express = require('express')
	const router = express.Router()
	const monk = require('monk')
	const db = monk('localhost:27017/activity')
	const collection = db.get(collectionName)
	const {to} = require('../utils/') 

	router.get('/(:_id)?', async (req, res, next) => {
		let { filter, ids } = req.query
		const {_id} = req.params
		if (filter) {
			filter = JSON.parse(req.query.filter || '{}')
			const [err, data] = await to(collection.find(filter))
			if (err) throw new Error(err)
			res.send(data)
			return
		}
		if (ids) {
			ids = ids.split(',')
			const [err, data] = await to(Promise.all(ids.map(_id => {
				return new Promise(async (resolve, reject) => {
					const [err, data] = await to(collection.findOne({_id}))
					if (err) reject(err)
					resolve(data)
				})
			})))
			if (err) throw new Error(err)
			res.send(data)
			return
		}
		if (_id) {
			// 标准的catch方式，to似乎没法让错误变成catched promise error
			try {
				const data = await collection.findOne({_id})
				if (!data) {res.sendStatus(404);return}
				res.send(data)
			} catch (err) {
				next(err)
				return
			}
		}
		const data = await collection.find({})
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