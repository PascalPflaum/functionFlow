if (typeof (exports) !== 'undefined') {
	var chai = require('chai');
	var sinonChai = require("sinon-chai");
	var sinon = require('sinon');
	chai.use(sinonChai);

	var libpath = (process.env['FUNCTION_FLOW_COV'] ? 'cov/' : '');

	// The Lib we want to test
	var FunctionFlow = require('../../' + libpath + 'index.js');
}

chai.Assertion.includeStack = true; // defaults to false
var expect = chai.expect;

describe('creating instance', function() {
	it('should return an instance of functionFlow', function() {
		var flow = new FunctionFlow();
		expect(flow).to.be.a('object');
		expect(flow).to.be.an.instanceof(FunctionFlow);
	});
	it('should return an instance of functionFlow, even when called without "new"', function() {
		var flow = new FunctionFlow();
		expect(flow).to.be.a('object');
		expect(flow).to.be.an.instanceof(FunctionFlow);
	});
});

describe('methods without return value should return the flow', function() {

	function testMethod(methodName) {
		var flow = new FunctionFlow();
		expect(flow[methodName](function() {
		})).to.equal(flow);
	}

	it('flow.run', function() {
		testMethod('run');
	});

});
describe('ending methods should return undefined', function() {

	function testMethod(methodName) {
		var flow = new FunctionFlow();
		expect(flow[methodName]()).to.equal(undefined);
	}

	it('flow.now', function() {
		testMethod('now');
	});

});

describe('method order', function() {
	it('start without any step, calls only the given function', function() {
		var flow = new FunctionFlow();
		var flowDone = sinon.spy();

		flow.now(flowDone);
		expect(flowDone).to.be.calledOnce;
		expect(flowDone).always.have.been.calledWithExactly(undefined, undefined);
	});

	it('the done callback is not called, when a previous step does not call the callback', function() {
		var flow = new FunctionFlow();
		var flowDone = sinon.spy();
		var firstStep = sinon.spy();
		flow.run(firstStep).now(flowDone);
		expect(firstStep).to.be.calledOnce;
		expect(flowDone).to.be.not.called;
	});

	it('one single function has been added then start is called', function(done) {
		var flow = new FunctionFlow();
		var flowDone = sinon.spy(function() {
			expect(firstStep).to.be.calledOnce;
			expect(flowDone).to.be.calledOnce;
			expect(flowDone).always.have.been.calledWithExactly([undefined], [undefined]);
			done();
		});
		var firstStep = sinon.spy(function(flow) {
			setTimeout(function() {
				flow.done();
			});
		});

		flow.run(firstStep).now(flowDone);

	});
});

describe('errors', function() {
	it('a step throws an error', function(done) {
		var flow = new FunctionFlow();
		var flowDone = sinon.spy(function(error, data) {
			expect(error).to.have.length(1);
			error.forEach(function(err) {
				expect(err).to.be.an.instanceof(Error);
			});
			expect(data).to.have.length(1);
			data.forEach(function(dat) {
				expect(dat).to.be.undefined;
			});
			expect(firstStep).to.be.calledOnce;
			expect(flowDone).to.be.calledOnce;
			done();
		});
		var firstStep = sinon.spy(function(flow) {
			throw new ReferenceError('testError');
			setTimeout(function() {
				flow.done(undefined, true);
			});
		});

		flow.run(firstStep).now(flowDone);
	});

	it('a returned error stops the execution of a flow', function(done) {
		var flow = new FunctionFlow();
		var flowDone = sinon.spy(function(error, data) {
			expect(error).to.have.length(1);
			error.forEach(function(err) {
				expect(err).to.be.instanceof(Error);
			});
			expect(data).to.have.length(1);
			data.forEach(function(dat) {
				expect(dat).to.be.undefined;
			});
			expect(firstStep).to.be.calledOnce;
			expect(secondStep).to.not.be.called;
			expect(flowDone).to.be.calledOnce;
			done();
		});

		var firstStep = sinon.spy(function(flow) {
			setTimeout(function() {
				flow.done(new Error('TestError'), undefined);
			});
		});
		var secondStep = sinon.spy(function(flow) {
			setTimeout(function() {
				flow.done(undefined, true);
			});
		});

		flow.run(firstStep).run(secondStep).now(flowDone);
	});

	it('a thrown error stops the execution of a flow', function(done) {
		var flow = new FunctionFlow();
		var flowDone = sinon.spy(function(error, data) {
			expect(error).to.have.length(1);
			error.forEach(function(err) {
				expect(err).to.be.instanceof(Error);
			});
			expect(data).to.have.length(1);
			data.forEach(function(dat) {
				expect(dat).to.be.undefined;
			});
			expect(firstStep).to.be.calledOnce;
			expect(secondStep).to.not.be.called;
			expect(flowDone).to.be.calledOnce;
			done();
		});

		var firstStep = sinon.spy(function(flow) {
			throw new ReferenceError('TestError');
			setTimeout(function() {
				flow.done(undefined, true);
			});
		});
		var secondStep = sinon.spy(function(flow) {
			setTimeout(function() {
				flow.done(undefined, true);
			});
		});

		flow.run(firstStep).run(secondStep).now(flowDone);
	});

	describe('configuratable behavior of error handling', function() {
		var flow;
		var firstStepA;
		var firstStepB;
		var secondStep;

		beforeEach(function() {
			flow = new FunctionFlow();
			firstStepA = sinon.stub().throws(new ReferenceError('TestError'));
			firstStepB = sinon.spy(function(flow) {
				setTimeout(function() {
					flow.done(undefined, 'b');
				});
			});
			secondStep = sinon.spy(function(flow) {
				flow.done(undefined, '2');
			});
		});

		describe('default, #onErrorStopAfterStep(), parallel tasks are still all executed, even when one has an error', function() {

			var expections = function(error, data) {
				expect(error).to.have.length(2);
				expect(error[0]).to.be.instanceof(Error);
				expect(error[1]).to.be.undefined;
				expect(data).to.have.length(2);
				expect(data[0]).to.be.undefined;
				expect(data[1]).to.be.equal('b');
				expect(firstStepA).to.be.calledOnce;
				expect(firstStepB).to.be.calledOnce;
				expect(secondStep).to.not.be.called;
			};

			it('not called, default value', function(done) {
				var flowDone = sinon.spy(function(error, data) {
					expections(error, data);
					done();
				});

				flow.run(firstStepA).and(firstStepB).run(secondStep).now(flowDone);
			});

			it('after calling #onErrorStopAfterStep()', function(done) {
				var flowDone = sinon.spy(function(error, data) {
					expections(error, data);
					done();
				});

				flow.onErrorStopAfterStep().run(firstStepA).and(firstStepB).run(secondStep).now(flowDone);
			});
		});

		describe('#onErrorNeverStop()', function() {

			var expections = function(error, data) {
				expect(error).to.have.length(1);
				expect(error[0]).to.be.undefined;
				expect(data).to.have.length(1);
				expect(data[0]).to.be.equal('2');
				expect(firstStepA).to.be.calledOnce;
				expect(firstStepB).to.be.calledOnce;
				expect(secondStep).to.be.calledOnce;
			};

			it('an error doesn\'t stop the execution', function(done) {

				var flowDone = sinon.spy(function(error, data) {
					expections(error, data);
					done();
				});

				flow.onErrorNeverStop().run(firstStepA).and(firstStepB).run(secondStep).now(flowDone);
			});
		});

		describe('#onErrorStopASAP()', function() {

			it('when an error appeared, no new parallel task is started', function(done) {
				var errorFunc = sinon.stub().throws('Demo');
				var returningSync = sinon.spy(function(flow) {
					flow.done(undefined, 'Earth');
				});
//				setTimeout(function() {
//					expect(returningSync).to.be.calledOnce;
//					
//				});
				flow.onErrorStopASAP().run(returningSync).and(errorFunc).and(returningSync).now(function(error, data) {
					expect(returningSync).to.be.calledOnce;
					expect(errorFunc).to.be.calledOnce;
					expect(error[0]).to.be.undefined;
					expect(error[1]).to.be.instanceof(Error);
					expect(data[0]).to.be.equal('Earth');
					expect(data[1]).to.be.undefined;
					
					done();
				});
			});
		});
	});
});

describe('parsing arguments with "with"', function() {
	it('parsing one argument', function() {
		var flow = new FunctionFlow();

		var firstStep = sinon.spy(function(flow, parsedArgumentA) {

			expect(parsedArgumentA).to.be.equal('argumentTestA');
			flow.done();
		});
		flow.run(firstStep).with('argumentTestA').now(function() {
		});
	});

	it('parsing three argument', function() {
		var flow = new FunctionFlow();

		var firstStep = sinon.spy(function(flow, parsedArgumentA, b, c) {

			expect(parsedArgumentA).to.be.equal('argumentTestA');
			expect(b).to.be.equal(2);
			expect(c).to.be.equal(3);
			flow.done();
		});
		flow.run(firstStep).with('argumentTestA', 2, 3).now(function() {
		});
	});
});

describe('do for all', function() {
	it('calling with one element, single argument', function(done) {
		var flow = new FunctionFlow();
		var flowDone = sinon.spy(function(error, data) {
			expect(error).to.have.length(1);
			error.forEach(function(err) {
				expect(err).to.be.undefined;
			});
			expect(data).to.have.length(1);
			data.forEach(function(dat) {
				expect(dat).to.be.true;
			});
			expect(firstStep).to.be.calledOnce;
			done();
		});

		var firstStep = sinon.spy(function(flow, parsedArgumentA) {

			expect(parsedArgumentA).to.be.equal('argumentTestA');
			setTimeout(function() {
				flow.done(undefined, true);
			});
		});
		flow.run(firstStep).forEach(['argumentTestA']).now(flowDone);
	});

	it('calling with two element, single argument', function(done) {
		var flow = new FunctionFlow();
		var flowDone = sinon.spy(function(error, data) {
			expect(error).to.have.length(2);
			error.forEach(function(err) {
				expect(err).to.be.undefined;
			});
			expect(data).to.have.length(2);
			data.forEach(function(dat) {
				expect(dat).to.be.true;
			});
			expect(firstStep).to.be.calledTwice;
			done();
		});

		var run = 0;

		var firstStep = sinon.spy(function(flow, parsedArgumentA) {

			run++;
			if (run === 1) {
				var assumedArgument = 'argumentTestA';
			} else if (run === 2) {
				assumedArgument = 'argumentTestB';
			}
			expect(parsedArgumentA).to.be.equal(assumedArgument);
			setTimeout(function() {
				flow.done(undefined, true);
			});
		});

		flow.run(firstStep).forEach([['argumentTestA'], ['argumentTestB']]).now(flowDone);
	});
});


describe('data parsing to next step', function() {
	it('second step gets data of first step', function(done) {
		var flow = new FunctionFlow();
		var flowDone = sinon.spy(function(error, data) {
			expect(error).to.have.length(1);
			error.forEach(function(err) {
				expect(err).to.be.undefined;
			});
			expect(data).to.have.length(1);
			data.forEach(function(dat) {
				expect(dat).to.be.true;
			});
			expect(firstStep).to.be.calledOnce;
			expect(secondStep).to.be.calledOnce;
			expect(flowDone).to.be.calledOnce;
			done();
		});

		var firstStep = sinon.spy(function(flow) {
			setTimeout(function() {
				flow.done(undefined, false);
			});
		});
		var secondStep = sinon.spy(function(flow) {
			expect(flow.previousStep.error).to.have.length(1);
			flow.previousStep.error.forEach(function(err) {
				expect(err).to.be.undefined;
			});
			expect(flow.previousStep.data).to.have.length(1);
			flow.previousStep.data.forEach(function(dat) {
			});
			setTimeout(function() {
				flow.done(undefined, true);
			});
		});

		flow.run(firstStep).run(secondStep).now(flowDone);
	});



});

describe('data collecting', function() {
	describe('callback for start sums up data', function() {
		it('single step is giving back a boolean false', function(done) {
			var flow = new FunctionFlow();
			var flowDone = sinon.spy(function(error, data) {
				expect(error).to.have.length(1);
				error.forEach(function(err) {
					expect(err).to.be.undefined;
				});
				expect(data).to.have.length(1);
				data.forEach(function(dat) {
					expect(dat).to.be.false;
				});
				expect(firstStep).to.be.calledOnce;
				expect(flowDone).to.be.calledOnce;
				done();
			});
			var firstStep = sinon.spy(function(flow) {
				setTimeout(function() {
					flow.done(undefined, false);
				});
			});

			flow.run(firstStep).now(flowDone);
		});

		it('single step with two parallel run', function(done) {
			var flow = new FunctionFlow();
			var flowDone = sinon.spy(function(error, data) {
				expect(error).to.have.length(2);
				error.forEach(function(err) {
					expect(err).to.be.undefined;
				});
				expect(data).to.have.length(2);
				data.forEach(function(dat) {
					expect(dat).to.be.false;
				});
				expect(firstStep).to.be.calledTwice;
				expect(flowDone).to.be.calledOnce;
				done();
			});
			var firstStep = sinon.spy(function(flow) {
				setTimeout(function() {
					flow.done(undefined, false);
				});
			});

			flow.run(firstStep).and(firstStep).now(flowDone);
		});

		describe('result order in parallel run', function() {

			it('first attached function is faster', function(done) {
				var flow = new FunctionFlow();
				var flowDone = sinon.spy(function(error, data) {
					expect(error).to.have.length(2);
					error.forEach(function(err) {
						expect(err).to.be.undefined;
					});
					expect(data).to.have.length(2);
					expect(data[0]).to.be.false;
					expect(data[1]).to.be.true;

					expect(firstRun).to.be.calledOnce;
					expect(secondRun).to.be.calledOnce;
					expect(flowDone).to.be.calledOnce;
					done();
				});
				var firstRun = sinon.spy(function(flow) {
					setTimeout(function() {
						flow.done(undefined, false);
					});
				});
				var secondRun = sinon.spy(function(flow) {
					setTimeout(function() {
						flow.done(undefined, true);
					}, 50);
				});

				flow.run(firstRun).and(secondRun).now(flowDone);
			});

			it('second attached function is faster', function(done) {
				var flow = new FunctionFlow();
				var flowDone = sinon.spy(function(error, data) {
					expect(error).to.have.length(2);
					error.forEach(function(err) {
						expect(err).to.be.undefined;
					});
					expect(data).to.have.length(2);
					expect(data[0]).to.be.false;
					expect(data[1]).to.be.true;

					expect(firstRun).to.be.calledOnce;
					expect(secondRun).to.be.calledOnce;
					expect(flowDone).to.be.calledOnce;
					done();
				});
				var firstRun = sinon.spy(function(flow) {
					setTimeout(function() {
						flow.done(undefined, false);
					}, 50);
				});
				var secondRun = sinon.spy(function(flow) {
					setTimeout(function() {
						flow.done(undefined, true);
					});
				});

				flow.run(firstRun).and(secondRun).now(flowDone);
			});
		});
	});
});