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
    'that'
];

function getNews() {
    for(category of newsCategories) {
        sendRequest(category);
    }
}

// replace api key dynamically
function sendRequest(category) {
    var options = {
        url: "https://newsapi.org/v2/top-headlines?category=" + category + "&country=us&apiKey=d29cb9aebe2e409f81d8d40d32f373c8",
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
    word = word.replace(/["'‘!?.,]/g, '');

    return word;
}

function createHTML() {
    var html = `
<html>
    <head>
        <script type="text/javascript" src="node_modules/wordcloud/src/wordcloud2.js"></script>
        
        <title>Headlines</title>
    </head>

    <body>
        <div id="treeMapDiv" style="width: 100%; height: 100%"></div>

        <script type="text/javascript">
            WordCloud(
                document.getElementById('treeMapDiv'), 
                { 
                    list: ` + createValuesString() + `,
                    weightFactor: 10  
                } 
            );                    
        </script>
    </body>
</html>
    `

    writeToFile(html);
}

function createValuesString()  {
    var values = '[';

    for(key of wordMap.keys()) {
        values +=  "['" + key + "', " + wordMap.get(key) + "],";
    }

    return values.substring(0, values.length - 1) + ']';
}

function writeToFile(html) {
    fs.writeFile("index.html", html, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("index.html written");
    }); 
}

getNews();