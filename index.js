const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'

function PromiseZ(fn) {
	this.status = PENDING
	this.value = void 0
	this.reason = void 0
	this.onFulfilledCallbacks = []
	this.onRejectedCallbacks = []
	const that = this
	function resolve(value) {
		if (that.status === PENDING) {
			that.status = FULFILLED
			that.value = value
			queueMicrotask(() => {
				that.onFulfilledCallbacks.forEach((cb) => cb(value))
			})
		}
	}

	function reject(err) {
		if (that.status === PENDING) {
			that.status = REJECTED
			that.reason = err
			// that.onRejectedCallback && that.onRejectedCallback(err)
			queueMicrotask(() => {
				that.onRejectedCallbacks.forEach((cb) => cb(reason))
			})
		}
	}

	try {
		fn(resolve, reject)
	} catch (e) {
		reject(e)
	}
}

PromiseZ.prototype.then = function (onFulfilled, onRejected) {
	const that = this
	const onFulfilledCallback =
		typeof onFulfilled === 'function' ? onFulfilled : (value) => value
	const onRejectedCallback =
		typeof onRejected === 'function'
			? onRejected
			: (reason) => {
					throw reason
			  }
	let promise2 = new PromiseZ((resolve, reject) => {
		if (that.status === FULFILLED) {
			queueMicrotask(() => {
				try {
					let x = onFulfilledCallback(that.value)
					// resolve(x)
					resolvePromise(promise2, x, resolve, reject)
				} catch (e) {
					reject(e)
				}
			})
		} else if (that.status === REJECTED) {
			queueMicrotask(() => {
				try {
					let x = onRejectedCallback(that.reason)
					// resolve(x)
					resolvePromise(promise2, x, resolve, reject)
				} catch (e) {
					reject(e)
				}
			})
		} else {
			that.onFulfilledCallbacks.push((val) => {
				try {
					let x = onFulfilledCallback(val)
					// resolve(x)
					resolvePromise(promise2, x, resolve, reject)
				} catch (e) {
					reject(e)
				}
			})
			that.onRejectedCallbacks.push((reason) => {
				try {
					let x = onRejectedCallback(reason)
					// resolve(x)
					resolvePromise(promise2, x, resolve, reject)
				} catch (e) {
					reject(e)
				}
			})
		}
	})
	return promise2
}

function resolvePromise(promise2, x, resolve, reject) {
	if (x === promise2) {
		reject(new TypeError('chaining cycle'))
	} else if ((typeof x === 'object' && x) || typeof x === 'function') {
		let called
		try {
			let then = x.then
			if (typeof then === 'function') {
				then.call(
					x,
					(y) => {
						if (called) return
						called = true
						resolvePromise(promise2, y, resolve, reject)
					},
					(r) => {
						if (called) return
						called = true
						reject(r)
					}
				)
			} else {
				if (called) return
				called = true
				resolve(x)
			}
		} catch (e) {
			if (called) return
			called = true
			reject(e)
		}
	} else {
		resolve(x)
	}
}
