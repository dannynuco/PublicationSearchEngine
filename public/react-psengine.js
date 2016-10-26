  class PSEngine extends React.Component {
    constructor () {
    super();
        this.state = {
            searchResult:[],
            compiledResult:{},
            numChildren:0,
            numTechniques:0,
            searchQuery:"",
            favourites:{}
        };
    }


    componentWillMount () {
          var storedFavourites=localStorage.getItem("Liked");
          if(storedFavourites){
              try {
                  storedFavourites = JSON.parse(storedFavourites)
              } catch(err){
                  storedFavourites = {};
              }
          }

          this.setState({
              favourites:storedFavourites||{}
          })
  }
    render () {
        const children = [];

        //console.log(this.state.favourites);
          var compiledResult=this.state.compiledResult
          for (var i in compiledResult) {
              //Determine whether this document entry is liked by comparing it with cookie
              var liked=false;
              var docid=compiledResult[i]["id"];
              if(this.state.favourites[docid]){
                  liked=true;
              }
              children.push(<ResultEntry key={i} data={compiledResult[i]} liked={liked} onLikeEntry={this.onLikeEntry.bind(this)}/>);
          }

        /*for (var i = 0; i < this.state.numChildren; i += 1) {
            //Determine whether this document entry is liked by comparing it with cookie
            var liked=false;
            var docid=this.state.searchResult[i]["id"];
            if(this.state.favourites[docid]){
                liked=true;
            }
            children.push(<ResultEntry key={i} data={this.state.searchResult[i]} liked={liked} onLikeEntry={this.onLikeEntry.bind(this)}/>);
        }*/
          var hideStyle = {
              display:"none"
          };

        return (
            <div>
            <SearchBox onSearchBoxChange={this.onSearchBoxChange.bind(this)}/>
            <br/><br/>
            <div className="buttonRow"><button id="searchButton" className="button1" onClick={this.ondoSearch.bind(this)}>Search by gene</button><div className="divider"/><button id="favListButton" className="button1" onClick={this.onShowFavourites.bind(this)}>My favourites</button></div>
            <div id="technique-barchart" style={hideStyle}>
                <svg width={this.state.numTechniques*200} height="200"></svg>
                <br/>
                <div id="technique-barchart-title">Technique Distribution in Search Result</div>
            </div>
            <br/><br/><br/>
            <SearchContainer doSearch={this.ondoSearch.bind(this)}>
                {children}
            </SearchContainer>
            </div>
        );
    }

    ondoSearch () {
        if(this.state.searchQuery==""){
            return;
        }
        $.ajax({
              url: "http://psengine-api.herokuapp.com/",
              type: 'POST',
              data: {body:this.state.searchQuery},
              success: function(result){
                  result=JSON.parse(result);
                  var chartStats={};
                  this.setState({
                      numChildren:0,
                      numTechniques:0,
                      searchResult:[]
                  });
                  for(var i in result){
                      this.state.searchResult.push(result[i])
                      this.state.numChildren++
                      //Calculate statistics needed to draw chart
                      if(!chartStats[result[i]['technique_group']]){
                          this.state.numTechniques++
                          chartStats[result[i]['technique_group']]=1;
                      } else {
                          chartStats[result[i]['technique_group']]++;
                      }
                  }
                  //Aggregate figure results by document title
                  var compiledResult={};
                  for (var i = 0; i < this.state.numChildren; i += 1) {
                      var docTitle=this.state.searchResult[i]["title"];
                      if(!compiledResult[docTitle]){
                          compiledResult[docTitle]=this.state.searchResult[i];
                      } else {
                          //If compiledResult's figure or technique property is a string, convert it into an array (since more figures/techniques will be pushed in later)
                          var figures = compiledResult[docTitle]["figure_number"]
                          var techniques = compiledResult[docTitle]["technique_group"]
                          if(typeof figures === 'string'){
                              compiledResult[docTitle]["figure_number"]=[ compiledResult[docTitle]["figure_number"] ]
                          }
                          if(typeof techniques === 'string'){
                              compiledResult[docTitle]["technique_group"]=[ compiledResult[docTitle]["technique_group"] ]
                          }
                          compiledResult[docTitle]["figure_number"].push(this.state.searchResult[i]["figure_number"]);
                          compiledResult[docTitle]["technique_group"].push(this.state.searchResult[i]["technique_group"]);
                      }
                  }


                  this.setState({
                      numChildren:this.state.numChildren,
                      numTechniques:this.state.numTechniques,
                      searchResult:this.state.searchResult,
                      compiledResult:compiledResult
                  });
                  //Draw chart with D3
                  drawChart(chartStats);
              }.bind(this)
        });
    }
      onShowFavourites (){
          this.setState({
              compiledResult:this.state.favourites
          });
          if(graph) {
              graph.style.display = "none";
          }
      }

    onSearchBoxChange (value) {
        this.setState({
            searchQuery:value
        });
    }
      onLikeEntry (entry, liked){
          //console.log(entry.id)
          if(!this.state.favourites[entry.id] && liked){
              this.state.favourites[entry.id]=entry;
          }
          else if(this.state.favourites[entry.id] && !liked){
              delete this.state.favourites[entry.id]

          }
          this.setState({
              favourites:this.state.favourites
          })
          localStorage.setItem("Liked", JSON.stringify(this.state.favourites))
      }

}
class SearchBox extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    this.props.onSearchBoxChange(event.target.value);
  }

  render() {
    return (
      <input onChange={this.handleChange} />
    );
  }
}
class SearchContainer extends React.Component {
    render () {
        return <div className="searchResultDiv">
            <div id="children-pane">
              {this.props.children}
            </div>
        </div>;
    }
}

class ResultEntry extends React.Component {
    constructor (props) {
        super();
        this.state = {
            "liked":props.liked,
            "showDetail":false
        };
    }
    render () {
        //Truncate title to 200 characters to fit in search box
        if(!this.state.showDetail){
            return (
                <div className="ResultEntry">
                    <button className={this.props.liked?"likedEntry":"likeEntry"}
                    onClick={this.onLike.bind(this)}>❤
                    </button>
                {this.props.data.gene}<br/>
                {this.props.data.title}<br/>
                    <img onClick={this.onClick.bind(this)} src="flask.png"/>
                </div>
                )
        }
          var figures_array=[];
          for(var i=0; i<this.props.data.figure_number.length; i++){
              figures_array.push(
              <div className="figure-detail">
              <img src="flask.png" onClick={this.onClick.bind(this)} />
                  <div>{this.props.data.figure_number[i]} - {this.props.data.technique_group[i]}</div>
              </div>
              )
          }
          //Sort figures array based on figure number
          //This function needs to be more consistent, because
          figures_array.sort(function(a,b){
              if(a.props.children[1].props.children > b.props.children[1].props.children){
                  return 1;
              }
              return -1;
          });
          //console.log(figures_array);
        return (
            <div className="ResultEntryDetailed">
                <button className={this.props.liked?"likedEntry":"likeEntry"}
                onClick={this.onLike.bind(this)}>❤
                </button>
                {this.props.data.gene}<br/>
                Title: {this.props.data.title}<br/>
                Author(s): {this.props.data.author}<br/>
                Publisher: {this.props.data.publisher}<br/>
                Date published: {this.props.data.pub_date}<br/>
                {figures_array}<br/>
            </div>
        );
    }

    onLike (e){
        //Call parent to save in Cookies
        this.props.onLikeEntry(this.props.data, !this.state.liked);
        this.setState({
            liked:!this.state.liked
        });
          e.stopPropagation();
    }

      onClick(){
          this.setState({
              "showDetail":!this.state.showDetail
          })
      }
}

ReactDOM.render(
  <div>
  <PSEngine/>
  </div>,
  document.getElementById('container')
);
