import {select, event} from 'd3-selection'
import {scaleLinear, scaleBand} from 'd3-scale'
import {max} from 'd3-array'
import {axisBottom} from 'd3-axis'
import './Chart.scss'
import {Chart} from "./Chart"


class CandleStickChart extends Chart{

	constructor(svg, margin, categories, h, w) {
		super(svg, margin, categories, h, w)
		this.groups = []
		this.tooltipData = null
	}

	y = e => {
		return this.groups.indexOf(e)
	}

	x = e => {
		return e.number_of_unique_artists !== 0?
			e.total_number_of_artists / e.number_of_unique_artists : 0
    }

    candleStickData = () => {
		const groups = this.nodes.reduce((acc, e) => {
			const key = e[this.groupBy]
			acc[key] ? acc[key].push(e) : acc[key] = [e]
			return acc
		}, {})
	    return Object.keys(groups).reduce((acc, key) => {
	    	const nodes = groups[key].sort((a, b) => this.x(b) - this.x(a))
		    const d = nodes.map(e => this.x(e)).sort()
		    acc.push({
			    'percentile_95': d[Math.floor(0.95*d.length)-1],
			    'percentile_5': d[Math.ceil(0.05*d.length)],
				'mean': d.reduce((acc, e) => acc + e, 0) / d.length,
			    'max': Math.max(...d),
			    'min': Math.min(...d),
			    'count': d.length,
			    'id': key,
			    'nodes': nodes
		    })
	    	return acc
	    }, []).filter((e) => e.count > 1)
	}

	createGraph(nodes){
		super.createGraph(nodes)
		this.groupBy = 'region'

		// filter out 0 attributes from nodes
		this.filterNodes(nodes)
		this.data = this.candleStickData()
		// how many bands do we have on the y axis
		this.groups = [...new Set(this.data.map(e => e.id))]

        this.xScale = scaleLinear()
            .domain([1, max(this.nodes, d => this.x(d))])
            .range([this.margin.left, this.width])

        this.yScale = scaleBand()
            .domain(Array.from(Array(this.groups.length).keys()))
            .range([
            	this.margin.top,
	            this.height + this.margin.top - this.margin.bottom
            ])
		this.createLegend()
		this.bw = this.yScale.bandwidth();
	}

	exitPrevChart(){
		let n = 0
		this.node.exit()
			.each(() => n++)
			.attr("class", "candlestick")
			.transition("exit").duration(2000)
            .attr("transform", d => {
            	const agg = this.data.filter(e => e.id === d[this.groupBy])[0]
	            const x = agg? this.xScale(agg.mean) : 0
            	const y = this.yScale(this.y(d.region)) + this.bw / 2
	            if (x === 0){
	            	return "scale(0, 0)"
	            }
            	return "translate("+ x + "," + (y? y : 0) +")"
            })
			.on('end', () => {
				n--
				if (n === 0){
					this.drawBox()
				}
			})
			.transition().duration(2000)
			.remove()
	}

	drawBox(){
		let n = 0

		this.newNode
			.each(() => n++)
			.append("rect")
			.attr("height", 0)
			.attr("width", 0)
	        .attr("class", "fill")
			.attr("x", d => this.xScale(d.mean))
			.attr("rx", 15)
			.attr("y", d => this.yScale(this.y(d.id)) + this.bw / 2)
			.attr("ry", 15)
			.transition("drawbox").duration(1000)
			.attr("height", this.bw)
				.attr("x", d => this.xScale(d.percentile_5))
				.attr("y", d => this.yScale(this.y(d.id)))
				.attr('width', d => {
					const start = this.xScale(d.percentile_95)
					const end = this.xScale(d.percentile_5)
					return start - end
				})
				.on("end", () => {
					n--
					if (n === 0){
						this.drawWhiskers()
						this.drawMean()
						this.addLabel()
					}
				})
	}

	drawWhiskers(){
		const offset = this.bw / 2
		this.newNode
			.append("line")
			.attr("x1", d => this.xScale(d.percentile_5))
			.attr("x2", d => this.xScale(d.percentile_5))
			.attr("y1", d => this.yScale(this.y(d.id)) + offset)
			.attr("y2", d => this.yScale(this.y(d.id)) + offset)
	        .attr("class", "line")
			.transition("drawWhiskers1").duration(1000)
				.attr("x2", d => this.xScale(d.min))

		this.newNode
			.append("line")
			.attr("x1", d => this.xScale(d.percentile_95))
			.attr("x2", d => this.xScale(d.percentile_95))
			.attr("y1", d => this.yScale(this.y(d.id)) + offset)
			.attr("y2", d => this.yScale(this.y(d.id)) + offset)
	        .attr("class", "line")
			.transition("drawWhiskers2").duration(1000)
				.attr("x2", d => this.xScale(d.max))

	}

	addLabel(){
		// text
		this.newNode
			.append("text")
			.attr("x", d => {
				const start = this.xScale(d.percentile_5)
				const length = this.xScale(d.percentile_95) - start
				return start + (length / 2)
			})
			.attr("y", d => this.yScale(this.y(d.id)) + this.bw/2)
			.attr("text-anchor", "middle")
			.attr("class", "label")
			.style("fill", "#fff")
            .style("font-size", 12)
            .text(d => `${d.id} (${d.count})`)
	}

	drawMean(){
		// mean
		this.newNode
			.append("line")
			.attr("x1", d => this.xScale(d.mean))
			.attr("x2", d => this.xScale(d.mean))
			.attr("y1", d => this.yScale(this.y(d.id)))
			.attr("y2", d => this.yScale(this.y(d.id)) + this.bw)
	        .attr("class", "mean")
	}

	drawGraph = (nodes, clickHandler, selectedNodes) => {
		this.filterNodes(nodes)

		this.node = this.node.data(this.data, d=> d.id)

		this.newNode = this.node.enter()
			.append("g")
			.attr("class", "candlestick")

		this.exitPrevChart()

		this.newNode.on("click", d => this.click(d))
		this.tooltip = select("#tooltip")

		this.node = this.node.merge(this.newNode)
		this.initial = false
	}

	click = (d) => {
		if(this.tooltipData !== d){
		    this.tooltip.transition().duration(200).style("opacity", 1)
			this.tooltip.html(this.detail(d))
		         .style("left", (event.pageX) + "px")
		         .style("top", (event.pageY - 28) + "px")
			this.tooltipData = d
		}else{
		    this.tooltip.transition().duration(500).style("opacity", 0)
			this.tooltipData = null
		}
	}

	filterNodes = (nodes) => {
		const minDates = 10
		const minArtists = 20
		this.nodes = nodes.filter(e =>{
			return (
				this.x(e) !== 0 &&
				e.number_of_unique_artists > minArtists &&
				e.number_of_dates > minDates
			)
		})
	}

	createLegend(){
		const yOffset = this.height + this.margin.top - this.margin.bottom
		const translate = `translate(0, ${yOffset})`
		this.legend = select(this.svg)
			.append("g")
			.attr("class", "legend")
			.attr("transform", translate)
		const axis = axisBottom(this.xScale)
			.tickValues(this.xScale.ticks().concat(this.xScale.domain()))
		this.legend.call(axis)

		const labelOffset = `translate(${this.width}, 30)`
		select(this.svg)
			.append("g")
			.attr("transform", labelOffset)
			.attr("class", "label legend")
			.attr("text-anchor", "end")
			.append('text')
		    .text("Average number of bookings per artist by region in 2019")
	}

	detail(data){
		const rows = data.nodes.map(club => {
			return `<tr>
				<td>${club.id}</td>
				<td>
					${(
						club.total_number_of_artists / club.number_of_unique_artists
					).toFixed(1)}
				</td>
			</tr>`
		})
		return `<h2 class="center">${data.id}</h2>
			<table>
			<thead>
				<tr>
					<th>Club Name</th>
					<th>Average bookings per artist</th>
				</tr>
			</thead>
			<tbody>
				${rows.join("")}
			</tbody>
		</table>`
	}
}

export {CandleStickChart}