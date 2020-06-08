import React, {Component} from 'react';
import './App.css';
import NetworkChart from './networkChart'


class App extends Component {

	constructor(props) {
        super(props)
        this.state = {
            loading: true,
	        data: {}
        }
    }

    loadData() {
        fetch(`/network.json`)
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
	    const network = this.state.loading? '' : <NetworkChart
		    data={this.state.data}
		    size={[500,500]}
	    />
        return (
            <div className='App'>
                <div>
                    {network}
                </div>
            </div>
        )
    }
}

export default App;
