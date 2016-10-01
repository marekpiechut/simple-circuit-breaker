const circuitBreaker = require('./simple-circuit-breaker')

const itShould = {
	equal: (expected) => (actual) => expect(actual).toEqual(expected),
	fail: fail
}

describe('Circuit Breaker', () => {
	it('calls asyncFn normally with no failures', (done) => {
		const async = () => Promise.resolve('success')
		const wrapped = circuitBreaker(async)
		
		wrapped()
			.then(wrapped)
			.then(wrapped)
			.then(itShould.equal('success'))
			.then(done)
	})
	
	it('stopps calling asyncFn after failure threshold is met', (done) => {
		const async = jasmine.createSpy().and.callFake(() => Promise.reject('error'))
		const wrapped = circuitBreaker(async, 1000, 2)
		
		wrapped()
			.then(itShould.fail, wrapped)
			.then(itShould.fail, wrapped)
			.then(itShould.fail, () => expect(async.calls.count()).toEqual(2))
			.then(done)
	})
	
	it('retries calling service after grace period', (done) => {
		const async = jasmine.createSpy().and.callFake(() => Promise.reject('error'))
		const wrapped = circuitBreaker(async, 50, 1)
		
		wrapped()
			.then(itShould.fail, wrapped)
			.then(itShould.fail, () => new Promise((resolve) => {
				setTimeout(resolve, 100)
			}))
			.then(wrapped)
			.then(itShould.fail, () => expect(async.calls.count()).toEqual(2))
			.then(done)
	})
	
	it('goes straight back to open when half open call failed', (done) => {
		const async = jasmine.createSpy().and.callFake(() => Promise.reject('error'))
		const wrapped = circuitBreaker(async, 50, 2)
		
		wrapped()
			.then(itShould.fail, wrapped)
			.then(itShould.fail, () => new Promise((resolve) => {
				setTimeout(resolve, 100)
			}))
			.then(wrapped)
			.then(itShould.fail, wrapped)
			.then(itShould.fail, () => expect(async.calls.count()).toEqual(3))
			.then(done)
	})
	
	it('resets threshold when succeeded in half open state', (done) => {
		let fail = true
		const stopFailing = () => fail = false
		const startFailing = () => fail = true
		
		const async = jasmine.createSpy().and.callFake(() => {
			return fail ? Promise.reject('error') : Promise.resolve('success')
		})
		const wrapped = circuitBreaker(async, 50, 2)
		
		wrapped()
			.then(itShould.fail, wrapped)
			.then(itShould.fail, () => new Promise((resolve) => {
				setTimeout(resolve, 100)
			}))
			.then(stopFailing)
			.then(wrapped)
			.then(startFailing)
			.then(wrapped)
			.then(itShould.fail, wrapped)
			.then(itShould.fail, () => expect(async.calls.count()).toEqual(5))
			.then(done)
	})
	
	it('throws error with configured message on fast fail', (done) => {
	const async = jasmine.createSpy().and.callFake(() => Promise.reject('error'))
	const wrapped = circuitBreaker(async, 50, 1, 'Fail fast!')
	
	wrapped()
		.then(itShould.fail, itShould.equal('error'))
		.then(wrapped)
		.then(itShould.fail, itShould.equal(Error('Fail fast!')))
		.then(done)
	})
})