const express = require('express')
const app = require('express')()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const port = process.env.PORT || 3000
const users = require('./routers/CRUD')('users')
const activities = require('./routers/activities')
const bodyParser = require('body-parser')

app.use(express.static('dist'))
// CORS
app.use(function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*')
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
	next()
})

app.use(function timeLog (req, res, next) {
	console.log(req.method, req.originalUrl)
	console.log('Time: ', (new Date()).toString())
	next()
})

app.use(bodyParser.json())
// set true for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
app.use('/activities', activities)
app.use('/users', users)

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/index.html')
})

async function emitSocketEvent (req, res) {
	console.log(req.params)
	const event = req.params.eventName || req.body.eventName || req.body.event
	console.log(event)
	io.emit(event)
	res.send(event)
}

app.post('/emit', emitSocketEvent)
app.post('/events(/:eventName)?', emitSocketEvent)
app.post('/router', async (req, res) => {
	const path = req.body.path
	io.emit('ROUTER', {path})
	res.send(path)
})

// error handler
app.use(function (err, req, res) {
	// set locals, only providing error in development
	res.locals.message = err.message
	res.locals.error = req.app.get('env') === 'development' ? err : {}

	// render the error page
	res.status(err.status || 500)
	res.render('error')
})

app.use(function (req, res, next) {
	var err = new Error('Not Found')
	err.status = 404
	next(err)
})

app.set('port', process.env.PORT || 3000)

http.listen(port, function(){
	console.log('listening on *:' + port)
})
