import React, {Component} from 'react'
import './container.scss'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome"
import {faCheck} from '@fortawesome/free-solid-svg-icons'
import SelectSearch from 'react-select-search';
import {fillColor} from "./lib"
import './controls.scss'


class Controls extends Component {

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

		const countries = [...new Set(nodes.map(e => e.country))]
			.sort()
			.map(c => ({"name": c, "value": c}))

		const regions = [...new Set(nodes.map(e => e.region))]
			.sort()
			.map(c => ({"name": c, "value": c}))

		const allCountries = [{name: "All Countries", value: "all"}]
		const allRegions = [{name: "All Regions", value: "all"}]
		return <div className={"controls"}>

			<SelectSearch
				options={allCountries.concat(countries)}
				name="country"
				placeholder="Select a country"
				value={selectedCountry}
		        onChange={(value) => this.props.filterChange("country", value)}
				renderOption={this.renderOption}
			/>
			<SelectSearch
				options={allRegions.concat(regions)}
				name="region"
				placeholder="Select a region"
				value={selectedRegion}
		        onChange={(value) => this.props.filterChange("region", value)}
				renderOption={this.renderOption}
			/>
			<SelectSearch
				options={clubs}
				name="club"
				value={this.props.selectedNodes.map(e => e.id)}
				search={!this.isMobile}
				placeholder="Select a club"
				onChange={(e) => this.searchSelect(e)}
				renderOption={this.renderOption}
			/>
		</div>
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
		const selectedClubs = this.props.nodes.find((e) => {
			return selectedId === e.id
		})
		this.props.selectNode(selectedClubs)
	}
}

export default Controls
