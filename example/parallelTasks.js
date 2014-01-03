var FunctionFlow = require('../index.js');
var flow = new FunctionFlow();

flow.run(function(flow) {
	setTimeout(function() {
		flow.done(undefined,'Aquaman');
	}, 200);
}).and(function(flow) {
	setTimeout(function() {
		flow.done(undefined,'Green Lantern');
	}, 100);
}).and(function(flow) {
	setTimeout(function() {
		flow.done(undefined,'Wonderwomen');
	}, 500);
}).now(function(error, data) {
	console.log('Superheroes\n-------------\n' + data.join('\n'));
});