import React, {Component} from 'react'
import './App.css'
import * as d3 from 'd3'
import {interpolateWarm} from 'd3-scale-chromatic'
import './networkChart.css';
import {fitTextToScreen} from './textHandling'
import BarChart from './BarChart'


class NetworkChart extends Component {

	width = 1000
	height = 1000
	margin = {top: 10, right: 20, bottom: 30, left: 50}

	constructor(props) {
		super(props)
		this.ref = React.createRef()
		// these are the currently selected values
		// if you need all values, you should use this.props.data
		this.nodes = this.props.data.nodes
		this.links = this.props.data.links

		this.state = {
			selectedNodes: [],
			data: {},
			filters: {}
		}
	}

	componentDidMount() {
		// sort so adjacent groups get different colors
		this.categories = [
			...new Set(this.nodes.map(e => e.group).sort((a, b) => {
				return a % 2 - b % 2 || a - b
			}))
		]

		const groupCount = Math.max(...this.nodes.map(e => e.group))
		const clusters = new Array(groupCount)

		// add positioning data for initial position to help clustering
		this.nodes.forEach((e) => {
			// position along a circle, clustered by group
			const radius = Math.min(this.width, this.height) / 2
			const g = e.group
			const angle = g / groupCount * 2 * Math.PI
	        e.x  = Math.cos(angle) * radius + this.width / 2 + Math.random()
            e.y = Math.sin(angle) * radius + this.height / 2 + Math.random()

			// set the radius of each node
			const r = this.calculateRadius(e)
			e.radius = r

			if (!clusters[g] || r > clusters[g]) clusters[e.group] = e
		})

		this.clusters = clusters
		const svg = this.ref.current
		this.createLegend(svg)
		this.createGraph(svg)
		this.drawGraph()
	}

	calculateRadius(e){
		return 12 * Math.log(Math.sqrt(e.followers))
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
		this.initial = true
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

		const translate = `translate(${this.width - width}, ${this.height - height})`
		this.g = d3.select(svg)
            .attr("width", width + this.margin.left + this.margin.right)
            .attr("height", height + this.margin.top + this.margin.bottom)
			.append("g")
            .attr("transform", translate)
			.attr("class", "nodes")

		this.node = this.g.selectAll("circle")
		this.label = this.g.selectAll("text")

		this.simulation
			.on('tick', this.tick)
			.nodes(this.nodes)

		const zoom_handler = d3
			.zoom()
			.scaleExtent([0, 10])
			.on("zoom", () => this.zoom(this.g))

		zoom_handler(d3.select(svg))
		const transitionTime = 3000;
		var t = d3.timer((elapsed) => {
	        var dt = elapsed / transitionTime
		    this.simulation
			    .force('collide')
			    .strength(Math.pow(dt, 2))
		    if (dt >= 1.0){
		    	t.stop()
		    }
		})
	}

	drawGraph = () => {
		const transition = d3.transition().duration(1500)

		this.node = this.node.data(this.nodes, d=> d.id)
		this.node.exit().transition(transition).style("opacity", 0).remove()

		let newNode = this.node
			.enter()
			.append("circle")
			.attr("r", d => d.radius)
			.attr("fill", d => this.fillColor(d.group))
			.attr("class", "nodes")
			.style("opacity", this.initial? "1": "0")
			.call(
				d3
				.drag()
					.on("start", d => this.dragstarted(d, this.simulation))
					.on("drag", d => this.dragged(d))
					.on("end", d => this.dragended(d, this.simulation))
			)
			.on("click", d => this.onNodeClick(d))
			.transition(transition).style("opacity", 1)

		this.node = this.node.merge(newNode)

		this.label = this.label.data(this.nodes, d=> d.id)
		this.label.exit().transition(transition).style("opacity", 0).remove()
		let newLabel = this.label.enter()
			.append("text")
			.attr("text-anchor", "middle")
			.style("fill", "#fff")
			.style("opacity", "0")
            .style("font-size", 12)
			.text(d => fitTextToScreen(d.id, d.radius))
			.on("click", d => this.onNodeClick(d))
			.transition(transition).style("opacity", 1)

		newLabel.transition(transition).style("opacity", 1)
		this.label = this.label.merge(newLabel)
		if (!this.initial){
			// restart simulation so nodes wont get stuck on next filter
			this.simulation.alphaTarget(0.3).restart()
			this.simulation.alphaTarget(0)
		}
		this.initial = false
	}

	createLegend(svg){
		const sizes = [10000, 1000, 100, 10]
		const radiuses = sizes.map((e) => {
			return this.calculateRadius({followers: e})
		})

		const x = 10
		const lineHeight = 30
		const paddingBottom = 10
		const y = this.height - 2 * Math.max(...radiuses) - lineHeight - paddingBottom

        const legend = d3.select(svg)
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

		if (sorted.length === 0){
			return ""
		}
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
		const edges = this.links.filter((e) => {
			return [e.source, e.target].includes(node.id)
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
				{edges.map(e => this.clubButton(node, e[0], e[1]))}
			</ol>
		</div>
	}

	clubButton(parentClub, clubId, percentage=null){
		return <li key={clubId}>
			<button
				className={"clubButton"}
				onClick={(e) => this.clubButtonClickHandler(clubId, parentClub)}
			>
				{clubId}
			</button> {percentage? " - " + (percentage*100).toFixed() + "%": "" }
		</li>
	}

	clubButtonClickHandler(clubId, parentClub){
		const club = this.nodes.find(e => e.id === clubId)
		// we want to maintain the position of the parent club in selected club
		const selectedClubs = this.state.selectedNodes[0] === parentClub?
			[parentClub, club] : [club, parentClub]
		this.setState({selectedNodes: selectedClubs})
	}

	artistLink(artistName){
		const artistId = ( this.props.data.artist_names_to_ids[artistName] ||
				artistName.toLowerCase().replace(' ', '')
		)
		return <a
			href={'https://www.residentadvisor.net/dj/' + artistId}
			rel={'noopener noreferrer'}
			target={'_blank'}
		>
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
		const overlap = (this.links.find(e => {
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

	componentDidUpdate( prevProps, prevState){
		const filters = this.state.filters
		if (Object.keys(filters).length !== 0){
			this.nodes = this.props.data.nodes.filter((e) => {
				return Object.keys(filters).every((f) => {
					return filters[f] === "all" || e[f] === filters[f]
				})
			})
			const ids = this.nodes.map(e => e.id)
			this.links = this.props.data.links.filter((e) => {
				return ids.includes(e.target) && ids.includes(e.source)
			})
		}
		this.drawGraph()
	}

	showClubs(){
		return this.state.selectedNodes.map((e) => this.showClub(e))
	}

	showClub(node){
		const img = node.logo === '' ? <div className={'placeholder'}/> : <div className={"image"}>
			<img src={'/img/'+node.logo.split("/").slice(-1)[0]} alt={node.id} />
		</div>
		const link = 'https://www.residentadvisor.net/club.aspx?id=' + node.club_id
		const total_appearances = Object.values(node.artists)
			.reduce((a, b) => a + b, 0)

		const region = node.region === node.country?
			node.region : node.region + ", " + node.country
		return <div key={node.club_id}>
			<h3>
				<a className={"clubName"}
				   style={{backgroundColor: this.fillColor(node.group)}}
			       rel={'noopener noreferrer'}
	               target={'_blank'}
                   href={link}
				>
					{node.id}
				</a>
			</h3>
			{img}
			<div>Number of events: {node.number_of_dates}</div>
			<div>Unique artists: {node.number_of_unique_artists}</div>
			<div>Total artists booked: {node.total_number_of_artists}</div>
			<div>Region: {region} </div>
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
					total_appearances / node.number_of_unique_artists
				).toFixed(2)}
			</div>			<div>
				Average artists per date:
				{" " +(
					total_appearances / node.number_of_dates
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

		const stats = groupClubs.reduce((acc, e) => {
			acc[e.region] = (acc[e.region] + 1 || 1)
			return acc
		}, {})

		const color = this.fillColor(club.group)
		return <div>
			<h4>
				<span
					className={"clubName"}
					style={{backgroundColor: color}}
				>
					Other clubs in this group
				</span>
			</h4>
			<BarChart
				data={Object.entries(stats)}
				width={312}
				height={210}
				color={color}
			/>
			<ul>
				{groupClubs.map(e => this.clubButton(club, e.id))}
			</ul>
		</div>
	}

	setFilters =(e) => {
		const filter = {}
		filter[e.target.name] = e.target.value
		this.setState({"filters": filter, "selectedNodes": []})
	}

	controls(){
		const countries = [...new Set(this.props.data.nodes.map(e => e.country))]
			.sort()
			.map(c => <option key={c}>{c}</option>)
		const selectedCountry = this.state.filters.country?
			this.state.filters.country : "all"

		const regions = [...new Set(this.props.data.nodes.map(e => e.region))]
			.sort()
			.map(c => <option key={c}>{c}</option>)
		const selectedRegion = this.state.filters.region?
			this.state.filters.region : "all"


		return <>
			<select
				name="country"
				value={selectedCountry}
		        onChange={this.setFilters}
			>
				<option value={"all"}>All Countries</option>
				{countries}
			</select>
			<select
				name="region"
				value={selectedRegion}
		        onChange={this.setFilters}
			>
				<option value={"all"} >All Regions</option>
				{regions}
			</select>
		</>
	}

	render() {
		const selectedNodes = this.showClubs()
		const community = this.showCommunity()
		const controls = this.controls()
		const similarities = this.showSimilarities()
		return <div>
			<div className={"controls"}>
				{controls}
			</div>
			<div className={'networkWrapper'}>
				<svg
					ref={this.ref}
					width={1000}
					height={1000}
					style={{border: "1px solid"}}
				/>
				<div className={'clubDetail'}>
					{selectedNodes}
					{community}
					{similarities}
				</div>
			</div>
		</div>

	}
}

export default NetworkChart