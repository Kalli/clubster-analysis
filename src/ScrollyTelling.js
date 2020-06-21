import React, {Component} from "react"
import {Scrollama, Step} from "react-scrollama"
import marked from "marked"
import steps from "./steps.md"
import "./ScrollyTelling.scss"


class ScrollyTelling extends Component {

	stepsData = [
		{draw: true, filters: {region: "all"}},
		{filters: {"region": "Berlin"}},
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
		const data = {
			"$clubCount": this.props.nodes.length,
			"$linkCount": this.props.links.length,
			"$source": source,
			"$target": target,
			"$weight": (weight*100).toFixed(0),
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
			debug
		>
			{steps}
		</Scrollama>
	}
}

export default ScrollyTelling