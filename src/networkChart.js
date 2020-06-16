import React, {Component} from 'react'
import './App.css'
import * as d3 from 'd3'
import {interpolateWarm} from 'd3-scale-chromatic'
import './networkChart.css';
import {fitTextToScreen} from './textHandling'


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
		this.nodes = graph.nodes

		// sort so adjacent groups get different colors
		this.categories = [
			...new Set(graph.nodes.map(e => e.group).sort((a, b) => {
				return a % 2 - b % 2 || a - b
			}))
		]

		const groupCount = Math.max(...graph.nodes.map(e => e.group))
		const clusters = new Array(groupCount)

		// add positioning data for initial position to help clustering
		this.nodes.forEach((e) => {
			// position along a circle, clustered by group
			const radius = Math.min(this.width, this.height) / 4
			const g = e.group
			const angle = g / groupCount * 2 * Math.PI
	        e.x  = Math.cos(angle) * radius + this.width / 2 + Math.random()
            e.y = Math.sin(angle) * radius + this.height / 2 + Math.random()

			// set the radius of each node
			const r = 250 * Math.log(e.followers)
			e.radius = Math.sqrt(r)

			if (!clusters[g] || r > clusters[g]) clusters[e.group] = e
		})

		this.clusters = clusters
		const svg = this.ref.current
		this.createGraph(svg)
		this.createLegend(svg)
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

	fillColor = (category) => {
		return interpolateWarm(
			this.categories.indexOf(category) / this.categories.length
		)
	}

	createGraph = (svg) => {
        const width = this.width - this.margin.left - this.margin.right
        const height = this.height - this.margin.top - this.margin.bottom
		const padding = 1

		this.simulation = d3
			.forceSimulation()
			.force('center', d3.forceCenter(width/2, height/2))
			.force('x', d3.forceX(width / 2).strength(0.01))
			.force('y', d3.forceY(height / 2).strength(0.01))
			.force('cluster', this.cluster().strength(1))
			.force('collide', d3.forceCollide(d => d.radius + padding))
			.on('tick', this.tick)
			.nodes(this.nodes)

		this.g = d3.select(svg)
            .attr("width", width + this.margin.left + this.margin.right)
            .attr("height", height + this.margin.top + this.margin.bottom)
			.append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")
			.attr("class", "graph")
			.attr("class", "nodes")
			.selectAll("g")
			.data(this.nodes)
			.enter()
			.append("g")

		this.node = this.g
			.append("circle")
			.attr("r", d => d.radius)
			.attr("fill", d => this.fillColor(d.group))
			.attr("class", "nodes")
			.call(
				d3
				.drag()
					.on("start", d => this.dragstarted(d, this.simulation))
					.on("drag", d => this.dragged(d))
					.on("end", d => this.dragended(d, this.simulation))
			)
			.on("click", d => this.onNodeClick(d))

		this.label = this.g.append("text")
			.attr("text-anchor", "middle")
			.style("fill", "#fff")
            .style("font-size", 12)
			.text(d => fitTextToScreen(d.id, d.radius))
			.on("click", d => this.onNodeClick(d))

		const zoom_handler = d3
			.zoom()
			.scaleExtent([1, 10])
			.on("zoom", () => this.zoom(this.g))

		zoom_handler(d3.select(svg))
		var transitionTime = 3000;
		var t = d3.timer((elapsed) => {
	        var dt = elapsed / transitionTime
		    this.simulation
			    .force('collide')
			    .strength(Math.pow(dt, 2) * 1)
		    if (dt >= 1.0) t.stop()
		})
	}

	createLegend(svg){
        const legend = d3.select(svg)
	        .append("g")
			.attr("class", "legend")

		// add nodes
		legend
		    .selectAll("rects")
		    .data(this.categories)
            .enter()
            .append("circle")
	            .attr("cx", this.margin.left / 2)
	            .attr("cy", (d, i) => (i+1) * 30)
	            .attr("r", 10)
	            .style("fill", this.fillColor)
				.on('click', (d) => this.onLegendClick(d))
				.style("cursor", "pointer")

		// add labels
		legend
			.selectAll("rects")
			.data(this.categories)
			.enter()
			.append("text")
	            .attr("x", 40)
	            .attr("y", (d, i) => (i+1) * 30)
		        .attr("text-anchor", "left")
	            .style("alignment-baseline", "middle")
	            .style("fill", this.fillColor)
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
			strength = 0.1;

		const force = (alpha) => {
			// scale + curve alpha value
			alpha *= strength * alpha;

			nodes.forEach((d) => {
				let cluster = this.clusters[d.group]
				if (cluster === d) return
				let x = d.x - cluster.x,
					y = d.y - cluster.y,
					l = Math.sqrt(x * x + y * y),
					r = d.radius + cluster.radius;

				if (l !== r) {
					l = (l - r) / l * alpha;
					d.x -= x *= l;
					d.y -= y *= l;
					cluster.x += x;
					cluster.y += y;
				}
			});
		}

		force.initialize = function (_) {
			nodes = _;
		}

		force.strength = _ => {
			strength = _ == null ? strength : _;
			return force;
		};

		return force;
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
			return e.weight > 0 && [e.source, e.target].includes(node.id)
		})
		.sort((a, b) => b.weight - a.weight)
		.slice(0, 5)
		.reduce((acc, e) => {
			const club = e.source !== node.id? e.source : e.target
			acc.push([club, e.weight])
			return acc
		}, [])
		if (edges.length === 0 ){
			return <h4>No Similar Clubs</h4>
		}
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

	showClubs(){
		return this.state.selectedNodes.map((e) => this.showClub(e))
	}

	showClub(node){
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
			<div>Region: {node.name_region}</div>
			<div>Followers: {node.followers}</div>
			<div>
				Average RA user attendance per event:
				{" " + (
					node.attending / node.number_of_dates
				).toFixed(0)}
			</div>
			<div>
				Average bookings per artist:
				{" " +(
					node.total_number_of_artists / node.number_of_unique_artists
				).toFixed(2)}
			</div>			<div>
				Average artists per date:
				{" " +(
					node.total_number_of_artists / node.number_of_dates
				).toFixed(2)}
			</div>
			{this.mostCommonArtists(node)}
			{this.mostSimilarClubs(node)}
		</div>
	}

	showCommunity(){
		if (this.state.selectedNodes.length !== 1 ){
			return ""
		}
		const club = this.state.selectedNodes[0]
		const groupClubs = this.props.data.nodes.filter(e => {
			return club.group === e.group
		})
		if (groupClubs.length === 1){
			return ""
		}
		return <div>
			<div className={'placeholder'}/>
			<h4>Other clubs in this group</h4>
			<ul>
				{groupClubs.map((e) => {
					return <li key={e.id}> {e.id} </li>
				})}
			</ul>
		</div>
	}

	render() {
		const selectedNodes = this.showClubs()
		const community = this.showCommunity()
		const similarities = this.showSimilarities()
		return <div className={'networkWrapper'}>
			<svg ref={this.ref}  width={1000} height={700} style={{border: "1px solid"}}/>
			<div className={'clubDetail'}>
				{selectedNodes}
				{community}
				{similarities}
			</div>
		</div>

	}
}

export default NetworkChart