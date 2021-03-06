let request = require('request');
let fs = require('fs');

var newsCategories = [
    "general", 
    "sports", 
    "technology", 
    "business", 
    "entertainment", 
    "health", 
    "science"
];

var requestReturnCount = 0;
var headlines = [];

var wordMap = new Map();
var wordCount = 0;

// common articles, prepositions, etc
var ignore = [
    'the',
    'a',
    'an',
    'of',	
    'with',	
    'at',	
    'from',	
    'into',	
    'during',	
    'including',
    'until',	
    'against',	
    'among',	
    'throughout',
    'despite',	
    'towards',	
    'upon',	
    'concerning',
    'to',	
    'in',	
    'for',	
    'on',	
    'by',	
    'about',
    'like',
    'through',
    'over',
    'before',	
    'between',
    'after',
    'since',
    'without',	
    'under',
    'within',
    'along',
    'following',
    'across',	
    'behind',	
    'beyond',	
    'plus',	
    'except',	
    'but',	
    'up',	
    'out',	
    'around',	
    'down',	
    'off',	
    'above',
    'near',
    'is',
    'it',
    'its',
    'will',
    'be',
    'and',
    'as',
    'if',
    'or',
    'so',
    'this',
    'that',
    'are',
    'just',
    'was',
    '|',
    'i',
    '&',
    'you',
    'how',
    'why',
    'what',
    'can',
    'your',
    'has',
    'says',
    'get',
    'he',
    'her',
    '-'
];

function getNews() {
    for(category of newsCategories) {
        sendRequest(category);
    }
}

// replace api key dynamically
function sendRequest(category) {
    var options = {
        url: "https://newsapi.org/v2/top-headlines?category=" + category + "&country=us&pageSize=100&apiKey=d29cb9aebe2e409f81d8d40d32f373c8",
        method: "get"
    }
    
    request(options, function(err, resp, body) {
        if(resp.statusCode != 200) {
            console.log("Error getting news: \n" + err);
            console.log(resp.statusCode);
            console.log(body);
            process.exit(1);
        }
        else {
            console.log(category + " news retrieved");

            parseResponse(JSON.parse(body));
        }
    });
}

function parseResponse(resp) {
    for(article in resp.articles) {
        headlines.push(resp.articles[article].title.substring(0, resp.articles[article].title.lastIndexOf(" - ")));
    }

    if(++requestReturnCount == newsCategories.length) {
        countWords();
    }
}

function countWords() {
    for(headline of headlines) {
        for(word of headline.split(' ')) {
            word = clean(word);
            
            if(!ignore.includes(word)) {
                if(wordMap.has(word)) {
                    wordMap.set(word, wordMap.get(word) + 1);
                }
                else {
                    wordMap.set(word, 1);
                }
            }
        }
    }

    wordMap = new Map([...wordMap.entries()].sort((a, b) => b[1] - a[1]));

    createHTML();
}

function clean(word) {
    word = word.toLowerCase();
    word = word.replace(/["'???!?.,]/g, '');

    return word;
}

function createHTML() {
    var values = createValuesString();
    var tableString = createTableString();
    var dateString = createDateString();

    var html = `
<html>
    <head>
        <script type="text/javascript" src="wordcloud/src/wordcloud2.js"></script>
        <style>
            table {
                border-collapse: collapse;
                width: 75%;
            }
            table, th, td {
                border: 1px solid black;
            }
            #wordCloudDiv {
                width: 100%;
                height: 100%;
                margin: auto;
            }
        </style>
        <title>NewsCloud</title>
    </head>

    <body>
        <h2 style='text-align:center;margin-bottom:0;'>NewsCloud</h2>
        <div style='text-align:center'><i>Analyzing top news headlines</i></div>
        <br>
        <div style='text-align:center'>` + wordCount + ` words</div>
        <div style='text-align:center'>Updated ` + dateString + `</div>
        <hr>
        <div id="wordCloudDiv"></div>
        <hr>

        <script type="text/javascript">
            WordCloud(
                document.getElementById('wordCloudDiv'), 
                { 
                    list: ` + values + `,
                    weightFactor: 3,
                    click: function(item) {
                        if (window.confirm(item[0] + ' used ' + item[1] + ' times.\\nClick OK to Google ' + item[0] + '.')) {
                            window.location.href='https://www.google.com/search?q=' + item[0];
                        };
                    }
                } 
            );                    
        </script>

        <h3 style='text-align:center'>Top 25 most used words</h3>
        <table align=center>
                <tr>
                    <td><b>Word</b></td>
                    <td><b>Times used</b></td> 
                </tr>` + tableString + `
        </table>
        <hr>
        <h3 style='text-align:center'>Disclaimer</h3>
        <div style='text-align:center'>Only words that appeared more than once in the headlines will show here. Common words, articles, and prepositions are removed.</div>
    </body>
</html>
    `

    writeToFile(html);
}

function createValuesString()  {
    var values = '[';

    for(key of wordMap.keys()) {
        if(wordMap.get(key) > 1) {
            values +=  "['" + key + "', " + wordMap.get(key) + "],";

            wordCount++;
        }
    }

    return values.substring(0, values.length - 1) + ']';
}

function createTableString() {
    var tableString = '';
    var count = 0;

    for(key of wordMap.keys()) {
        tableString += '<tr><td>' + key + '</td><td>' + wordMap.get(key) + '</td></tr>';
        if(++count == 25) {
            break;
        }
    }

    return tableString;
}

function createDateString() {
    var date = new Date();

    return date.toLocaleDateString('en-US', {timeZone: "America/New_York"}) + 
            ' ' + date.toLocaleTimeString('en-US', {timeZone: "America/New_York"});
}

function writeToFile(html) {
    fs.writeFile("newscloud.html", html, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("newscloud.html written");
    }); 
}

getNews();
