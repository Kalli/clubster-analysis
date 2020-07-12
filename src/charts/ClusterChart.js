import {forceSimulation, forceCenter, forceX, forceY} from "d3-force"
import {forceCollide} from "d3-force"
import {select, event} from 'd3-selection'
import {drag} from 'd3-drag'
import {transition} from 'd3-transition'
import {zoom} from "d3-zoom"
import {timer} from "d3-timer"
import {fitTextToScreen} from "../textHandling"
import {interpolateWarm} from 'd3-scale-chromatic'
import './ClusterChart.scss'
import {Chart} from "./Chart"


class ClusterChart extends Chart{

	constructor(svg, margin, categories, h, w) {
		super(svg, margin, categories, h, w)
		this.clusters = {}
	}

	createGraph(nodes){
		const padding = 1

		this.simulation = forceSimulation()
			.force('center', forceCenter(this.width/2, this.height/2))
			.force('x', forceX(this.width / 2).strength(0.01))
			.force('y', forceY(this.height / 2).strength(0.01))
			.force('cluster', this.cluster().strength(0.5))
			.force('collide', forceCollide(d => d.radius + padding))

		if (!this.g) {
			const translateX = this.margin.left + this.margin.right
			const translateY = this.margin.top + this.margin.bottom
			const translate = `translate(${translateX}, ${translateY})`
			this.g = select(this.svg)
				.attr("width", this.width + this.margin.left + this.margin.right)
				.attr("height", this.height + this.margin.top + this.margin.bottom)
				.append("g")
				.attr("transform", translate)
				.attr("class", "nodes")
			this.node = this.g.selectAll("circle")
			this.label = this.g.selectAll("text")
		}

		this.zoomHandler = zoom()
			.scaleExtent([0, 10])
			.on("zoom", () => this.zoom(this.g))

		select(this.svg).call(this.zoomHandler).on("wheel.zoom", null)
		select(this.svg).call(this.zoomHandler).on("dblclick.zoom", null)

		const transitionTime = 3000
		var t = timer((elapsed) => {
	        var dt = elapsed / transitionTime
		    this.simulation
			    .force('collide')
			    .strength(Math.pow(dt, 2))
		    if (dt >= 1.0){
		        t.stop()
			    // disable x and y for less jitter
			    this.simulation.force("x", null)
			    this.simulation.force("y", null)
		    }
		})
	}

	zoom = (zoomGroup) => {
		zoomGroup.attr("transform", event.transform)
	}

	drawGraph = (nodes, clickHandler, selectedNodes) => {
		// todo this mutates and is ugly
		this.calculateInitialPositions(nodes)
		const t = transition().duration(1500)
		const labelTransition = transition().duration(2500)

		this.node = this.node.data(nodes, d=> d.id)
		this.node.exit().transition(t).style("fill-opacity", 0).remove()

		let newNode = this.node.enter()
			.append("circle")
			.attr("r", d => d.radius)
			.attr("fill", d => fillColor(d.group, this.categories))
			.attr("class", "nodes")
			.style("fill-opacity", this.initial? "1":"0")
			.call(drag()
					.on("start", d => this.dragstarted(d, this.simulation))
					.on("drag", d => this.dragged(d))
					.on("end", d => this.dragended(d, this.simulation))
			)
			.on("click", d => clickHandler(d))
			.transition(t).style("fill-opacity", 1)

		this.node = this.node.merge(newNode)

		this.label = this.label.data(nodes, d=> d.id)
		this.label.exit().transition(t).style("opacity", 0).remove()
		let newLabel = this.label.enter()
			.append("text")
			.attr("text-anchor", "middle")
			.attr("class", "label")
			.style("fill", "#fff")
			.style("opacity", "0")
            .style("font-size", 12)
			.text(d => fitTextToScreen(d.id, d.radius))
			.on("click", d => clickHandler(d))
			.transition(labelTransition).style("opacity", 1)

		this.label = this.label.merge(newLabel)

		if (!this.initial){
			// restart simulation so nodes wont get stuck on next filter
			this.simulation.alphaTarget(0.3).restart()
			this.simulation.alphaTarget(0)
		}
		this.highlightSelected(selectedNodes)

		this.simulation
			.on('tick', this.tick)
			.nodes(nodes)
		this.initial = false
	}

	calculateInitialPositions = (nodes) => {
		const radius = Math.min(this.width, this.height) / 2
		const groupCount = Math.max(...nodes.map(e => e.group))
		this.clusters = new Array(groupCount)
		nodes.forEach((e) => {
			// position along a circle, clustered by group
			const g = e.group
			const angle = g / groupCount * 2 * Math.PI
	        e.x  = Math.cos(angle) * radius + this.width / 2 + Math.random()
            e.y = Math.sin(angle) * radius + this.height / 2 + Math.random()

			// set the radius of each node
			const r = this.calculateRadius(e)
			e.radius = r

			if (!this.clusters[g] || r > this.clusters[g]) this.clusters[e.group] = e
		})
	}

	tick = () => {
		this.node
			.attr("cx", d => d.x)
			.attr("cy", d => d.y)
			.attr("r", d => d.radius)
		this.label
            .attr("dx", d => d.x )
	        .attr("dy", d => d.y)
	}

	cluster = () => {
		// adapted from
		// https://bl.ocks.org/ericsoco/38b4f8b51ecf116e6fb0727d25687e8e
		let nodes,
			strength = 0.1

		const force = (alpha) => {
			// scale + curve alpha value
			alpha *= strength * alpha

			nodes.forEach((d) => {
				let cluster = this.clusters[d.group]
				if (cluster === d) return
				let x = d.x - cluster.x,
					y = d.y - cluster.y,
					l = Math.sqrt(x * x + y * y),
					r = d.radius + cluster.radius

				if (l !== r) {
					l = (l - r) / l * alpha
					d.x -= x *= l
					d.y -= y *= l
					cluster.x += x
					cluster.y += y
				}
			})
		}

		force.initialize = function (_) {
			nodes = _
		}

		force.strength = _ => {
			strength = _ == null ? strength : _
			return force
		}

		return force
	}

	dragstarted = (d, simulation) => {
		if (!event.active) simulation.alphaTarget(0.3).restart()
		d.fx = d.x
		d.fy = d.y
	}

	dragged = d => {
		d.fx = event.x
		d.fy = event.y
	}

	dragended = (d, simulation) => {
		if (!event.active) simulation.alphaTarget(0)
		d.fx = null
		d.fy = null
	}

	createLegend(){
		const sizes = [10000, 1000, 100, 10]
		const radiuses = sizes.map(e => {
			return this.calculateRadius({followers: e})
		})

		const x = 10
		const lineHeight = 30
		const paddingBottom = 10
		const y = this.height - 2 * Math.max(...radiuses) - lineHeight - paddingBottom

	    this.legend = select(this.svg)
	        .append("g")
			.attr("class", "legend")
	        .attr("x", x)
	        .attr("y", y)
	        .attr("transform", `translate(${x}, ${y})`)
	        .style("text-align", "center")

		const max = Math.max(...radiuses)
		// add nodes
		this.legend.selectAll("rects")
		.data(radiuses)
		.enter()
		.append("circle")
		    .attr("cx", max)
		    .attr("cy", d => 2 * max - (d) + 0.5*lineHeight)
		    .attr("r", d => d)
			.attr("fill", "white")
			.attr("stroke", "black")
			.attr("alignment-baseline", "middle")

		this.legend.selectAll("rects")
		.data(radiuses)
		.enter()
		.append("text")
		    .attr("x", max)
		    .attr("y", (d, i) => {
		        // this is messy, but the best looking option I could find
			    // smallest circle is labelled in center, others at the top
		        if (i === 0){
		            return 2 * max - 1.4 * d
			    }
		        if (i === 1){
		            return 2 * max - 1.2 * d
			    }
		        return 2 * max - (d) + 0.5*lineHeight
		    })
			.text((d, i) => sizes[i])
			.attr("text-anchor", "middle")

		this.legend
			.append('text')
			.text("RA Club Followers")
			.attr("text-anchor", "middle")
			.attr("x", max)
			.attr("y", 2 * max + lineHeight)
	}

	exit(){
		this.simulation.stop()
		this.legend.transition(2500).style("fill-opacity", 0).remove()
		this.zoomHandler.on(".zoom", null)
	}

	calculateRadius(e){
		// scale node radius according to svg size
		const m = Math.min(this.width, this.height) / 800
		return 12 * Math.log(Math.sqrt(e.followers)) * m
	}

}

function fillColor(category, categories){
	return interpolateWarm(
		categories.indexOf(category) / categories.length
	)
}

export {ClusterChart, fillColor}