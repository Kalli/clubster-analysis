import {select} from 'd3-selection'
import {scaleLinear, scaleBand} from 'd3-scale'
import {max} from 'd3-array'
import {axisBottom} from 'd3-axis'
import {transition} from 'd3-transition'
import './ClusterChart.scss'
import {fillColor} from "./ClusterChart"

class BeeSwarmChart{

	constructor(svg, margin, categories, h, w) {
		this.svg = svg
		this.initial = true
		this.margin = margin
		this.categories = categories
		this.width = w - this.margin.left - this.margin.right
	    this.height = h - this.margin.top - this.margin.bottom
		this.groups = []
		this.radius = 10
	}

	y = e => e.group

	x = e => {
		return e.number_of_unique_artists !== 0?
			e.total_number_of_artists / e.number_of_unique_artists : 0
    }

	createGraph(nodes){
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
            .range([this.margin.top, this.height + this.margin.top])

		if (!this.g){
			this.g = select(this.svg)
		        .attr("width", this.width)
				.attr("class", "graph")
	            .attr("height", this.height)
				.append("g")
				.attr("class", "nodes")
		}

		if (!this.node) {
			this.node = this.g.selectAll("circle")
			this.label = this.g.selectAll("label")
		}

	}

	drawGraph = (nodes, clickHandler, selectedNodes) => {
		this.filterNodes(nodes)
		if (this.initial){
			this.calculateInitialPositions()
		}

		const t = transition().duration(2500)

		// we don't show labels in this chart
		this.label.transition(t)
			.style("fill-opacity", 0)

		this.node = this.node.data(this.nodes, d => d.id)
		this.node.exit().transition(t).style("fill-opacity", 0).remove()

		let newNode = this.node.enter()
			.append("circle")
			.attr("fill", d => fillColor(d.group, this.categories))
			.attr("class", "nodes")
			.attr("cx", d => this.xScale(this.x(d)))
			.attr("cy", d => d.y)
			.attr("r", this.radius)
			.style("fill-opacity", "1")
			.on("click", d => clickHandler(d))

		this.node = this.node.merge(newNode)
	    // if we are transitioning from another chart:
	    this.node.transition(t)
            .attr("r", this.radius)
            .attr("cx", d => d.x)
            .attr("cy",d => d.y)

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
		const minDates = 0
		this.nodes = nodes.filter(e =>{
			return this.x(e) !== 0 && e.number_of_dates > minDates
		})
	}

	highlightSelected(selectedNodes){
		// highlight selected nodes if any
		this.g
			.selectAll(".nodes")
			.style("opacity", (d)=>{
				return selectedNodes.includes(d)? 0.6 : 1
			})
		this.g
			.selectAll(".label")
			.attr("text-decoration", (d)=>{
				return selectedNodes.includes(d)? "underline" : ""
			})
	}

	createLegend(){
		const translate = `translate(0, ${this.height-this.margin.bottom})`
		this.xAxis = select(this.svg)
			.append("g")
			.attr("transform", translate)
            .call(axisBottom(this.xScale))
	}

	exit(){
		this.xAxis.transition(2500).style("fill-opacity", 0).remove()
	}
}

export {BeeSwarmChart}