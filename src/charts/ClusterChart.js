import {forceSimulation, forceCenter, forceX, forceY} from "d3-force"
import {forceCollide} from "d3-force"
import {select, event} from 'd3-selection'
import {drag} from 'd3-drag'
import {zoom} from "d3-zoom"
import {timer} from "d3-timer"
import {fitTextToScreen} from "../textHandling"
import {fillColor} from "../lib"
import './Chart.scss'
import {Chart} from "./Chart"

class ClusterChart extends Chart{

	constructor(svg, margin, categories, h, w) {
		super(svg, margin, categories, h, w)
		this.clusters = {}
	}

	createGraph(nodes){
		super.createGraph(nodes)
		const padding = 1

		// offset mobile to the left, so the scrolly telling overlaps it less
		const x = this.width / 2 + (this.isMobile? 400 : 0)
		const y = this.height / 2 + (this.isMobile? 100 : 0)
		this.simulation = forceSimulation()
			.force('center', forceCenter(x, y))
			.force('x', forceX(x).strength(0.01))
			.force('y', forceY(y).strength(0.01))
			.force('cluster', this.cluster().strength(0.5))
			.force('collide', forceCollide(d => d.radius + padding))

		const zoomLevel = this.isMobile? 0.6 : 1
		this.zoomHandler = zoom()
			.scaleExtent([zoomLevel, zoomLevel])
			.filter(() => {
				if (this.isMobile ){
					// pan with two fingers on mobile
					return event.touches && event.touches.length > 1
				}
				return true
			})
			.on("zoom", () => this.zoom(this.g))
		select(this.svg).call(this.zoomHandler)

		this.decay()
		this.createLegend()
		// resize all nodes if we were coming from a different graph
		this.node.selectAll("circle")
			.transition(this.t)
			.attr("r", d => this.calculateRadius(d))

		// and show labels
		this.node.selectAll("text")
			.transition(this.t)
			.style("opacity", "1")
			.style("display", "block")
			.text(d => fitTextToScreen(d.id, d.radius))
	}

	decay = () => {
		const transitionTime = 3000
		const t = timer((elapsed) => {
	        var dt = elapsed / transitionTime
		    this.simulation
			    .force('collide')
			    .strength(Math.pow(dt, 2))
		    if (dt >= 1.0){
		        t.stop()
			    // disable forces for less jitter
			    this.simulation.force("x", null)
			    this.simulation.force("y", null)
			    this.simulation.force("center", null)
                this.simulation.force('cluster', this.cluster().strength(0.1))
		    }
		})
	}

	zoom = (zoomGroup) => {
		if (!this.active) return
		zoomGroup.attr("transform", event.transform)
	}

	drawGraph = (nodes, clickHandler, selectedNodes) => {
		// prevent nodes from jumping on filter operations
		if (!this.initial){
			this.simulation.stop()
		}
		// todo this mutates and is ugly
		if (this.initial){
			this.calculateInitialPositions(nodes)
		}

		this.node = this.node.data(nodes, d=> d.id)
		this.node.exit()
			.transition().duration(2000)
			.style("opacity", 0)
			.remove()

		let newNode = this.node.enter()
			.append("g")
			.on("click", d => {
				event.stopPropagation()
				clickHandler(d)
			})
			.call(drag()
					.on("start", d => this.dragstarted(d, this.simulation))
					.on("drag", d => this.dragged(d))
					.on("end", d => this.dragended(d, this.simulation))
			)


		newNode
			.append("circle")
			.attr("r", d => this.calculateRadius(d))
			.attr("fill", d => fillColor(d.group, this.categories))
			.attr("class", "nodes")
			.style("fill-opacity", this.initial? 1: 0)
			.transition().duration(2000).style("fill-opacity", 1)

		newNode
			.append("text")
			.attr("text-anchor", "middle")
			.attr("class", "label")
			.style("fill", "#fff")
			.style("cursor", "pointer")
			.style("opacity", 0)
            .style("font-size", 12)
			.text(d => fitTextToScreen(d.id, d.radius))
			.transition().duration(2000).style("opacity", 1)

		this.node = this.node.merge(newNode)

		if (!this.initial){
			// restart simulation so nodes wont get stuck on next filter
			this.simulation.alphaTarget(0.3).restart()
			setTimeout( () => {
				this.simulation.alphaTarget(0)
			}, 100)
			this.decay()
		}
		this.highlightSelected(selectedNodes)

		this.simulation
			.on('tick', this.tick)
			.nodes(nodes)
		this.initial = false
		if (this.isMobile){
			this.g.attr("transform", "scale(.60, .60)")
		}
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

			if (!this.clusters[g] || r > this.clusters[g]){
				this.clusters[e.group] = e
			}
		})
	}

	tick = () => {
		this.node
			.attr("transform", d => "translate("+d.x + "," + d.y+")")
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
		if (!this.active) return
		if (!event.active) simulation.alphaTarget(0.3).restart()
		d.fx = d.x
		d.fy = d.y
	}

	dragged = d => {
		if (!this.active) return
		d.fx = event.x
		d.fy = event.y
	}

	dragended = (d, simulation) => {
		if (!this.active) return
		if (!event.active) simulation.alphaTarget(0)
		d.fx = null
		d.fy = null
	}

	createLegend(){
		const sizes = [10000, 1000, 100, 10]
		const radiuses = sizes.map(e => {
			return this.calculateRadius({followers: e})
		})

		const x = 20
		const lineHeight = 30
		const y = this.height - 2.3 * Math.max(...radiuses)

		const translate = `translate(${x}, ${y})` + (
			!this.isMobile? "":" scale(.60, .60)"
		)

	    this.legend = select(this.svg)
	        .append("g")
			.attr("class", "legend")
	        .attr("x", x)
	        .attr("y", y)
	        .attr("transform", translate)
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
		super.exit()
		this.simulation.stop()
	}

	calculateRadius(e){
		// scale node radius according to svg size
		const factor = this.isMobile? 500 : 800
		const m = Math.min(this.width, this.height) / factor
		return 12 * Math.log(Math.sqrt(e.followers)) * m
	}

}



export {ClusterChart}