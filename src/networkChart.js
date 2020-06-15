import React, {Component} from 'react'
import './App.css'
import * as d3 from 'd3'
import {interpolateWarm} from 'd3-scale-chromatic'
import './networkChart.css';


class NetworkChart extends Component {

	width = 1000
	height = 1000
	margin = {top: 10, right: 20, bottom: 30, left: 50}

	constructor(props) {
		super(props)
		this.ref = React.createRef()
		this.state = {
			selectedNodes: [],
			data: {}
		}
	}

	componentDidMount() {
		// looks like the d3 functions in drawGraph are mutating data, deep copy
		const graph = JSON.parse(JSON.stringify(this.props.data))
		this.links = graph.links.filter((e) => e.weight >= 0.05)
		this.nodes = graph.nodes
		const regions =[...new Set(graph.nodes.map(e => e.name_region).sort())]

		this.regionColor = (regionName) => {
			return interpolateWarm(regions.indexOf(regionName) / regions.length)
		}

		const svg = this.ref.current
		this.createGraph(svg, graph)
		this.createLegend(svg, regions)
		this.drawGraph(this.nodes, this.links, [])
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

	createGraph = (svg, graph) => {
        const width = this.width - this.margin.left - this.margin.right
        const height = this.height - this.margin.top - this.margin.bottom

		const links = graph.links.filter((e) => e.weight >= 0.05)

		const max = Math.max(...links.map((d) => d.weight))

		this.g = d3.select(svg)
            .attr("width", width + this.margin.left + this.margin.right)
            .attr("height", height + this.margin.top + this.margin.bottom)
			.append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")
			.attr("class", "graph")

		this.simulation = d3
			.forceSimulation()
			.force(
				"link", d3.forceLink()
					.id(d => d.id)
					.distance((d) => 100 * (d.weight / max))
			)
			.force("charge", d3.forceManyBody().strength(-100))
			.force("center", d3.forceCenter(width / 2, height / 2))
			.force("x", d3.forceX())
			.force("y", d3.forceY())

		this.link = this.g
			.append("g")
			.attr("class", "links")
			.selectAll("line")

		this.node = this.g
			.append("g")
			.attr("class", "nodes")
			.selectAll("circle")

		this.label = this.g
			.append("g")
			.attr("class", "nodes")
			.selectAll("circle")

		const zoom_handler = d3
			.zoom()
			.scaleExtent([1, 10])
			.on("zoom", () => this.zoom(this.g))

		zoom_handler(d3.select(svg))
	}

	drawGraph = (nodes, links, selectedNodes) => {
		const transition = d3.transition().duration(750).ease(d3.easeLinear)

		this.link = this.link.data(links, d => d.id)
		this.link.exit()
			.transition(transition)
			.style("opacity", 0)
			.remove()
		let newLinks = this.link.enter()
			.append("line")
			.attr("stroke-width", 1)
			.attr("style", "stroke: #000000")
			.attr("transform", "translate(0,0)")


		this.link = this.link.merge(newLinks)

		this.node = this.node.data(nodes, d => d.id)
		this.node.exit()
			.transition(transition)
			.style("opacity", 0)
			.remove()

		let newNode = this.node.enter()
			.append("circle")
			.attr("r", d => Math.sqrt(d.number_of_dates) * 2)
			.attr("fill", d => this.regionColor(d.name_region))
			.attr("stroke", "black")
			.attr("transform", "translate(0,0)")
			.attr('id', (d) => 'id_'+d.club_id)
			.call(
				d3
					.drag()
					.on("start", d => this.dragstarted(d, this.simulation))
					.on("drag", d => this.dragged(d))
					.on("end", d => this.dragended(d, this.simulation))
			)
			.on('click', (node) => this.onNodeClick(node, links, this.g))

		newNode.append("title").text(d => d.id)
		newNode.transition(transition).style("opacity", 1)

		this.node = this.node.merge(newNode)

		this.label = this.label.data(nodes, d => d.id)
		this.label.exit().transition().remove()
		let newLabel = this.label.enter()
			.append("text")
			.text((d) => d.id)
			.attr("id", d => "text_id_"+d.club_id)
			.style("text-anchor", "middle")
			.style("fill", "#555")
			.style("font-family", "Arial")
			.style("font-size", 12)
			.style("display", "none")

		this.label = this.label.merge(newLabel)

		this.simulation.nodes(nodes).on("tick", () => this.ticked(
			this.link, this.node, this.label
		))
		this.simulation.force("link").links(links)
	}

	createLegend(svg, regions){
        const legend = d3.select(svg)
	        .append("g")
			.attr("class", "legend")

		// add nodes
		legend
		    .selectAll("rects")
		    .data(regions)
            .enter()
            .append("circle")
	            .attr("cx", this.margin.left / 2)
	            .attr("cy", (d, i) => (i+1) * 30)
	            .attr("r", 10)
	            .style("fill", this.regionColor)
				.on('click', (d) => this.onLegendClick(d))
				.style("cursor", "pointer")

		// add labels
		legend
			.selectAll("rects")
			.data(regions)
			.enter()
			.append("text")
	            .attr("x", 40)
	            .attr("y", (d, i) => (i+1) * 30)
		        .attr("text-anchor", "left")
	            .style("alignment-baseline", "middle")
	            .style("fill", this.regionColor)
	            .style("display", "block")
			    .text(d => d)
				.on('click', (d) => this.onLegendClick(d))
				.style("cursor", "pointer")
	}

	onLegendClick = (node) => {
		console.log(node)
	}

	zoom = (zoomGroup) => {
		zoomGroup.attr("transform", d3.event.transform)
	}

	onNodeClick = (node) => {
		// we allow max two selected nodes at a time
		let selectedNodes = (this.state.selectedNodes || [])
		const index = selectedNodes.indexOf(node)
		if (index !== -1){
			selectedNodes.splice(index, 1)
		}else{
			selectedNodes.push(node)
		}

		selectedNodes = selectedNodes.slice(-2)
		this.setState({selectedNodes: selectedNodes})

		if (selectedNodes.length < 2){
			this.drawGraph(this.nodes, this.links, selectedNodes)
			return
		}

		const filteredLinks = this.links.filter((e) => { return (
			selectedNodes.includes(e.source) ||
			selectedNodes.includes(e.target)
		)})

		const filteredNodes = [...filteredLinks.reduce((acc, e) => {
			acc.add(e.source)
			acc.add(e.target)
			return acc
		}, new Set())]

		this.drawGraph(filteredNodes, filteredLinks, selectedNodes)
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
				{sorted.map((e) => {
					return <li key={e[0]}>{this.artistLink(e[0])} - {e[1]}</li>
				})}
			</ol>
		</div>
	}

	mostSimilarClubs(node){
		const edges = this.props.data.links.filter((e) => {
			return (e.source === node.id || e.target === node.id)
		})
		.sort((a, b) => b.weight - a.weight)
		.slice(0, 5)
		.reduce((acc, e) => {
			const club = e.source !== node.id? e.source : e.target
			acc.push([club, e.weight])
			return acc
		}, [])
		return <div>
			<h4>Similar Clubs</h4>
			<ol>
				{edges.map((e) => {
					return <li key={e[0]}> {e[0]} - {(e[1]*100).toFixed()}%</li>
				})}
			</ol>
		</div>
	}

	artistLink(artistName){
		const artistId = ( this.props.data.artist_names_to_ids[artistName] ||
				artistName.toLowerCase().replace(' ', '')
		)
		return <a href={'https://www.residentadvisor.net/dj/' + artistId} target={'_blank'}>
			{artistName}
		</a>
	}

	showSimilarities(){
		if (this.state.selectedNodes.length !== 2){
			return ''
		}

		const artists = this.state.selectedNodes.reduce((acc, e) => {
			acc.push(Object.keys(e.artists))
			return acc
		}, [])
		const union = artists[0].filter(e => artists[1].includes(e))

		if (union.length === 0){
			return <div className={'similarities'}>
				<h4>No overlap in lineups - no common bookings</h4>
			</div>
		}

		const ids = this.state.selectedNodes.map(e => e.id)
		const overlap = (this.props.data.links.find(e => {
			return ids.includes(e.source) && ids.includes(e.target)
		}).weight * 100 ).toFixed(2)

		return <div className={'similarities'}>
			<h4>
				{overlap}% overlap in lineups - {union.length} common bookings:
			</h4>
			<ul>
				{union.map((e) => <li key={e}>{this.artistLink(e)}</li>)}
			</ul>
		</div>
	}

	showNodes(){
		return this.state.selectedNodes.map((e) => this.showNode(e))
	}

	showNode(node){
		const img = node.logo === '' ? <div className={'placeholder'}/> : <img
			src={'https://www.residentadvisor.net'+node.logo} alt={node.id}
		/>

		const link = 'https://www.residentadvisor.net/club.aspx?id=' + node.club_id
		return <div key={node.club_id}>
			<h3>
				<a target='_blank' href={link}>
					{img}
					{node.id}
				</a>
			</h3>
			
			<div>Number of events: {node.number_of_dates}</div>
			<div>Unique artists: {node.number_of_unique_artists}</div>
			<div>Total artists booked: {node.total_number_of_artists}</div>
			<div>
				Average bookings per artist:
				{(
					node.total_number_of_artists / node.number_of_unique_artists
				).toFixed(2)}
			</div>
			{this.mostCommonArtists(node)}
			{this.mostSimilarClubs(node)}
		</div>
	}

	render() {
		const selectedNodes = this.showNodes()
		const similarities = this.showSimilarities()
		return <div className={'networkWrapper'}>
			<svg ref={this.ref}  width={1000} height={700}/>
			<div className={'clubDetail'}>
				{selectedNodes}
				{similarities}
			</div>
		</div>

	}
}

export default NetworkChart