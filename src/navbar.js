import React, {Component} from 'react'
import './navbar.scss'


class Navbar extends Component {
	render() {
		return <nav className="navbar" id={'nav'}>
			<h1 className="center">
				<a href="http://lazilyevaluated.co/">
				Lazily Evaluated
				</a>
			</h1>
		</nav>
	}
}

export default Navbar