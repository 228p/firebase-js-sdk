import React, { Component } from 'react';
import ReactJson from 'react-json-view'
import DropDown from './components/DropDown';
import Module from './components/Module';
import BundlePanel from './components/BundlePanel';
import { SECTION, ENDPOINTS, API_ROOT_DEV, API_ROOT } from './constants';
import { dropdownData, modules, sample_bundle } from './dummy-data';
import './App.css';
class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedVersion: "",
      allModulesOfSelectedVersion: "",
      currentBundle: new Map(),
      currentBundleReport: null,
      dropDownData: []
    }
    this.handleChange = this.handleChange.bind(this);
    this.onFirebaseVersionSelected = this.onFirebaseVersionSelected.bind(this);
    this.handleAddModuleToBundle = this.handleAddModuleToBundle.bind(this);
    this.handleAddFunctionToBundle = this.handleAddFunctionToBundle.bind(this);
    this.handleUpdateBundle = this.handleUpdateBundle.bind(this);
    this.handleOnCalculateBundle = this.handleOnCalculateBundle.bind(this);
    this.handleRemoveModuleFromBundle = this.handleRemoveModuleFromBundle.bind(this);
    this.handleRemoveFunctionFromBundle = this.handleRemoveFunctionFromBundle.bind(this);
    this.populateDropDownData = this.populateDropDownData.bind(this);
  }

  handleUpdateBundle(updatedBundle) {
    this.setState({
      currentBundle: updatedBundle
    })
  }
  handleRemoveModuleFromBundle(moduleNameTobeRemoved) {
    let tmpCurrentBundle = new Map(this.state.currentBundle);
    tmpCurrentBundle.delete(moduleNameTobeRemoved);
    this.handleUpdateBundle(tmpCurrentBundle);
  }
  handleRemoveFunctionFromBundle(functionNameTobeRemoved, moduleName) {
    let tmpCurrentBundle = new Map(this.state.currentBundle);
    tmpCurrentBundle.get(moduleName).delete(functionNameTobeRemoved);
    if (tmpCurrentBundle.get(moduleName).size === 0) {
      tmpCurrentBundle.delete(moduleName);
    }
    this.handleUpdateBundle(tmpCurrentBundle);

  }

  handleAddModuleToBundle(moduleName) {
    // if adding a whole module to the bundle, then an entry in map with key module name and value an empty set 
    // if adding some functions of a module to the bundle, then an entry in map with key module name and value a set of function names 
    let tmpCurrentBundle = new Map(this.state.currentBundle);
    if (!tmpCurrentBundle.has(moduleName)) {
      tmpCurrentBundle.set(moduleName, new Set());
    }

    else {
      tmpCurrentBundle.get(moduleName).clear();
    }
    this.setState({
      currentBundle: tmpCurrentBundle
    });

  }
  handleAddFunctionToBundle(functionName, moduleName) {
    let tmpCurrentBundle = new Map(this.state.currentBundle);
    if (!tmpCurrentBundle.has(moduleName)) {
      tmpCurrentBundle.set(moduleName, new Set());
    }
    tmpCurrentBundle.get(moduleName).add(functionName);

    this.setState({
      currentBundle: tmpCurrentBundle
    });

  }
  handleChange(e) {

    this.setState({
      [e.target.name]: e.target.value
    });
  }
  componentDidMount() {
    this.populateDropDownData();
  }

  populateDropDownData() {
    fetch(`${API_ROOT}${ENDPOINTS.retrieveFirebaseVersionFromNPM}`, {
      headers: {
        'Accept': 'application/json'
      },
      method: "GET",
    })
      .then(res => res.json())
      .then(
        (result) => {
          this.setState(prevState => ({
            dropDownData: [...prevState.dropDownData, ...result]
          }))
        },
        (error) => {
          console.log(error);
        }
      );


  }
  handleOnCalculateBundle() {
    this.setState({
      currentBundleReport: sample_bundle
    });

  }
  onFirebaseVersionSelected(e) {

    // retrieve the packages and get all the functions
    this.setState({
      [e.target.name]: e.target.value,
      // allModulesOfSelectedVersion: modules[e.target.value]
      allModulesOfSelectedVersion: modules["12.2.4"]
    });


  }
  render() {
    const style = {

      "height": "inherit",

      "overflow": "scroll"
    }
    return (
      <div className="container-fluid wrapper">
        <div className="row">
          <div className="col-8">
            <h2 className="text">{SECTION.bundleCreation}</h2>

          </div>
          <div className="col-4">
            <DropDown
              listItems={this.state.dropDownData}
              name="selectedVersion"
              value={this.state.selectedVersion}
              onChange={this.onFirebaseVersionSelected} />
          </div>
        </div>
        <div className="row">
          <div className="col-4 preview" >
            <div className="row">
              {Object.keys(this.state.allModulesOfSelectedVersion).map(key =>
                <Module
                  key={key}
                  index={key}
                  name={key}
                  handleAddFunctionToBundle={this.handleAddFunctionToBundle}
                  handleAddModuleToBundle={this.handleAddModuleToBundle}
                  handleRemoveFunctionFromBundle={this.handleRemoveFunctionFromBundle}
                  handleRemoveModuleFromBundle={this.handleRemoveModuleFromBundle}
                  bundle={this.state.currentBundle}
                  module={this.state.allModulesOfSelectedVersion[key]}

                />)}

            </div>
          </div>

          <div className="col-8" >
            <div className="row m-2">
              <BundlePanel
                bundle={this.state.currentBundle}
                handleRemoveFunctionFromBundle={this.handleRemoveFunctionFromBundle}
                handleRemoveModuleFromBundle={this.handleRemoveModuleFromBundle}
                handleOnCalculateBundle={this.handleOnCalculateBundle}
              />
            </div>

            <div className="row m-2">
              <div className="col bundle-overview">
                {this.state.currentBundleReport ?
                  <ReactJson
                    src={this.state.currentBundleReport}
                    displayDataTypes={false}
                    style={style} />
                  : <h2 className="text-center text-muted text">{SECTION.bundleOverview}</h2>}
              </div>
            </div>


          </div>

        </div>




      </div >

    );

  }
}
export default App;
