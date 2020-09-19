import {select} from 'd3-selection'
import {scaleLinear, scaleBand} from 'd3-scale'
import {max} from 'd3-array'
import {axisBottom} from 'd3-axis'
import './Chart.scss'
import {Chart} from "./Chart"

class BeeSwarmChart extends Chart{


	constructor(svg, margin, categories, h, w) {
		super(svg, margin, categories, h, w)
		this.groups = []
		this.radius = 15
	}

	y = e => e.group

	x = e => {
		return e.number_of_unique_artists !== 0?
			e.total_number_of_artists / e.number_of_unique_artists : 0
    }

	createGraph(nodes){
		super.createGraph(nodes)

		// filter out 0 attributes from nodes
		this.filterNodes(nodes)

		// how many bands do we have on the y axis
		this.groups = [...new Set(this.nodes.map(e => this.y(e)))]

        this.xScale = scaleLinear()
            .domain([1, max(this.nodes, d => this.x(d))])
            .range([
            	this.margin.left,
	            this.width - this.margin.right - this.margin.left
            ])

        this.yScale = scaleBand()
            .domain(this.groups)
            .range([
            	this.margin.top,
	            this.height + this.margin.top - this.margin.bottom
            ])
		this.createLegend()
		// resize all nodes
		this.node.selectAll("circle")
			.transition(this.t)
			.attr("r", this.radius)

		// and hide labels
		this.node.selectAll("text")
			.transition(this.t)
			.style("opacity", "0")
			.style("display", "none")
			.text(d => d.id)
	}

	drawGraph = (nodes, clickHandler, selectedNodes) => {

		this.filterNodes(nodes)
		if (this.initial){
			this.calculateInitialPositions()
		}


		this.node = this.node.data(this.nodes, d => d.id)
		this.node.exit().remove()

		let newNode = this.node.enter()
			.append("g")

		this.node = this.node.merge(newNode)
	    // if we are transitioning from another chart:
		if (this.initial){
		    this.node.transition(this.t)
                .attr("transform", d => "translate("+d.x + "," + d.y+")")
		}

		this.highlightSelected(selectedNodes)
		this.initial = false
	}

	calculateInitialPositions = () => {
		// Calculate positions
		const stepBand = Math.floor(this.yScale.step()/this.radius)
		this.nodes.forEach((e, i) => {
			const offset = Math.floor(Math.random() * stepBand)
	        e.x  = this.xScale(this.x(e))
            e.y = this.yScale(this.y(e)) + offset * this.radius
		})
	}

	filterNodes = (nodes) => {
		const minDates = 10
		const minArtists = 20
		this.nodes = nodes.filter(e =>{
			return (
				this.x(e) !== 0 &&
				e.number_of_unique_artists > minArtists &&
				e.number_of_dates > minDates
			)
		})
	}

	createLegend(){
		const yOffset = this.height + this.margin.top - this.margin.bottom
		const translate = `translate(0, ${yOffset})`
		this.legend = select(this.svg)
			.append("g")
			.attr("class", "legend")
			.attr("transform", translate)
		const axis = axisBottom(this.xScale)
			.tickValues(this.xScale.ticks().concat(this.xScale.domain()))
		this.legend.call(axis)

		const labelOffset = `translate(0, ${this.margin.top + 20})`
		select(this.svg)
			.append("g")
			.attr("transform", labelOffset)
			.attr("class", "label legend")
			.append('text')
		    .text("Average number of bookings per artist by club in 2019");
	}
}

export {BeeSwarmChart}