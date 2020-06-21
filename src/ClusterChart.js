import {forceSimulation, forceCenter, forceX, forceY} from "d3-force"
import {select, event} from 'd3-selection'
import {drag} from 'd3-drag'
import {transition} from 'd3-transition'
import {forceCollide} from "d3-force"
import {zoom} from "d3-zoom"
import {timer} from "d3-timer"
import {fitTextToScreen} from "./textHandling"
import {interpolateWarm} from 'd3-scale-chromatic'


class ClusterChart{

	constructor(svg, margin, categories, clusters) {
		this.svg = svg
		this.initial = true
		this.margin = margin
		this.categories = categories
		this.clusters = clusters
	}

	createGraph(nodes, h, w){
	    const width = w - this.margin.left - this.margin.right
	    const height = h - this.margin.top - this.margin.bottom
		const padding = 1

		this.simulation = forceSimulation()
			.force('center', forceCenter(width/2, height/2))
			.force('x', forceX(width / 2).strength(0.01))
			.force('y', forceY(height / 2).strength(0.01))
			.force('cluster', this.cluster().strength(0.5))
			.force('collide', forceCollide(d => d.radius + padding))

		const translateX = w - width
		const translateY = h - height
		const translate = `translate(${translateX}, ${translateY})`
		this.g = select(this.svg)
	        .attr("width", width + this.margin.left + this.margin.right)
	        .attr("height", height + this.margin.top + this.margin.bottom)
			.append("g")
	        .attr("transform", translate)
			.attr("class", "nodes")

		this.node = this.g.selectAll("circle")
		this.label = this.g.selectAll("text")

		this.simulation
			.on('tick', this.tick)
			.nodes(nodes)

		const zoom_handler = zoom()
			.scaleExtent([0, 10])
			.on("zoom", () => this.zoom(this.g))

		select(this.svg).call(zoom_handler).on("wheel.zoom", null)
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

	drawGraph = (nodes, clickHandler) => {
		const t = transition().duration(1500)
		const labelTransition = transition().duration(2500)

		this.node = this.node.data(nodes, d=> d.id)
		this.node.exit().transition(t).style("opacity", 0).remove()

		let newNode = this.node
			.enter()
			.append("circle")
			.attr("r", d => d.radius)
			.attr("fill", d => fillColor(d.group, this.categories))
			.attr("class", "nodes")
			.style("opacity", this.initial? "1": "0")
			.call(drag()
					.on("start", d => this.dragstarted(d, this.simulation))
					.on("drag", d => this.dragged(d))
					.on("end", d => this.dragended(d, this.simulation))
			)
			.on("click", d => clickHandler(d))
			.transition(t).style("opacity", 1)

		this.node = this.node.merge(newNode)

		this.label = this.label.data(nodes, d=> d.id)
		this.label.exit().transition(t).style("opacity", 0).remove()
		let newLabel = this.label.enter()
			.append("text")
			.attr("text-anchor", "middle")
			.style("fill", "#fff")
			.style("opacity", "0")
            .style("font-size", 12)
			.text(d => fitTextToScreen(d.id, d.radius))
			.on("click", d => clickHandler(d))
			.transition(labelTransition).style("opacity", 1)

		newLabel.transition(t).style("opacity", 1)
		this.label = this.label.merge(newLabel)
		if (!this.initial){
			// restart simulation so nodes wont get stuck on next filter
			this.simulation.alphaTarget(0.3).restart()
			this.simulation.alphaTarget(0)
		}
		this.initial = false
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

	createLegend(height, width){
		const sizes = [10000, 1000, 100, 10]
		const radiuses = sizes.map(e => {
			return calculateRadius({followers: e}, height, width)
		})

		const x = 10
		const lineHeight = 30
		const paddingBottom = 10
		const y = height - 2 * Math.max(...radiuses) - lineHeight - paddingBottom

	    const legend = select(this.svg)
	        .append("g")
			.attr("class", "legend")
	        .attr("x", x)
	        .attr("y", y)
	        .attr("transform", `translate(${x}, ${y})`)
	        .style("text-align", "center")

		const max = Math.max(...radiuses)
		// add nodes
		legend.selectAll("rects")
		.data(radiuses)
		.enter()
		.append("circle")
		    .attr("cx", max)
		    .attr("cy", d => 2 * max - (d) + 0.5*lineHeight)
		    .attr("r", d => d)
			.attr("fill", "white")
			.attr("stroke", "black")
			.attr("alignment-baseline", "middle")

		legend.selectAll("rects")
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

		legend.append('text')
			.text("RA club followers")
			.attr("text-anchor", "start")
			.attr("x", 0)
			.attr("y", 2 * max + lineHeight)
	}
}

function calculateRadius(e, height, width){
	// scale node radius according to svg size
	const m = Math.min(width, height) / 800
	return 12 * Math.log(Math.sqrt(e.followers)) * m
}

function fillColor(category, categories){
	return interpolateWarm(
		categories.indexOf(category) / categories.length
	)
}

export {ClusterChart, fillColor, calculateRadius}