// wrapper around chart classes that allows us to switch between them
// for transition purposes

class ChartWrapper{

	constructor(svg, margin, categories, h, w, ChartType) {
		this.svg = svg
		this.initial = true
		this.margin = margin
		this.categories = categories
		this.h = h
		this.w = w
		this.chart = new ChartType(svg, margin, categories, h, w)
	}

    setChartType(nodes, ChartType){
	    this.chart.exit()
        const newChart = new ChartType(
            this.svg, this.margin, this.categories, this.h, this.w
        )
        newChart.g = this.chart.g
        newChart.node = this.chart.node
        newChart.label = this.chart.label
	    newChart.initial = true
        newChart.createGraph(nodes)
        this.chart = newChart
    }

}

export {ChartWrapper}