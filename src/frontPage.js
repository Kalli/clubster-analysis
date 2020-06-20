import React, {Component} from 'react'
import './frontPage.scss';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome"
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import Rotate from "./Rotate"

class FrontPage extends Component {

	constructor(props) {
        super(props);
        this.state = { width: 0, height: 0 };
	}

	componentDidMount() {
		this.updateWindowDimensions();
		window.addEventListener('resize', this.updateWindowDimensions);
	}

	componentWillUnmount() {
		window.removeEventListener('resize', this.updateWindowDimensions);
	}

	updateWindowDimensions= () => {
		this.setState({ width: window.innerWidth, height: window.innerHeight });
	}

	render(){
		return <>
			<div className={"backgroundImage"} />
			<Rotate />
			<div
				className={"frontPage"}
	            style={{height: this.state.height, width: this.state.width}}
			>
				<div className="jumbotron">
					<h1 className="center">
						Resident Advisor Club Communities
					</h1>
					<p>
						How different or similar are the worlds biggest night clubs?
						Which clubs rely on residents and which have djs rotate through?
						How different are the super clubs from the underground fare?
					</p>
					<p>
						In an attempt to answer these questions and others like them we looked
						at the most recommended clubs for the top 20 regions on the
						reputable website <a href="https://www.residentadvisor.net/events">Resident Advisor</a>.
						We gathered all the listings for the year 2019 and then compared
						the clubs based on djs and artists that played there.
						Take a look to see where your favourite club fits in.
					</p>
					<h3>
						Scroll down to get started!
					</h3>
					<div className={'scrollDown center'}>
						<a  href="#start">
							<FontAwesomeIcon icon={faChevronDown} />
						</a>
					</div>
				</div>
			</div>
		</>
	}
}
export default FrontPage