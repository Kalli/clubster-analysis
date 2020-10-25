import React, {Component} from 'react'
import './sections.scss';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome"
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import Rotate from "./Rotate"

class Intro extends Component {
	render(){
		const content = <>
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
		</>
		return <Section content={content} intro={true}/>
	}
}

class Outro extends Component {
	render (){
		const content = <>
			<p>
				That concludes this analysis of the listings and line ups for
				the most recommended clubs in the most popular regions on Resident
				Advisor. I hope it has provided insight into how these clubs are
				alike and different.
			</p>
			<p>
				The data was retrieved in April to May 2020.
				If you'd like to learn more you can view all the
				<a href="https://github.com/kalli/club-charts/">code</a> for
				retrieving and visualising this data. If you have any questions
				you can reach me on
				<a href="https://twitter.com/karltryggvason">twitter</a> or
				<a href="mailto:ktryggvason@gmail.com">email</a>.
			</p>
		</>
		return <Section content={content} intro={false} />
	}
}

class Section extends Component {
	render(){
		const contentClass = "sectionsContent " + (
			!this.props.intro? "bottom" : ""
		)
		return <div className={"sections"}>
			<div className={ this.props.intro? "top" : ""} />
			<Rotate />
			<div className={contentClass}>
				<div className="jumbotron">
					{this.props.content}
				</div>
			</div>
		</div>
	}
}

export {Intro, Outro}