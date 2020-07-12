import {interpolateWarm} from 'd3-scale-chromatic'

function fillColor(category, categories){
	return interpolateWarm(
		categories.indexOf(category) / categories.length
	)
}

export {fillColor}
