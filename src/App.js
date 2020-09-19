import React, {Component} from 'react';
import Container from './Container'
import FrontPage from './frontPage'
import Navbar from './navbar'

class App extends Component {

	constructor(props) {
        super(props)
        this.state = {
            loading: true,
	        data: {}
        }
    }

    loadData() {
        fetch(`${process.env.PUBLIC_URL}/network-2019.json`)
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
	    const network = this.state.loading? '' : <Container
		    data={this.state.data}
	    />
        return (
            <>
	            <Navbar />
	            {frontPage}
                <div id={"start"} >
                    {network}
                </div>
            </>
        )
    }
}

export default App;