Controller

## constructor

## rebind

This is never called by joss internally and is solely for your use when you're
sure you need it. Care has been taken to ensure that only events which might
see a difference are re-bound, without being too smart and wasting CPU cycles
deciding if it's *really* needed. Use this method when you have a binding which
employs the curly-brace syntax (e.g. `'{window} resize'`) and the delegation
target or bound target (between the `{}`) has been destroyed and subsequently
re-created, for example after an AJAX request.
