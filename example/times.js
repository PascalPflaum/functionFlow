var FunctionFlow = require('../index.js');
var flow = new FunctionFlow();

var superheroes = [
	'Blade',
	'Captain America',
	'Daredevil',
	'Deadpool',
	'Elektra',
	'Ghost Rider',
	'Hawkeye',
	'Hulk',
	'Iron Man',
	'War Machine',
	'Punisher',
	'Silver Surfer',
	'Spider-Man',
	'Thor'
];

flow.run(function(flow) {
	var idx = Math.floor(Math.random() * superheroes.length);
	var item = superheroes.splice(idx,1)[0];
	flow.done(undefined, item);
}).times(5).now(function(error, data) {
	console.log(' Selected Superheroes\n-------------\n' + data.join('\n'));
});