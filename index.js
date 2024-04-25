const http = require('http');
const mongodb = require('mongodb').MongoClient;
const querystring = require('querystring');

const mongoURL = "mongodb+srv://rajat27999:8hgkx026QbWXE3mF@cluster0.rvrxaef.mongodb.net/?retryWrites=true&w=majorityy";
const mongoClient = new mongodb(mongoURL);

const stockSearchServer = http.createServer((req, res) => {
    if (req.method === 'GET') {
        serveHTMLForm(res);
    } else if (req.method === 'POST') {
        processFormSubmission(req, res);
    }
});

async function processFormSubmission(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
        const formData = querystring.parse(body);
        try {
            await mongoClient.connect();
            const results = await performSearch(formData);
            await mongoClient.close();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(results));
        } catch (error) {
            console.error('Database connection error:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Server error' }));
        }
    });
}

async function performSearch(formData) {
    const db = mongoClient.db('Stock');
    const collection = db.collection('PublicCompanies');
    const searchQueryObject = formData.searchType === 'ticker' ?
        { stock_ticker: formData.searchQuery.toUpperCase() } :
        { company_name: new RegExp(formData.searchQuery, 'i') };
    return await collection.find(searchQueryObject).toArray();
}

function serveHTMLForm(res) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(getHTMLForm());
}

const port = process.env.PORT || 3000;
stockSearchServer.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

function getHTMLForm() {
    return `
        <html>
            <head>
                <title>Stock Search</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    h1 { color: #333366; }
                    form > div { margin-bottom: 10px; }
                    button { background-color: #4CAF50; color: white; padding: 10px 20px; border: none, border-radius: 4px; cursor: pointer; }
                    button:hover { background-color: #45a049; }
                    #results { margin-top: 20px; }
                </style>
                <script>
                    function submitForm(event) {
                        event.preventDefault();
                        var formData = new FormData(event.target);
                        var searchType = formData.get('searchType');
                        var searchQuery = formData.get('searchQuery');
                        fetch('/', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: 'searchType=' + searchType + '&searchQuery=' + searchQuery
                        }).then(response => response.json())
                        .then(data => {
                            var resultsDiv = document.getElementById('results');
                            resultsDiv.innerHTML = '';
                            data.forEach(company => {
                                var p = document.createElement('p');
                                p.textContent = 'Name: ' + company.company_name + ', Ticker: ' + company.stock_ticker + ', Price: ' + company.stock_price;
                                resultsDiv.appendChild(p);
                            });
                        }).catch(error => console.error('Error:', error));
                    }
                </script>
            </head>
            <body>
                <h1>Search for Company or Stock Ticker</h1>
                <form action="/" method="post" onsubmit="submitForm(event)">
                    <div>
                        <input type="radio" id="typeTicker" name="searchType" value="ticker" checked>
                        <label for="typeTicker">Ticker Symbol</label>
                    </div>
                    <div>
                        <input type="radio" id="typeName" name="searchType" value="name">
                        <label for="typeName">Company Name</label>
                    </div>
                    <input type="text" id="searchQuery" name="searchQuery" placeholder="Enter ticker or name" required>
                    <button type="submit">Search</button>
                </form>
                <div id="results"></div>
            </body>
        </html>
    `;
}

