import React, {Component} from 'react';
import NetworkChart from './networkChart'
import FrontPage from './frontPage'

class App extends Component {

	constructor(props) {
        super(props)
        this.state = {
            loading: true,
	        data: {}
        }
    }

    loadData() {
        fetch(`/network-2019.json`)
            .then( (response) => {
                return response.json()
            })
            .then( (data) => {
            	// change arrays into objects
	            data.nodes = data.nodes.map(e =>{
	            	return e.reduce((acc, e, i) => {
	            		acc[data.node_keys[i]] = e
	            		return acc
		            }, {})
	            })
	            data.links = data.links.map(e =>{
	            	return e.reduce((acc, e, i) => {
	            		acc[data.link_keys[i]] = e
	            		return acc
		            }, {})
	            })
            	this.setState({
		            loading: false,
		            data: data,
            	})
            });
    }
    
	componentDidMount() {
        this.setState({
	        loading: true,
            data: this.loadData()
        })
    }

    render(){
		const frontPage = <FrontPage />
	    const network = this.state.loading? '' : <NetworkChart
		    data={this.state.data}
	    />
        return (
            <>
	            {frontPage}
                <div id={"start"} >
                    {network}
                </div>
            </>
        )
    }
}

export default App;