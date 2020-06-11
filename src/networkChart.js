import React, {Component} from 'react'
import './App.css'
import * as d3 from "d3"
import './networkChart.css';


class NetworkChart extends Component {

	constructor(props) {
        super(props)
        this.state = {
            selectedNode: null,
	        data: {}
        }
    }

	componentDidMount() {
		const graph = this.props.data
		graph.links = graph.links.filter((e) => e.weight > 0.05)

		const max = Math.max(...graph.links.map((d) => d.weight))
		const svg = this.refs.svg
		const width = 1000
		const height = 1000
		const simulation = d3
			.forceSimulation()
			.force(
				"link", d3.forceLink()
					.id(d => d.id)
					.distance((d)=>100*(d.weight/max))
			)
			.force("charge", d3.forceManyBody().strength(-100))
			.force("center", d3.forceCenter(width / 3, height / 3))
			.force("x", d3.forceX())
			.force("y", d3.forceY())

		this.drawGraph(svg, graph, simulation)
	}

	componentDidUpdate() {
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

		const node = d3
			.select(svg)
			.append("g")
			.attr("class", "nodes")
			.selectAll("circle")
			.data(graph.nodes)
			.enter()
			.append("circle")
			.attr("r", d => Math.sqrt(d.number_of_dates) * 2)
			.attr("fill", "red")
			.attr("stroke", "black")
			.attr("transform", "translate(0,0)")
			.call(
				d3
					.drag()
					.on("start", d => this.dragstarted(d, simulation))
					.on("drag", d => this.dragged(d))
					.on("end", d => this.dragended(d, simulation))
			)
			.on('click', this.onNodeClick)

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

	onNodeClick = (node) => {
		this.setState({selectedNode: node})
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

	mostCommonArtists(node){
		const sorted = Object.entries(node.artists)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)

		return <div>
			<h4>Most booked artists</h4>
			<ol>
				{sorted.map((e) => <li>{e[0]} - {e[1]}</li>)}
			</ol>
		</div>
	}

	mostSimilarClubs(node){
		const edges = this.props.data.links.filter((e) => {
			return (e.source.id === node.id || e.target.id === node.id)
		})
		.sort((a, b) => b.weight - a.weight)
		.slice(0, 5)
		.reduce((acc, e) => {
			const club = e.source.id !== node.id? e.source : e.target
			acc.push([club, e.weight])
			return acc
		}, [])
		return <div>
			<h4>Similar Clubs</h4>
			<ol>
				{edges.map((e) => <li>{e[0].id} - {(e[1]*100).toFixed()}%</li>)}
			</ol>
		</div>
	}

	render() {
		const node = this.state.selectedNode
		const nodeDisplay = !node? '' : <div>
			<h3>{node.id}</h3>
			<div>Number of events: {node.number_of_dates}</div>
			<div>Unique artists: {node.number_of_unique_artists}</div>
			<div>Total artists booked: {node.total_number_of_artists}</div>
			<div>
				Average bookings per artist:
				{(node.total_number_of_artists / node.number_of_unique_artists).toFixed(2)}
			</div>
			{this.mostCommonArtists(node)}
			{this.mostSimilarClubs(node)}
		</div>
		return <div className={'networkWrapper'}>
			<svg ref="svg" width={1000} height={700}/>
			<div>
				{nodeDisplay}
			</div>
		</div>

	}
}

export default NetworkChart