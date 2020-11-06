import React, {Component} from 'react'
import './sections.scss';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome"
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import Rotate from "./Rotate"

class Intro extends Component {
	render(){
		const content = <>
			<h1 className="center">
				Clubster Analysis
			</h1>
			<h3>
				 Comparing the bookings at the worlds most popular nightclubs
			</h3>
			<p>
				How similar or different are the line ups of the most popular nightclubs in the world?
				Which clubs rely on residents and which have endlessly rotating talent?
				How similar are the bookings of clubs in different countries and continents?
				Are the super clubs different from the underground venues?
			</p>
			<p>
				In an attempt to answer these questions and others like them we looked
				at the most recommended clubs for the most popular regions on the
				reputable website <a href="https://www.residentadvisor.net/events">Resident Advisor (RA)</a>.
				We gathered all their listings for 2019 and then compared
				the clubs based on the djs and artists who played there that year.
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
				That concludes this analysis of the bookings and line ups for
				the most recommended clubs in the most popular regions on Resident
				Advisor. We hope it has provided insight into how these clubs are
				alike and different and given you a glimpse of how the world of
				electronic dance music worked in 2019.
			</p>
			<p>
				The data was retrieved in April to May 2020.
				If you'd like to learn more you can view all the <a href="https://github.com/Kalli/clubster-analysis">code</a> for
				retrieving and visualising this data. If you have any questions
				you can reach me on <a href="https://twitter.com/karltryggvason">twitter</a> or
				through <a href="mailto:ktryggvason@gmail.com">email</a>.
			</p>
			<p>
				A <a href="https://lazilyevaluated.co/">Lazily Evaluated</a> production.
				By <a href="https://karltryggvason.com/">Karl Tryggvason</a> and <a href="http://mtryggvason.github.io/">Magnús Felix Tryggvason</a>
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