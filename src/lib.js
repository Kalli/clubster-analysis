import {interpolateWarm} from 'd3-scale-chromatic'

function fillColor(category, categories){
	return interpolateWarm(
		categories.indexOf(category) / categories.length
	)
}

const factorial = (n) => !(n > 1) ? 1 : factorial(n - 1) * n;

export {fillColor, factorial}
