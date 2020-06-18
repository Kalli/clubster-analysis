import React, {Component} from 'react'
import {select} from 'd3-selection'
import {scaleBand, scaleLinear} from 'd3-scale'
import {axisLeft, axisBottom} from 'd3-axis'
import {range, max} from 'd3-array'


class BarChart extends Component {

	constructor(props) {
		super(props)
		this.ref = React.createRef()
	}

	componentDidMount() {
		const {data, width, height, color} = this.props
		this.createGraph(data, width, height, color)
	}

	createGraph = (data, w, h, color) => {
		var margin = {top: 10, right: 0, bottom: 70, left: 40}
	    const width = w - margin.left - margin.right
	    const height = h - margin.top - margin.bottom

		const svg = select(this.ref.current).attr("viewBox", [0, 0, w, h])

		const x = scaleBand()
			.domain(range(data.length))
			.range([margin.left, width - margin.right])
            .padding(0.1)

		const y = scaleLinear()
			.domain([0, max(data.map(e=>[e[1]]))])
			.range([height, margin.top])

		const xAxis = g => g
		    .attr("transform", `translate(0,${h - margin.bottom - margin.top})`)
            .call(
            	axisBottom(x).tickFormat(i => data[i][0]).tickSizeOuter(0)
            ).selectAll("text")
		     .style("text-anchor", "end")
		     .attr("dx", "-.8em")
		     .attr("dy", ".15em")
		     .attr("transform", "rotate(-65)")

		const yAxis = g => g
		    .attr("transform", `translate(${margin.left},0)`)
		    .call(axisLeft(y).ticks(5))
		    .call(g => g.select(".domain").remove())
		    .call(g => g.append("text")
		        .attr("x", -margin.left)
		        .attr("y", 10)
		        .attr("fill", "currentColor")
		        .attr("text-anchor", "start")
		        .text(data.y))

		svg
			.append("g")
				.attr("fill", color)
			.selectAll("rect")
			.data(data)
			.join("rect")
				.attr("x", (d, i) => x(i))
				.attr("y", d => y(d[1]))
				.attr("height", d =>  y(0) - y(d[1]))
				.attr("width", x.bandwidth())

		svg.append("g").call(xAxis)
		svg.append("g").call(yAxis)
	}

	render() {
		return <svg ref={this.ref}
		     width={this.props.width}
		     height={this.props.height}
		/>
	}
}

export default BarChart