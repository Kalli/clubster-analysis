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
		this.state = {
			steps: null,
			readMore: false,
		}
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
		const averageWeight = total / this.props.links.length
		const combinations = Math.floor(
			factorial(clubCount) / (2 * factorial(clubCount - 2))
		)

		const data = {
			"$clubCount": clubCount,
			"$linkCount": this.props.links.length,
			"$source": source,
			"$target": target,
			"$weight": (weight*100).toFixed(0),
			"$combinations": combinations,
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

	readMoreOnClick = (e) => {
		this.setState({readMore: !this.state.readMore})
	}

	step(stepHtml) {
		const show = this.state.readMore
		// if the step has footnotes, show a read more button
		const readMore = stepHtml.indexOf("footnote") === -1? "" : <div>
			<button
				className={"readMoreButton"}
		        onClick={(e) => this.readMoreOnClick()}
			>
				{show? "Hide footnotes" : "Show footnotes"}
			</button>
		</div>

		return <div className={"step " + (show? "show" : "") }>
			<div dangerouslySetInnerHTML={{__html: stepHtml}} />
			{readMore}
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