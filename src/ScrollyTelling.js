import React, {Component} from "react"
import {Scrollama, Step} from "react-scrollama"
import marked from "marked"
import steps from "./steps.md"
import "./ScrollyTelling.scss"


class ScrollyTelling extends Component {

	stepsData = [
		{draw: true, filters: {region: "all"}, selectedNodes: [], scroll: true},
		{filters: {region: "Berlin"}, selectedNodes: [] },
		{filters: {country: "United Kingdom"}, selectedNodes: [] },
		{filters: {country: "all"}, selectedNodes: [] },
	]

	constructor(props) {
		super(props)
		this.state = {steps: null}
	}

	componentDidMount() {
		// fetch the markdown and replace any variables

		const {source, target, weight} = this.props.links.reduce((acc, e)=>{
			return acc.weight > e.weight? acc : e
		}, {weight: 0})

		// Show De School and Berghain in step 4
		this.stepsData[3].selectedNodes = this.props.nodes.filter((e) => {
			return [112491, 5031].includes(e.club_id)
		})
		const clubCount = this.props.nodes.length
		const total = this.props.links.reduce((acc, e) => acc+e.weight, 0)
		const averageWeight = total / (clubCount * (clubCount-1) / 2)

		const data = {
			"$clubCount": clubCount,
			"$linkCount": this.props.links.length,
			"$source": source,
			"$target": target,
			"$weight": (weight*100).toFixed(0),
			"$total": total,
			"$averageWeight": (averageWeight*100).toFixed(0.2),
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

	render() {

		if (!this.state.steps){
			return ""
		}

		const steps = this.state.steps.map((step, i) => {
			return <Step key={i} data={this.stepsData[i]}>
				<div
					className={"step"}
					dangerouslySetInnerHTML={{__html: step}}
				/>
			</Step>
		})
		return <Scrollama
			onStepEnter={this.props.enter}
			onStepExit={this.props.exit}
			offset={0.75}
		>
			{steps}
		</Scrollama>
	}
}

export default ScrollyTelling