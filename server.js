/**
 * Created by Danny on 10/24/2016.
 */
var PORT_NUM = process.env.PORT||8000;
var MAX_QUERY_SIZE=10000;
var http = require('http');
var url = require('url');
var qs = require('querystring');
var fs = require('fs');
var elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client({
    host: 'https://myvuyw351f:6pzmfgszuk@sandbox-cluster-7288143143.us-east-1.bonsai.io'
});

var server = http.createServer(function(request, response){
    //Set header for content type and CORS
    //response.setHeader('Content-Type', 'application/json; charset="utf-8"');
    response.setHeader('Access-Control-Allow-Origin', '*');
    //log the request method
    console.log(request.method);
    switch(request.method) {
        case 'GET':
            response.setHeader('Content-Type', 'application/json; charset="utf-8"');
            response.end("PSEngine search backend. Accepting POST requests");
            break;
        case 'POST':
            //Search publication by gene
            var item = '';
            var resultSet=[];
            request.on('data', function (chunk) {
                item += chunk;
                if (item.length > 1e6)
                //Too much POST data, end connection
                    request.connection.destroy();
            });
            request.on('end', function(){
                //Begins search in backend database
                item= qs.parse(item);
                var queryString = item['body'];
                if(typeof(queryString)!='string' || queryString==""){
                    //improper query string
                    response.end('{}');
                    return;
                }
                
                var queryString = queryString.toLowerCase().split(' ');
                console.log(queryString);
                var searchBody={
                    index: '0',
                    type: 'figures',
                    size: MAX_QUERY_SIZE,
                    body: {
                        query: {
                            bool:{
                                should:[],
                                must_not:[]
                            }
                        }

                    }
                }

                for(i in queryString){
                    if(!queryString[i].startsWith('-')){
                        searchBody.body.query.bool.should.push({
                            wildcard:{
                                gene:{
                                    value: '*'+queryString[i]+"*"
                                }
                            }
                        });
                    } else if(queryString[i]!='-'){
                        //minus results matching these queries
                        searchBody.body.query.bool.must_not.push({
                            wildcard: {
                                gene: {
                                    value: '*' + queryString[i].substr(1) + "*"
                                }
                            }
                        });
                    }
                }
                console.log(searchBody)
                client.search(searchBody).then(function (resp) {
                    //Done generating resultSet, collect data and respond
                    var hits=resp.hits.hits;
                    var result={};
                    for(i in hits){
                        result[i]={
                            'id':hits[i]._id,
                            'title':hits[i]._source.title,
                            'author':hits[i]._source.author,
                            'publisher':hits[i]._source.publisher,
                            'pub_date':hits[i]._source.pub_date,
                            'figure_number':hits[i]._source.figure_number,
                            'technique_group':hits[i]._source.technique_group,
                            'gene':hits[i]._source.gene
                        }
                    }
                    var resultstr=JSON.stringify(result);
                    response.setHeader('Content-Length', Buffer.byteLength(resultstr));
                    response.end(resultstr);
                }, function (err) {
                    console.trace(err.message);
                    response.end('{}');
                });
            });
            break;
        case 'DELETE':
            //Delete operation unneeded
            response.end();
            break;
        case 'PUT':
            //Update operation unneeded
            response.end();
            break;
        case 'OPTIONS':
            //CORS preflight, allow all methods listed above
            response.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, PUT");
            response.end();
            break;
    }
});

server.listen(PORT_NUM);
console.log("Server up at port "+PORT_NUM);
