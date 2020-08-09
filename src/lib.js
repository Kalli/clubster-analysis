import {interpolateWarm} from 'd3-scale-chromatic'
import React from "react"

function fillColor(category, categories){
	return interpolateWarm(
		categories.indexOf(category) / categories.length
	)
}

const factorial = (n) => !(n > 1) ? 1 : factorial(n - 1) * n;


function artistLink(artistName, artist_names_to_ids){
	const artistId = ( artist_names_to_ids[artistName] ||
			artistName.toLowerCase().replace(' ', '')
	)
	return <a
		href={'https://www.residentadvisor.net/dj/' + artistId}
		rel={'noopener noreferrer'}
		target={'_blank'}
	>
		{artistName}
	</a>
}

export {fillColor, factorial, artistLink}
