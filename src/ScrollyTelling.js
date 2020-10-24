import React, {Component} from "react"
import {Scrollama, Step} from "react-scrollama"
import marked from "marked"
import steps from "./steps.md"
import "./ScrollyTelling.scss"
import {BeeSwarmChart} from "./charts/BeeSwarmChart"
import {CandleStickChart} from "./charts/CandleStickChart"
import {ClusterChart} from "./charts/ClusterChart"
import {factorial} from "./lib"


class ScrollyTelling extends Component {

	stepsData = [
		{draw: true, filters: {region: "all"}, selectedNodes: [], scroll: true},
		{filters: {region: "Berlin"}, chartType: ClusterChart, selectedNodes: []},
		{filters: {country: "all"}, chartType: ClusterChart, selectedNodes: [] },
		{filters: {region: "all"}, chartType: BeeSwarmChart, selectedNodes: []},
		{filters: {region: "all"}, chartType: BeeSwarmChart, selectedNodes: []},
		{filters: {region: "all"}, chartType: CandleStickChart, selectedNodes: []},
	]

	constructor(props) {
		super(props)
		this.state = {
			steps: null,
		}
	}

	componentDidMount() {
		// fetch the markdown and replace any variables
		const {source, target, weight} = this.props.links.reduce((acc, e)=>{
			return acc.weight > e.weight? acc : e
		}, {weight: 0})

		// Show De School and Berghain in step 4
		this.stepsData[2].selectedNodes = this.props.nodes.filter((e) => {
			return [112491, 5031].includes(e.club_id)
		})
		const clubCount = this.props.nodes.length
		const total = this.props.links.reduce((acc, e) => acc+e.weight, 0)
		const averageWeight = total / this.props.links.length
		const combinations = Math.floor(
			factorial(clubCount) / (2 * factorial(clubCount - 2))
		)

		const averageResidency = (this.props.nodes.reduce((acc, e) => {
			if (e.number_of_unique_artists !== 0){
				return acc + e.total_number_of_artists / e.number_of_unique_artists
			}
			return acc
		}, 0) / clubCount).toFixed(2)

		const data = {
			"$clubCount": clubCount,
			"$linkCount": this.props.links.length,
			"$source": source,
			"$target": target,
			"$weight": (weight*100).toFixed(0),
			"$combinations": combinations,
			"$averageWeight": (averageWeight*100).toFixed(0.2),
			"$averageResidency": averageResidency,
		}

		fetch(steps)
			.then(response => {
				return response.text()
			})
			.then(text => {
				let html = marked(text)
				Object.keys(data).forEach(k => html = html.replace(k, data[k]))
				const steps = html.split('<hr>')
				this.setState({steps: steps})
			})
	}

	step(stepHtml) {
		return <div className={"step "}>
			<div dangerouslySetInnerHTML={{__html: stepHtml}} />
		</div>
	}

	render() {

		if (!this.state.steps){
			return ""
		}

		const steps = this.state.steps.map((step, i) => {
			return <Step key={i} data={this.stepsData[i]}>
				{this.step(step)}
			</Step>
		})
		return <div className={"scroller"}>
			<Scrollama
				onStepEnter={this.props.enter}
				offset={0.75}
			>
				{steps}
			</Scrollama>
		</div>
	}
}

export default ScrollyTelling