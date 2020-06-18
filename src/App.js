import React, {Component} from 'react';
import './App.scss';
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
            <div className='App'>
	            {frontPage}
                <div id={"start"} >
                    {network}
                </div>
            </div>
        )
    }
}

export default App;
