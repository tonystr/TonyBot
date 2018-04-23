/* eslint complexity: ["warn", 29] */
/**
 * Parses a string for mathematical equations, and returns the answer
 * @param {Message} msg Discord message
 * @param {Array<string>} args Command arguments
*/
module.exports = function(msg, args) {
	args.shift();
	let string = args.reduce((a, b) => a + b);

	let variables = [];
	let callStack = [];
	let number = '';
	let stage  = 0;
	let stagemax = 1;
	let sign = 1;

	for (let i = 0; i < string.length; i++) {
		switch (string.charAt(i)) {

			// Operator
			case (string.charAt(i).match('[+\\-*/^%&|⊕]') || false).input: {
				let numset = false;
				if (number.length > 0) {
					variables.push(Number(number) * sign);
					sign = 1;
					number = '';
					numset = true;
				}

				let tertiary = string.charAt(i).match('\\^') && true;
				let secondary = string.charAt(i).match('[*/%&|⊕]') && true;
				let stg = (stage * 3) + Number(secondary) + (Number(tertiary) * 2);
				let operator = string.charAt(i);

				if (operator === '-') {
					sign = -1;
					operator = '+';
					if (!numset) operator = '';
				}

				if (operator) {
					callStack.push(stg + operator);
					stagemax = stg > stagemax ? stg : stagemax;
					console.log('operator');
				}
				break;
			}

			// Digit
			case (string.charAt(i).match('[0-9.]') || false).input:
				number += string.charAt(i);
				console.log('digit');
				break;

				// Paranthesises
			case '(': stage++; break;
			case ')': stage--;
				if (stage < 0) {
					return 'Error: Non-matched closing bracket(s)';
				}
				break;

			default: break;
		}
	}

	if (number) variables.push(Number(number) * sign);
	console.log('-----------');
	console.log(variables);
	console.log(callStack);

	for (stage = stagemax; stage >= 0; stage--) {
		if (callStack.length < 1) break;
		for (let i = 0; i < callStack.length; i++) {
			switch (callStack[i]) {
				case stage + '*': variables[i] *= Number(variables[i + 1]); callStack.splice(i, 1); variables.splice(i-- + 1, 1); break;
				case stage + '/': variables[i] /= Number(variables[i + 1]); callStack.splice(i, 1); variables.splice(i-- + 1, 1); break;
				case stage + '%': variables[i] %= Number(variables[i + 1]); callStack.splice(i, 1); variables.splice(i-- + 1, 1); break;
					// Bitwise operators
				case stage + '&': variables[i] &= Number(variables[i + 1]); callStack.splice(i, 1); variables.splice(i-- + 1, 1); break;
				case stage + '|': variables[i] |= Number(variables[i + 1]); callStack.splice(i, 1); variables.splice(i-- + 1, 1); break;
				case stage + '⊕': variables[i] ^= Number(variables[i + 1]); callStack.splice(i, 1); variables.splice(i-- + 1, 1); break;

				case stage + '+': variables[i] += Number(variables[i + 1]); callStack.splice(i, 1); variables.splice(i-- + 1, 1); break;
				case stage + '-': variables[i] -= Number(variables[i + 1]); callStack.splice(i, 1); variables.splice(i-- + 1, 1); break;

				case stage + '^': variables[i] = Math.pow(variables[i], Number(variables[i + 1])); callStack.splice(i, 1); variables.splice(i-- + 1, 1); break;
				default: break;
			}
			console.log(variables);
			console.log(callStack);
		}
	}

	return variables[0];
};
