import React, {Component} from 'react'
import './container.scss'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome"
import {faCheck, faTimesCircle, faCog} from '@fortawesome/free-solid-svg-icons'
import SelectSearch from 'react-select-search';
import {fillColor} from "./lib"
import './controls.scss'


class Controls extends Component {

	constructor(props) {
		super(props)
		this.state = {showControls: false}
	}

	render(){
		const nodes = this.props.nodes
		const filters = this.props.filters
		const selectedRegion = filters.region? filters.region : "all"
		const selectedCountry = filters.country? filters.country : "all"

		const clubs = nodes.filter((e) => {
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
				"color": fillColor(e.group, this.props.categories || [])
			}
		})

		const countries = [{name: "All Countries", value: "all"}].concat(
			[...new Set(nodes.map(e => e.country))]
			.sort()
			.map(c => ({"name": c, "value": c}))
		)

		const regions = [{name: "All Regions", value: "all"}].concat(
			[...new Set(nodes.map(e => e.region))]
			.sort()
			.map(c => ({"name": c, "value": c}))
		)

		const country = this.select(
			countries, selectedCountry, "country", this.props.filterChange
		)

		const region = this.select(
			regions, selectedRegion, "region", this.props.filterChange
		)

		const selectedClubs = this.props.selectedNodes.map(e => e.id)
		const club = this.select(
			clubs, selectedClubs, "club", this.searchSelect
		)

		const icon = this.state.showControls? faTimesCircle : faCog
		const hide = this.props.isMobile && !this.state.showControls

		const mobile = !this.props.isMobile ? "" : <div className={"mobile-controls"}>
			<button onClick={this.showControls}>
                <FontAwesomeIcon size="2x" icon={icon} />
            </button>
		</div>

		return <div className={"controls " + (hide? "hidden " : "")}>
			{country}
			{region}
			{club}
			{mobile}
		</div>
	}

    showControls = () => {
        this.setState({showControls: !this.state.showControls})
    }

	select(options, selectedValue, name, changeHandler){
		// return native selects for mobile
		if (this.props.isMobile){
			return (<div className="select-wrapper">
					<select
					name={name}
					onChange={(e) => changeHandler(name, e.target.value)}
					value={selectedValue}
				>
					<option value="" disabled>Select a {name}</option>
					{options.map(e => <option key={e.name}>{e.name}</option>)}
				</select>
			</div>);
		}
		return <SelectSearch
			options={options}
			name={name}
			placeholder={"Select a " + name}
			value={selectedValue}
			search={name === "club"}
	        onChange={(value) => changeHandler(name, value)}
			renderOption={this.renderOption}
		/>
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

	searchSelect = (_, selectedId) => {
		const selectedClubs = this.props.nodes.find((e) => {
			return selectedId === e.id
		})
		this.props.selectNode(selectedClubs)
	}
}

export default Controls
