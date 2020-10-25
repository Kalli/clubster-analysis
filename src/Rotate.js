import {FontAwesomeIcon} from "@fortawesome/react-fontawesome"
import {faSyncAlt, faMobileAlt} from "@fortawesome/free-solid-svg-icons"
import React from "react"
import './rotate.scss';


function Rotate(){
	return <div className="rotate">
		<div className={"center"}>
			<h2>
				Please turn your phone to landscape mode to properly view
				this webpage.
			</h2>
			<FontAwesomeIcon icon={faMobileAlt}/>
			<FontAwesomeIcon icon={faSyncAlt} spin={true}/>
			<h2>
				Thanks!
			</h2>
		</div>
	</div>
}

export default Rotate