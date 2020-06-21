import React, {Component} from 'react'
import {Scrollama, Step} from "react-scrollama"
import './ScrollyTelling.scss'


class ScrollyTelling extends Component {

	render() {
		return 	<Scrollama
			onStepEnter={this.props.enter}
			onStepExit={this.props.exit}
		>
			<Step data={0} key={0} >
				<div className={"step"}>
					<h4>Step 1</h4>
				</div>
			</Step>
			<Step data={1} key={1} >
				<div className={"step"}>
					<h4>Step 2</h4>
				</div>
			</Step>
		</Scrollama>
	}
}

export default ScrollyTelling