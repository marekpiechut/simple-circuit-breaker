# simple-circuit-breaker
Simple JavaScript (**ES6**) circuit breaker wrapper for functions returning Promises.
No dependencies. Just plain ES6.

Module has configurable grace period, threshold and error message.
It simply wraps any function that return promise.

More information about circuit breakers: [Circuit Breakers](http://marekpiechut.github.io/2016/09/16/circuit-breakers.html)

# Usage

## Basic usage with defaults

```javascript
const circuitBreaker = require('simple-circuit-breaker')

function callBackend(url) {
  return fetch(url)
    .then(parseResponse)
}

const withCircuitBreaker = circuitBreaker(callBackend)

withCircuitBreaker('http://my.backend.com')
  .then(doSomethingWithData, handleError)
```

## Passing configuration options
*Parameters*

1. asyncFn - Function that we want to guard with circuit breaker **Must return a `Promise`** 
2. gracePeriodMs - How long do we wait before retrying after switched to **CLOSED** state
3. threshold - How many failures do we need to stop calling backend and start failing immediately - **HALF OPEN**
4. message - This will be the error message in **OPEN** state

```javascript
const withCircuitBreaker = circuitBreaker(callBackend, 15000, 3, 'Damn, it failed too many times!')
```

## Default values
- gracePeriodMs = 3000
- threshold = 1
- message = 'Functionality disabled due to previous errors.'
