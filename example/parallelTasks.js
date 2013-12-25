var FunctionFlow = require('../index.js');
var flow = new FunctionFlow();

flow.run(function(flow) {
	setTimeout(function() {
		flow.done('Aquaman');
	}, 200);
}).and(function(flow) {
	setTimeout(function() {
		flow.done('Green Lantern');
	}, 100);
}).and(function(flow) {
	setTimeout(function() {
		flow.done('Wonderwomen');
	}, 500);
}).now(function(data, error) {
	console.log('Superheroes\n-------------\n' + data.join('\n'));
});