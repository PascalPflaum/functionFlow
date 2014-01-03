var FunctionFlow = require('../index.js');
var flow = new FunctionFlow();

function step1(flow) {
	console.log('First Step!');
	flow.done();
}
function step2(flow) {
	console.log('Second Step!');
	flow.done();
}
function step3(flow) {
	console.log('Third Step!');
	flow.done();
}

function finalCallback(error, data) {
	console.log('Finished!');
}

flow.run(step1).run(step2).run(step3).now(finalCallback);