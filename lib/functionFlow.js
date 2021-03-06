var FunctionFlow = (function() {

	//the magic node export
	if (typeof module !== 'undefined' && module.exports) {
		module.exports = FunctionFlow;
		
		//add the event emitter
		require("util").inherits(FunctionFlow, require('events').EventEmitter);
	}



	/**
	 * simply do nothing
	 * @returns {undefined}
	 */
	function doNothing() {
	}


	/**
	 * checks an array for having errors
	 * @param {array} arr
	 * @returns {Boolean}
	 */
	function hasErrors(arr) {
		for (var i = 0; i < arr.length; i++) {
			if (!!arr[i]) {
				return true;
			}
		}
		return false;
	}


	/**
	 * a function step is able to run several tasks parallel
	 * @returns {FunctionFlow|FunctionStep}
	 */
	function FunctionStep() {

		if (!(this instanceof FunctionStep))
			return new FunctionFlow();

		var self = this;
		self.runs = [];

		return self;
	}


	/**
	 * add a new function to the parallel run
	 * @param {functions} doThis
	 * @returns {FunctionStep}
	 */
	FunctionStep.prototype.addParallelTask = function(doThis) {
		this.runs.push({func : doThis});
		return this;
	};


	/**
	 * run the last given task x times
	 * @param {number} nr
	 * @returns {FunctionStep}
	 */
	FunctionStep.prototype.times = function(nr) {
		this.runs[this.runs.length - 1].times = nr;
		return this;
	};


	/**
	 * during run the last added step should be run once for the given array of arguments
	 * @param {type} args
	 * @returns {FunctionStep}
	 */
	FunctionStep.prototype.forEach = function(args) {
		this.runs[this.runs.length - 1].argsForEach = args;
		return this;
	};


	/**
	 * during run the last added step should be run once for the given array of arguments
	 * @param {type} args
	 * @returns {FunctionStep}
	 */
	FunctionStep.prototype.with = function(args) {
		this.runs[this.runs.length - 1].args = args;
		return this;
	};


	/**
	 * start the parallel run now
	 * @param {function} stepDone
	 * @param {mixed} previousStepError the error of the previous step
	 * @param {mixed} previousStepData the data of the previous step
	 * @param {number} errorHandling indicates how errors should be handled during execution
	 * @returns {unresolved}
	 */
	FunctionStep.prototype.now = function(stepDone, previousStepError, previousStepData, errorHandling) {

		function getRunDone(i) {
			
			/**
			 * a single run is complete
			 * @param {type} error
			 * @param {type} data
			 * @returns {undefined}
			 */
			function runDone(error, data) {
				if (!stepComplete) {

					stepResultError[i] = error;
					stepResultData[i] = data;
					if (self.runs.length === ++completedRun || (errorHandling === 0 && error)) {
						stepComplete = true;
						stepDone(stepResultError, stepResultData);
					}
				}
			};
			
			
			/**
			 * add a positive deferred interface
			 * @param {mixed} data
			 * @returns {undefined}
			 */
			runDone.resolve = function(data) {
				runDone(undefined, data);
			};
			
			
			/**
			 * adds a negative deferred interface
			 * @param {mixed} error
			 * @returns {undefined}
			 */
			runDone.reject = function(error) {
				runDone(error);
			};
			
			return runDone;
		}

		var self = this;

		//storage for results of the step
		var stepResultError = [];
		var stepResultData = [];

		var completedRun = 0;
		var stepComplete = false;

		//the run has forEach arguments, replace the single run with one for every element in argsForEach
		for (var i = self.runs.length - 1; i >= 0; i--) {

			var currentRun = self.runs[i];
			if (currentRun.argsForEach) {

				//remove the original method
				self.runs.splice(i, 1);

				//for every argument group create a new function
				for (var j = 0; j < currentRun.argsForEach.length; j++) {

					var currentArgs = [];
					if (currentRun.args) {
						Array.prototype.push.apply(currentArgs, currentRun.args);
					}

					var argsFromForEach = currentRun.argsForEach[j];
					if (typeof argsFromForEach !== 'object') {
						argsFromForEach = [argsFromForEach];
					}

					Array.prototype.push.apply(currentArgs, argsFromForEach);

					self.runs.splice(i + j, 0, {
						func : currentRun.func,
						args : currentArgs
					});
				}

			} else if (currentRun.times) {

				//remove the original method
				self.runs.splice(i, 1);

				//for every argument group create a new function
				for (var j = 0; j < currentRun.times; j++) {
					self.runs.splice(i + j, 0, {
						func : currentRun.func,
						args : currentRun.args
					});
				}

			}
		}

		//for every function in the step, call the function and fetch the results via the runDone method
		for (var i = 0; i < self.runs.length; i++) {

			if (stepComplete) {
				return;
			}

			currentRun = self.runs[i];

			//create a done method for this run
			var runDone = getRunDone(i);

			//create the arguments for the function
			var args = [
				{
					done : runDone,
					previousStep : {
						error : previousStepError,
						data : previousStepData
					}
				}
			];

			//add additional arguments
			if (currentRun.args instanceof Array) {
				Array.prototype.push.apply(args, currentRun.args);
			}

			try {
				currentRun.func.apply(currentRun, args);
			} catch (error) {
				runDone(error);
			}
		}

		return;
	};


	/**
	 * creates a new flow
	 * @returns {FunctionFlow}
	 */
	function FunctionFlow() {

		if (!(this instanceof FunctionFlow)) {
			
			return new FunctionFlow;
		}
		
		var self = this;
		
		var steps = [];

		var errorHandling = 1;
		// 0 = immediately
		// 1 = After Step
		// 2 = Never

		self.onErrorStopASAP = function() {
			errorHandling = 0;
			return self;
		};


		/**
		 * will stop the flow direct after the parallel step
		 * @returns {FunctionFlow}
		 */
		self.onErrorStopAfterStep = function() {
			errorHandling = 1;
			return self;
		};


		/**
		 * will stop the flow direct after the parallel step
		 * @returns {FunctionFlow}
		 */
		self.onErrorNeverStop = function() {
			errorHandling = 2;
			return self;
		};


		/**
		 * create a new step
		 * @param {function} doThis
		 * @returns {FunctionFlow}
		 */
		self.run = function(doThis) {
			if (typeof doThis !== 'function') {
				throw new TypeError('do requires first argument to be a function');
			}
			var currentStep = new FunctionStep();
			currentStep.addParallelTask(doThis);
			steps.push(currentStep);

			return self;
		};


		/**
		 * do a parallel task
		 * @param {function} doThis
		 * @returns {FunctionFlow}
		 */
		self.and = function(doThis) {
			if (typeof doThis !== 'function') {
				throw new TypeError('and() requires first argument to be a function');
			}

			steps[steps.length - 1].addParallelTask(doThis);
			return self;
		};


		/**
		 * calls the previous function with the given arguements
		 * @returns {FunctionFlow}
		 */
		self.with = function() {
			steps[steps.length - 1].with(Array.prototype.slice.call(arguments, 0));
			return self;
		};


		/**
		 * calls the given function once for each of the given arguments
		 * @param {array} elements
		 * @returns {FunctionFlow}
		 */
		self.forEach = function(elements) {
			steps[steps.length - 1].forEach(elements);
			return self;
		};


		/*
		 * runs the given function X times
		 * @param {number} nr
		 * @returns {FunctionFlow}
		 */
		self.times = function(nr) {
			if (isNaN(nr)) {
				throw new TypeError('times() requires first argument to be a number');
			} else if (nr < 1) {
				throw new Error('times() requires a psoitive number');
			}

			steps[steps.length - 1].times(parseInt(nr, 10));
			return self;
		};


		/**
		 * start the flow
		 * @param {function} flowDone
		 * @returns {undefined}
		 */
		self.now = function(flowDone) {

			//replace the callback with a dummy, if no one is provided
			if (flowDone === undefined) {
				flowDone = doNothing;
			}

			var lastStepError;
			var lastStepData;


			/**
			 * start the next step
			 * @returns {FunctionFlow}
			 */
			function nextStep() {


				/*
				 * the callback for the step to indicate it has completed all tasks
				 * @param {mixed} stepResultError
				 * @param {mixed} stepResultData
				 * @returns [undefined}
				 */
				function stepComplete(stepResultError, stepResultData) {
					lastStepError = stepResultError;
					lastStepData = stepResultData;
					nextStep();
				}


				//if there are no more steps, call the final callback
				if (!steps.length || (lastStepError !== undefined && errorHandling < 2 && hasErrors(lastStepError))) {
					flowDone(lastStepError, lastStepData);
					return;
				}

				//get the currentStep
				var currentStep = steps.shift();

				//and start the step
				currentStep.now(stepComplete, lastStepError, lastStepData, errorHandling);

				return;
			}

			//start first step
			nextStep();
			return;
		};

		return self;
	}

	return FunctionFlow;
})();