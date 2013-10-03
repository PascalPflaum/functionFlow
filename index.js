var FunctionFlow = (function() {
//the magic node export
	if (typeof module !== 'undefined' && module.exports) {
		module.exports = FunctionFlow;
	}


	/**
	 * simply do nothing
	 * @returns {undefined}
	 */
	function doNothing() {
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
	 * during run the last added step should be run once for the given array of arguments
	 * @param {type} args
	 * @returns {FunctionFlow._L1.FunctionStep}
	 */
	FunctionStep.prototype.forEach = function(args) {
		this.runs[this.runs.length - 1].argsForEach = args;
		return this;
	};
	
	
	/**
	 * during run the last added step should be run once for the given array of arguments
	 * @param {type} args
	 * @returns {FunctionFlow._L1.FunctionStep}
	 */
	FunctionStep.prototype.withArguments = function(args) {
		this.runs[this.runs.length - 1].args = Array.prototype.slice.call(arguments, 0);
		return this;
	};


	/**
	 * start the parallel run now
	 * @param {function} stepDone
	 * @param {mixed} previousStepError the error of the previous step
	 * @param {mixed} previousStepData the data of the previous step
	 * @returns {unresolved}
	 */
	FunctionStep.prototype.now = function(stepDone, previousStepError, previousStepData) {

		var self = this;

		//storage for results of the step
		var stepResultError = [];
		var stepResultData = [];

		var completedRun = 0;

		//the run has forEach arguments, replace the single run with one for every element in argsForEach
		for (var i = self.runs.length - 1; i >= 0; i--) {

			var currentRun = self.runs[i];
			if (!self.runs[i].argsForEach) {
				continue;
			}

			//move the original method
			self.runs.splice(i, 1);

			//for every argument set create a new function
			while (currentRun.argsForEach.length > 0) {
				var currentArgs = currentRun.argsForEach.pop();
				self.runs.splice(i, 0, {
					func : currentRun.func,
					args : currentArgs
				});
			}

		}

		//for every function in the step, call the function and fetch the results via the runDone method
		self.runs.forEach(function singleRun(currentRun, index) {


			/**
			 * a single run is complete
			 * @param {type} error
			 * @param {type} data
			 * @returns {undefined}
			 */
			function runDone(error, data) {
				stepResultError[index] = error;
				stepResultData[index] = data;
				if (self.runs.length === ++completedRun) {
					stepDone(stepResultError, stepResultData);
				}
			}

			var args = [{
					done : runDone,
					previousStep : {
						error : previousStepError,
						data : previousStepData
					}
			}];
			if (currentRun.args instanceof Array) {
				Array.prototype.push.apply(args,currentRun.args);
			}

			try {
				currentRun.func.apply(currentRun, args);
			} catch (error) {
				runDone(error);
			}
		});

		return;
	};


	/**
	 * creates a new flow
	 * @returns {FunctionFlow}
	 */
	function FunctionFlow() {

		if (!(this instanceof FunctionFlow))
			return new FunctionFlow();

		var self = this;
		var steps = [];

		function hasErrors(arr) {
			for (var i = 0; i < arr.length; i++) {
				if (arr[i] instanceof Error) {
					return true;
				}
			}
			return false;
		}


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
				throw new TypeError('and requires first argument to be a function');
			}

			steps[steps.length - 1].addParallelTask(doThis);
			return self;
		};

		self.forEach = function(elements) {
			steps[steps.length - 1].forEach(elements);
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

				function stepComplete(stepResultError, stepResultData) {
					lastStepError = stepResultError;
					lastStepData = stepResultData;
					nextStep();
				}


				//if there are no more steps, call the final callback
				if (!steps.length || (lastStepError !== undefined && hasErrors(lastStepError))) {
					flowDone(lastStepError, lastStepData);
					return;
				}

				//get the currentStep
				var currentStep = steps.shift();

				//and start the step
				currentStep.now(stepComplete, lastStepError, lastStepData);

				return self;
			}

			//start first step
			nextStep();
			return;
		};

		return self;
	}

	return FunctionFlow;
})();