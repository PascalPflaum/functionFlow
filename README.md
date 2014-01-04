# functionFlow

## Introduction
Helps you to structure the execution of asynchronous code using a BBD style interface.
To realize this, functions that should be executed parallel are named "tasks", a group of "tasks" defines a "step".
"Steps" will be executed one by one. Each "step" has access to the results (data and error) of the previuos "step".

## Installing

Download the repository (or at least the "index.js") and then ...

### Node.js
```js
var FunctionFlow = require('flow/index.js');
```
### Browser
```
<script src="flow/index.js"></script>
```

## Basic examples

### One step with three parallel tasks
In this example we are creating one step with three (async) tasks in parallel.
```js
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
}).now(function(error, data) {
	console.log('Superheroes\n-------------\n' + data.join('\n'));
});
```
when the last task has finished after 500ms, this will print:
```
Superheroes
-------------
Aquaman
Green Lantern
Wonderwomen
```
The order of the elements in the data array that will be parsed to the final "now" callback depends on the order of adding functions and not on the order of calling the "flow.done" function.

### Three steps, each with a single task
```js
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
```

Please have also a look in the "example" folder.
