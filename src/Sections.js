import React, {Component} from 'react'
import './sections.scss';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome"
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import Rotate from "./Rotate"

class FrontPage extends Component {
	render(){
		const content = <div className="jumbotron">
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
				at the most recommended clubs for the most popular regions on the
				reputable website <a href="https://www.residentadvisor.net/events">Resident Advisor (RA)</a>.
				We gathered all their listings for 2019 and then compared
				the clubs based on djs and artists that played there that year.
				Take a look to see how your favourite club fits in.
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
		return <Section content={content} />
	}
}

class Section extends Component {

	render(){
		return <>
			<div className={"backgroundImage"} />
			<Rotate />
			<div
				className={"sections"}
			>
				{this.props.content}
			</div>
		</>
	}
}
export default FrontPage