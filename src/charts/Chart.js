import {select, selectAll} from 'd3-selection'
import {transition} from 'd3-transition'
import getDeviceType from "../utils/getDeviceType"

// Common chart functionality
class Chart{

	constructor(svg, margin, categories, h, w) {
		this.svg = svg
		this.initial = true
		this.margin = margin
		this.categories = categories
		this.width = w - this.margin.left - this.margin.right
	    this.height = h - this.margin.top - this.margin.bottom
		this.legend = null
		this.active = true
		this.t = transition().duration(1500)
		this.isMobile = getDeviceType() !== 'desktop'
	}

	createGraph(nodes){
		if (!this.g) {
			this.g = select(this.svg)
				.append("g")
				.attr("class", "graph")
			this.node = this.g.selectAll("circle")
		}
		this.g.transition(1000).attr("transform", "translate(0, 0), scale(1)")
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

	exit(){
		this.active = false
		selectAll(".legend").transition(2500).style("opacity", 0).remove()
	}
}

export {Chart}