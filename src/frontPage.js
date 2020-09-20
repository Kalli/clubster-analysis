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

	render(){
		return <>
			<div className={"backgroundImage"} />
			<Rotate />
			<div
				className={"frontPage"}
			>
				<div className="jumbotron">
					<h1 className="center">
						Resident Advisor Club Communities
					</h1>
					<p>
						How similar are the line ups of the worlds most popular night clubs?
						Which clubs rely on residents and which have djs rotate through?
						How different are the super clubs from the more underground fare?
					</p>
					<p>
						In an attempt to answer these questions and others like them we looked
						at the most recommended clubs for the top 20 regions on the
						reputable website <a href="https://www.residentadvisor.net/events">Resident Advisor (RA)</a>.
						We gathered all the listings for the year 2019 and then compared
						the clubs based on djs and artists that played there.
						Take a look to see where your favourite club fits in.
					</p>
					<h3>
						Scroll down to get started!
					</h3>
					<div className={'scrollDown center'}>
						<a href="#start">
							<FontAwesomeIcon icon={faChevronDown} />
						</a>
					</div>
				</div>
			</div>
		</>
	}
}
export default FrontPage