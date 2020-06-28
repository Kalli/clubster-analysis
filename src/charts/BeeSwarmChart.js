import {select} from 'd3-selection'
import {scaleLinear} from 'd3-scale'
import {max} from 'd3-array'
import {axisLeft, axisBottom} from 'd3-axis'
import {transition} from 'd3-transition'
import './ClusterChart.scss'
import {fillColor} from "./ClusterChart"

class BeeSwarmChart{

	constructor(svg, margin, categories, _, h, w) {
		this.svg = svg
		this.initial = true
		this.margin = margin
		this.categories = categories
		this.width = w - this.margin.left - this.margin.right
	    this.height = h - this.margin.top - this.margin.bottom
		this.groups = []
	}

	y = e => this.groups.indexOf(e.group) +1

	x = e => {
		return e.number_of_unique_artists !== 0?
			e.total_number_of_artists / e.number_of_unique_artists : 0
    }

	createGraph(nodes){
		// filter out 0 attributes from nodes
		this.groups = [...new Set(nodes
			.filter(e => this.x(e) !== 0)
			.map(e => e.group)
		)]

        this.xScale = scaleLinear()
            .domain([0.5, max(nodes, d => this.x(d))]).nice()
            .range([
            	this.margin.left,
	            this.width - this.margin.right - this.margin.left
            ])

        this.yScale = scaleLinear()
            .domain([0, this.groups.length])
            .range([this.height-this.margin.bottom, this.margin.top])

		nodes.forEach((e) => {
	        e.x  = this.xScale(this.x(e))
            e.y = this.yScale(this.y(e))
		})

		if (!this.g){
			this.g = select(this.svg)
		        .attr("width", this.width)
				.attr("class", "graph")
	            .attr("height", this.height)
				.append("g")
				.attr("class", "nodes")
		}

		const xAxis = `translate(0, ${this.height-this.margin.bottom})`
			select(this.svg)
			.append("g")
            .attr("transform", xAxis)
            .call(axisBottom(this.xScale))

		const yAxis =`translate(${this.margin.left}, ${0})`
		select(this.svg)
			.append("g")
            .attr("transform", yAxis)
            .call(
            	axisLeft(this.yScale).tickFormat(d => d).tickSizeOuter(0)
            )

		if (!this.node) {
			this.node = this.g.selectAll("circle")
			this.label = this.g.selectAll("label")
		}

	}

	drawGraph = (nodes, clickHandler, selectedNodes) => {
		nodes = nodes.filter(e => this.x(e) !== 0)
		const t = transition().duration(2500)

		this.node = this.node.data(nodes, d => d.id)
		this.node.exit().transition(t).style("fill-opacity", 0).remove()

		let newNode = this.node.enter()
			.append("circle")
			.attr("fill", d => fillColor(d.group, this.categories))
			.attr("class", "nodes")
			.attr("cx", d => this.xScale(this.x(d)))
			.attr("cy", d => this.yScale(this.y(d)))
			.attr("r", d => d.radius)
			.style("fill-opacity", "1")
			.on("click", d => clickHandler(d))

		this.node = this.node.merge(newNode)

		this.label = this.label.data(nodes, d=> d.id)
		this.label.exit().transition(t).style("opacity", 0).remove()
		let newLabel = this.label.enter()
			.append("text")
			.attr("text-anchor", "middle")
			.attr("class", "label")
			.style("fill", "#fff")
			.style("opacity", "1")
            .style("font-size", 12)
            .attr("dx", d => this.xScale(this.x(d)))
            .attr("dy",d => this.yScale(this.y(d)))
			// .text(d => fitTextToScreen(d.id, 30))
			.text(d => this.x(d).toFixed(2))

		this.label = this.label.merge(newLabel)

		this.highlightSelected(selectedNodes)
		this.initial = false
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



	createLegend(height, width){
	}

}

export {BeeSwarmChart}