import React, {Component} from 'react'
import './networkChart.scss'
import BarChart from './BarChart'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome"
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons'
import ScrollyTelling from "./ScrollyTelling"
import {fillColor, artistLink} from "./lib"
import {ClusterChart} from "./charts/ClusterChart"
import {BeeSwarmChart} from "./charts/BeeSwarmChart"
import {ChartWrapper} from "./charts/ChartWrapper"


class NetworkChart extends Component {
	navbar = 60;
	controlHeight = 70
	margin = {top: 10, right: 20, bottom: 20, left: 50}

	constructor(props) {
		super(props)
		this.ref = React.createRef()
		// these are the currently selected values
		// if you need all values, you should use this.props.data
		this.nodes = this.props.data.nodes
		const elementHeight = document.documentElement.clientHeight - this.navbar

		this.state = {
			selectedNodes: [],
			data: {},
			filters: {},
			draw: true,
			chartType: BeeSwarmChart,
			width: document.documentElement.clientWidth,
			height: document.documentElement.clientHeight,
			svgWidth: document.documentElement.clientWidth,
			svgHeight: document.documentElement.clientHeight - 50
		}
	}

	componentWillUnmount() {
		window.removeEventListener('resize', this.updateWindowDimensions)
	}

	componentDidMount() {
		this.updateWindowDimensions()
		window.addEventListener('resize', this.updateWindowDimensions)
		// sort so adjacent groups get different colors
		this.categories = [
			...new Set(this.nodes.map(e => e.group).sort((a, b) => {
				return a % 2 - b % 2 || a - b
			}))
		]

		const svg = this.ref.current
		this.chartWrapper = new ChartWrapper(
			svg, this.margin, this.categories,
			this.state.svgHeight, this.state.svgWidth,
			this.state.chartType
		)
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

	createTable(header, data){
		return <tr key={header+"row"}>
			<td key={header+"cell"}>{header}</td>
			{data.map((e, i) => {
				return <td key={header+"-"+i}>{e}</td>
			})}
		</tr>
	}

	mostCommonArtists(){
		return this.state.selectedNodes.map((node, i) => {
			return Object.entries(node.artists)
				.sort((a, b) => b[1] - a[1])
				.slice(0, 5)
				.map((e, j) => {
					const key = "artist"+i+"-"+j
					return <li key={key}>
						{this.artistLink(e[0])}{" - " + e[1]}
					</li>
				})
		})
	}

	mostSimilarClubs(){
		return this.state.selectedNodes.map(f => {
			return this.props.data.links.filter((e) => {
				return [e.source, e.target].includes(f.id)
			})
			.sort((a, b) => b.weight - a.weight)
			.slice(0, 5)
			.reduce((acc, e) => {
				const club = e.source !== f.id? e.source : e.target
				acc.push(this.clubButton(f, club, e.weight))
				return acc
			}, [])
		})
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
		return artistLink(artistName, this.props.data.artist_names_to_ids)
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
				<h4>No overlap in lineups - no common artists</h4>
			</div>
		}

		const ids = this.state.selectedNodes.map(e => e.id)
		const overlap = (this.props.data.links.find(e => {
			return ids.includes(e.source) && ids.includes(e.target)
		}).weight * 100 ).toFixed(2)

		return <div className={'similarities'}>
			<h4>
				{overlap}% overlap in lineups - {union.length} common artists:
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
		}else{
			this.nodes = this.props.data.nodes
		}
		if (this.state.scroll){
			// dumb but can't figure out how to be sure page is fully in view
			window.scrollTo({
				top: document.documentElement.clientHeight,
				behavior: 'smooth'
			})
		}

		if (this.state.chartType){
			if (this.state.chartType.name !== this.chartWrapper.chart.constructor.name){
			    this.chartWrapper.setChartType(this.nodes, this.state.chartType)
			}
		}

		if (this.state.draw){
			if (this.chartWrapper.chart.initial){
				this.chartWrapper.chart.createGraph(this.nodes)
			}
			this.chartWrapper.chart.drawGraph(
				this.nodes,
				this.onNodeClick,
				this.state.selectedNodes
			)
		}
	}

	showClubs(){
		const clubs = this.state.selectedNodes
		return <div className={"clubInfo"+clubs.length}>
			{clubs.map((e) => this.showClub(e))}
			{this.createClubTable()}
		</div>
	}

	showClub(node){
		const imgPath =`${process.env.PUBLIC_URL}/img/`
		const img = node.logo === '' ? <div className={'placeholder'}/> : <div className={"image center"}>
			<img src={imgPath+node.logo.split("/").slice(-1)[0]} alt={node.id} />
		</div>
		const color = fillColor(node.group, this.categories)
		const link = 'https://www.residentadvisor.net/club.aspx?id=' + node.club_id

		return <div key={node.club_id} className={"clubPanel"}>
			<button
				className={"clubButton"}
				id={"close"}
				onClick={(e) => this.onNodeClick(node)}
			>
				 <FontAwesomeIcon icon={faTimesCircle} />
			</button>
			<h3>
				<a className={"clubName"}
				   style={{backgroundColor: color}}
			       rel={'noopener noreferrer'}
	               target={'_blank'}
                   href={link}
				>
					{node.id}
				</a>
			</h3>
			{img}
			<div className={"center"}>
				{node.region}
				{node.region === node.country ? "" : " - " + node.country}
			</div>
		</div>
	}

	createClubTable(){
		if (this.state.selectedNodes.length === 0){
			return ""
		}
		const rows = this.state.selectedNodes.map(club=> {
			return [
				club.number_of_dates,
				club.number_of_unique_artists,
				club.total_number_of_artists,
				club.followers,
				(club.attending / club.number_of_dates).toFixed(1),
				(club.total_number_of_artists / club.number_of_unique_artists).toFixed(1),
				(club.total_number_of_artists / club.number_of_dates).toFixed(2),
			]
		})

		const headers = [
			"Number of events",
            "Unique artists",
            "Total artists booked",
            "Followers",
			"Average event attendance",
			"Average bookings per artist",
			"Average artists per date",
		]

		let tableRows = headers.map((e, i) => {
			return <tr key={i}>
				<td key={e} >{e}</td>
				{rows.map((e, j) => <td key={i+"-"+j}>{e[i]}</td>)}
			</tr>
		}).concat(
			this.createTable("Most Booked Artists", this.mostCommonArtists())
		).concat(
			this.createTable("Most Similar Clubs", this.mostSimilarClubs())
		)

		const header = rows.length !== 2? null : <thead>
			<tr>
				<th key={"empty"} />
				{this.state.selectedNodes.map(e=><th key={e.id}>{e.id}</th>)}
			</tr>
		</thead>
		return <table>
			{header}
			<tbody>{tableRows}</tbody>
		</table>
	}

	showGroup(){
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

		const color = fillColor(club.group, this.categories)
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
		const v = e.target.name === "rank" && e.target.value !== "all"?
			parseInt(e.target.value) : e.target.value
		filter[e.target.name] = v
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

		const rankings = [...new Set(this.props.data.nodes.map(e => e.rank))]
			.sort()
			.map(c => <option key={c} value={c}>{c+1}</option>)
		const selectedRank = this.state.filters.rank?
			this.state.filters.rank : "all"

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
				<option value={"all"}>All Regions</option>
				{regions}
			</select>
			<select
				name="rank"
				value={selectedRank}
		        onChange={this.setFilters}
			>
				<option value={"all"}>All Positions</option>
				{rankings}
			</select>
		</>
	}

	updateWindowDimensions = () => {
		const w = document.documentElement.clientWidth
		const h = document.documentElement.clientHeight
		this.setState({
			width: w, height: h, svgWidth: w, svgHeight: h - 50
		})
	}

	showClubInfo(){
		if (this.state.selectedNodes.length === 0){
			return <div className={"clubDetail hidden"} />
		}
		return <div className={"clubDetail visible"}>
			{this.showClubs()}
			{this.showGroup()}
			{this.showSimilarities()}
		</div>
	}

    onStepEnter = ({element, data, direction}) => {
	    if (data){
			this.setState(data)
	    }
	}

	onStepExit = ({element, data, direction}) => {
	    if (data){
			this.setState(data)
	    }
	}

	render() {
		const controls = this.controls()
		return <div className={"wrapper"}
            style={{height: this.state.height, width: this.state.width}}
		>
		<div className={"sticky"}>
			<div className={"controls"}>
				{controls}
			</div>
			<div className={'networkWrapper'}>
				<svg
					ref={this.ref}
					width={this.state.svgWidth}
					height={this.state.svgHeight}
				/>
				{this.showClubInfo()}
			</div>
		</div>
		<ScrollyTelling
			enter={this.onStepEnter}
			exit={this.onStepExit}
			nodes={this.props.data.nodes}
			links={this.props.data.links}
		/>
    </div>
	}
}

export default NetworkChart