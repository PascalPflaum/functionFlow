var FunctionFlow = require('../index.js');
var flow = new FunctionFlow();

function randomTimeout(flow, heroName) {
	setTimeout(function() {
		flow.done(undefined, heroName);
	}, Math.floor(Math.random() * 500) + 100);
}

flow
.run(randomTimeout).with('Aquaman')
.and(randomTimeout).with('Green Lantern')
.and(randomTimeout).with('Wonderwomen')
.now(function(error, data) {
	console.log('Superheroes With\n-------------\n' + data.join('\n'));
});

//this is equivalent to
flow
.run(randomTimeout).forEach(['Aquaman','Green Lantern', 'Wonderwomen'])
.now(function(error, data) {
	console.log('Superheroes For Each\n-------------\n' + data.join('\n'));
});