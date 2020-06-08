import React, {Component} from 'react'
import './App.css'
import * as d3 from "d3"


class NetworkChart extends Component {

	componentDidMount() {
		const svg = this.refs.svg
		const width = 800
		const height = 800
		const simulation = d3
			.forceSimulation()
			.force("link", d3.forceLink().id(d => d.id))
			.force("charge", d3.forceManyBody().strength(-60))
			.force("center", d3.forceCenter(width / 3, height / 3))
			.force("x", d3.forceX())
			.force("y", d3.forceY())

		const graph = this.props.data
		this.drawGraph(svg, graph, simulation)
	}

	componentDidUpdate() {
		this.createNetworkChart()
	}

	dragstarted = (d, simulation) => {
		if (!d3.event.active) simulation.alphaTarget(0.3).restart()
		d.fx = d.x
		d.fy = d.y
	}

	dragged = d => {
		d.fx = d3.event.x
		d.fy = d3.event.y
	}

	dragended = (d, simulation) => {
		if (!d3.event.active) simulation.alphaTarget(0)
		d.fx = null
		d.fy = null
	}

	drawGraph = (svg, graph, simulation) => {
		const node = d3
			.select(svg)
			.append("g")
			.attr("class", "nodes")
			.selectAll("circle")
			.data(graph.nodes)
			.enter()
			.append("circle")
			.attr("r", d => d.size/50)
			.attr("fill", "red")
			.attr("transform", "translate(0,0)")
			.call(
				d3
					.drag()
					.on("start", d => this.dragstarted(d, simulation))
					.on("drag", d => this.dragged(d))
					.on("end", d => this.dragended(d, simulation))
			)

		const link = d3
			.select(svg)
			.append("g")
			.attr("class", "links")
			.selectAll("line")
			.data(graph.links)
			.enter()
			.append("line")
			.attr("stroke-width", 1)
			.attr("style", "stroke: #000000")
			.attr("transform", "translate(0,0)")

		const label = d3
			.select(svg)
			.append("g")
			.attr("class", "nodes")
			.selectAll("circle")
			.data(graph.nodes)
			.enter()
			.append("text")
			.text((d) => d.id)
		    .style("text-anchor", "middle")
		    .style("fill", "#555")
		    .style("font-family", "Arial")
		    .style("font-size", 12)


		node.append("title").text(d => {
			return d.id
		}).attr('dx',12).attr("dy", ".35em")

		simulation.nodes(graph.nodes).on("tick", () => this.ticked(link, node, label))
		simulation.force("link").links(graph.links)
	}

	ticked = (link, node, label) => {
		node.attr("cx", d => d.x * 1).attr("cy", d => d.y * 1)
		link
			.attr("x1", d => d.source.x * 1)
			.attr("y1", d => d.source.y * 1)
			.attr("x2", d => d.target.x * 1)
			.attr("y2", d => d.target.y * 1)
        label
	        .attr("x", function(d){ return d.x; })
            .attr("y", function (d) {return d.y - 10; });
	}

	render() {
		return <svg
			ref="svg"
			width={500}
			height={500}
        >
		</svg>
	}
}

export default NetworkChart