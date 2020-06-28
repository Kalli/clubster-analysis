// wrapper around chart classes that allows us to switch between them
// for transition purposes
import {ClusterChart} from "./ClusterChart"


class ChartWrapper{

	constructor(svg, margin, categories, clusters, h, w) {
		this.svg = svg
		this.initial = true
		this.margin = margin
		this.categories = categories
		this.clusters = clusters
		this.h = h
		this.w = w
		this.chart = new ClusterChart(svg, margin, categories, clusters, h, w)
	}

}

export {ChartWrapper}