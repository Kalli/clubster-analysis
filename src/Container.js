import React, {Component} from 'react'
import './container.scss'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome"
import {faCheck} from '@fortawesome/free-solid-svg-icons'
import ScrollyTelling from "./ScrollyTelling"
import {fillColor} from "./lib"
import {BeeSwarmChart} from "./charts/BeeSwarmChart"
import {CandleStickChart} from "./charts/CandleStickChart"
import {ClusterChart} from "./charts/ClusterChart"
import {ChartWrapper} from "./charts/ChartWrapper"
import SelectSearch from 'react-select-search';
import ClubPanel from "./clubPanel";
import getDeviceType from './utils/getDeviceType'

class Container extends Component {
	isMobile = getDeviceType() === "mobile"
	controlHeight = this.isMobile ? 0 : 70
	margin = this.isMobile? (
			{top: 10, right: 20, bottom: 10, left: 10}
		):(
			{top: 60, right: 20, bottom: 20, left: 50}
	)
	resizeTimeout = 0

	constructor(props) {
		super(props)
		this.ref = React.createRef()
		// these are the currently selected values
		// if you need all values, you should use this.props.data
		this.nodes = this.props.data.nodes
		this.clubButtonClickHandler  = this.clubButtonClickHandler.bind(this)
		this.state = {
			selectedNodes: [],
			data: {},
			filters: {},
			draw: true,
			chartType: "Cluster",
			height: document.documentElement.clientHeight,
			width: document.documentElement.clientWidth,
			svgWidth: document.documentElement.clientWidth,
			svgHeight: document.documentElement.clientHeight - this.controlHeight
		}
	}

	componentWillUnmount() {
		window.removeEventListener('resize', this.onResize)
	}

	componentDidMount() {
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
			ClusterChart
		)
		window.addEventListener('resize', this.onResize)
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

	clubButtonClickHandler(clubId, parentClub){
		const club = this.nodes.find(e => e.id === clubId)
		// we want to maintain the position of the parent club in selected club
		const selectedClubs = this.state.selectedNodes[0] === parentClub?
			[parentClub, club] : [club, parentClub]
		this.setState({selectedNodes: selectedClubs})
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
		if (this.state.chartType !== prevState.chartType){
		    this.chartWrapper.setChartType(this.nodes, this.getChartType())
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

	getChartType(){
		if (this.state.chartType === "Cluster"){
			return ClusterChart
		}
		if (this.state.chartType === "CandleStick"){
			return CandleStickChart
		}
		if (this.state.chartType === "BeeSwarm"){
			return BeeSwarmChart
		}
	}

	setFilters = (key, value) => {
		const filter = {}
		filter[key] = value
		this.setState({"filters": filter, "selectedNodes": []})
	}

	onResize = () => {
		// only resize after resizing is likely complete
		clearTimeout(this.resizeFunctionId)
		this.resizeFunctionId = setTimeout(
			this.updateWindowDimensions, 500
		);
	}

	updateWindowDimensions = () => {
		const w = document.documentElement.clientWidth
		const h = document.documentElement.clientHeight
		this.setState({
			width: w, height: h, svgWidth: w, svgHeight: h - this.controlHeight
		})
		this.chartWrapper.dimensionChange(h, w)
		this.chartWrapper.setChartType(this.nodes, this.getChartType())
	}

	controls(){
		const filters = this.state.filters
		const selectedRegion = filters.region? filters.region : "all"
		const selectedCountry = filters.country? filters.country : "all"

		const clubs = this.props.data.nodes.filter((e) => {
			if (selectedRegion !== "all") {
				return e.region === selectedRegion
			}
			if (selectedCountry !== "all"){
				return e.country === selectedCountry
			}
			return true
		}).map((e) => {
			return {
				"name": e.id,
				"value": e.id,
				"color": fillColor(e.group, this.categories || [])
			}
		})

		const countries = [...new Set(this.props.data.nodes.map(e => e.country))]
			.sort()
			.map(c => ({"name": c, "value": c}))

		const regions = [...new Set(this.props.data.nodes.map(e => e.region))]
			.sort()
			.map(c => ({"name": c, "value": c}))

		const allCountries = [{name: "All Countries", value: "all"}]
		const allRegions = [{name: "All Regions", value: "all"}]
		return <>
			<SelectSearch
				options={allCountries.concat(countries)}
				name="country"
				placeholder="Select a country"
				value={selectedCountry}
		        onChange={(value) => this.setFilters("country", value)}
				renderOption={this.renderOption}
			/>
			<SelectSearch
				options={allRegions.concat(regions)}
				name="region"
				placeholder="Select a region"
				value={selectedRegion}
		        onChange={(value) => this.setFilters("region", value)}
				renderOption={this.renderOption}
			/>
			<SelectSearch
				options={clubs}
				name="club"
				value={this.state.selectedNodes.map(e => e.id)}
				search={true}
				placeholder="Select a club"
				onChange={(e) => this.searchSelect(e)}
				renderOption={this.renderOption}
			/>
		</>
	}

    renderOption(domProps, option, snapshot, className){
        return <button className={className} {...domProps}>
	        {option.color &&
	            <span className={"dot"} style={{backgroundColor: option.color}}/>
	        }
            {option.name}
	        {snapshot.selected && <FontAwesomeIcon icon={faCheck} />}
        </button>
	}

	searchSelect(selectedId){
		const selectedClubs = this.props.data.nodes.find((e) => {
			return selectedId === e.id
		})
		this.onNodeClick(selectedClubs)
	}


	// hack so on step enter can change the selectedNodes
	setAsyncState = (newState) => new Promise(
		(resolve) => this.setState(newState, resolve)
	)

    onStepEnter = ({element, data, direction}) => {
	    if (data){
	    	// reset any selection from user before setting step data
	    	this.setAsyncState({selectedNodes: []}).then(this.setState(data))
	    }
	}

	render() {
		const controls = this.state.chartType !== "CandleStick" && this.controls()
		return <div className="container" id={"start"}>
			<div className={"controls"}>
				{controls}
			</div>
			<div id={"tooltip"} />
			<ScrollyTelling
				enter={this.onStepEnter}
				nodes={this.props.data.nodes}
				links={this.props.data.links}
			/>
			<div className={"graphic"}>
				<svg
					onClick={() => this.setState({selectedNodes: []})}
					ref={this.ref}
					width={this.state.svgWidth}
					height={this.state.svgHeight}
				/>
				<ClubPanel
					onClubClick={this.clubButtonClickHandler}
					onNodeClick={this.onNodeClick}
					categories={this.categories}
					clubs={this.state.selectedNodes}
					data={this.props.data}
				/>
			</div>

        </div>
	}
}

export default Container