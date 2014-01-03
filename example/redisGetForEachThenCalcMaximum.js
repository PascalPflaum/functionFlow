var FunctionFlow = require('../index.js');
var redis = require("redis");
var redisClient = redis.createClient();

var RedisKeys = [
	'TestA',
	'TestB',
	'TestC'
];

var flow = new FunctionFlow();

function getFromRedis(flow, key) {
	redisClient.get(key, flow.done);
}

function getTheMax(flow) {
	flow.done(Math.max.apply(this, flow.previousStep.data));
}

function flowDone(error, data) {
	console.log('MaxValue: ' + data);
	redisClient.quit();
}

flow.run(getFromRedis).forEach(RedisKeys).run(getTheMax).now(flowDone);