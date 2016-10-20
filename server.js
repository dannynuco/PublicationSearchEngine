/**
 * Created by Danny on 10/18/2016.
 */

var PORT_NUM = 8000;
var http = require('http');
var url = require('url');
var qs = require('querystring');
var fs = require('fs');
var parse = require('csv-parse')


//Read in csv data rows
//var searchData={};

var id=[];
var title=[];
var author=[];
var publisher=[];
var pub_date=[];
var figure_number=[];
var technique_group=[];
var gene=[];

console.log("Parsing csv data...");
var isFirstRow=true;
var index=0;
fs.createReadStream('test_data.csv')
    .pipe(parse({delimiter: ','}))
    .on('data', function(csvData) {
        if(!isFirstRow){
            id.push(index)
            title.push(csvData[0])
            author.push(csvData[1])
            publisher.push(csvData[2])
            pub_date.push(csvData[3])
            figure_number.push(csvData[4])
            technique_group.push(csvData[5])
            gene.push(csvData[6])
        } else {
            isFirstRow=false;
        }
        index++;
    })
    .on('end',function() {
        //do something wiht csvData
        console.log("Finished parsing csv data.")
    });


var server = http.createServer(function(request, response){
    //Set header for content type and CORS
    //response.setHeader('Content-Type', 'application/json; charset="utf-8"');
    response.setHeader('Access-Control-Allow-Origin', '*');
    //log the request method
    console.log(request.method);
    switch(request.method) {
        case 'GET':
            response.end();
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
                if(typeof(queryString)!='string'){
                    //improper query string
                    response.end('{}');
                    return;
                }
                if(queryString==""){
                    //query string empty
                    response.end('{}');
                    return;
                }
                var queryString = queryString.toUpperCase();
                console.log(queryString);
                for(i=0; i<gene.length; i++){
                    if(gene[i].indexOf(queryString) > -1) {
                        resultSet.push(i);
                    }
                }
                //Done generating resultSet, collect data and respond
                //console.log(resultSet);
                var result={};
                for(i=0; i<resultSet.length; i++){
                    result[i]={
                        'id':id[resultSet[i]],
                        'title':title[resultSet[i]],
                        'author':author[resultSet[i]],
                        'publisher':publisher[resultSet[i]],
                        'pub_date':pub_date[resultSet[i]],
                        'figure_number':figure_number[resultSet[i]],
                        'technique_group':technique_group[resultSet[i]],
                        'gene':gene[resultSet[i]]
                    }
                }
                //console.log(result);
                var resultstr=JSON.stringify(result);
                response.setHeader('Content-Length', Buffer.byteLength(resultstr));
                response.end(resultstr);
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