var FunctionFlow = require('../index.js');
var flow = new FunctionFlow();

flow.run(function(flow) {
	setTimeout(function() {
		flow.done(undefined, 'Aquaman');
	}, 200);
}).and(function(flow) {
	setTimeout(function() {
		flow.done(undefined, 'Green Lantern');
	}, 100);
}).and(function(flow) {
	setTimeout(function() {
		flow.done(undefined, 'Wonderwomen');
	}, 500);
}).run(function(flow) { //this step will be executed, after all tasks of the previous step are finished
	for (var i = 0; i < flow.previousStep.data.length; i++) {
		flow.previousStep.data[i] += ' (' + flow.previousStep.data[i].length + ')';
	}
	setTimeout(function() {
		flow.done(undefined, flow.previousStep.data);
	}, 200);
}).now(function(error, data) {
	console.log('Superheroes\n-------------\n' + data[0].join('\n'));
});