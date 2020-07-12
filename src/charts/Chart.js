// Common chart functionality

class Chart{

	constructor(svg, margin, categories, h, w) {
		this.svg = svg
		this.initial = true
		this.margin = margin
		this.categories = categories
		this.width = w - this.margin.left - this.margin.right
	    this.height = h - this.margin.top - this.margin.bottom
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
}

export {Chart}