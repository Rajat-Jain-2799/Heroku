const http = require('http');
const mongodb = require('mongodb').MongoClient;
const querystring = require('querystring');

const mongoURL = "mongodb+srv://rajat27999:8hgkx026QbWXE3mF@cluster0.rvrxaef.mongodb.net/?retryWrites=true&w=majority";
const mongoClient = new mongodb(mongoURL);

const server = http.createServer(async (req, res) => {
    if (req.method === 'GET') {
        // Serve the HTML form when accessed via HTTP GET
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(getHTMLForm());
    } else if (req.method === 'POST') {
        // Handle form submission when accessed via HTTP POST
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            const formData = querystring.parse(body);
            const queryType = formData.searchType;
            const searchTerm = formData.searchQuery;

            // Connect to MongoDB and perform search
            try {
                await mongoClient.connect();
                const db = mongoClient.db('Stock');
                const collection = db.collection('PublicCompanies');

                let searchQueryObject = {};
                if (queryType === 'ticker') {
                    searchQueryObject = { stock_ticker: searchTerm.toUpperCase() };
                } else if (queryType === 'name') {
                    searchQueryObject = { company_name: new RegExp(searchTerm, 'i') };
                }

                const results = await collection.find(searchQueryObject).toArray();
                await mongoClient.close();
                
                // Respond with search results
                const htmlResponse = buildHTMLResponse(results);
                
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(htmlResponse);
            } catch (error) {
                res.writeHead(500);
                res.end('Server error');
                console.error('Database connection error:', error);
            }
        });
    }
});

const getHTMLForm = () => `
    <html>
        <head>
            <title>Stock Search</title>
        </head>
        <body>
            <h1>Search for Company or Stock Ticker</h1>
            <form action="/" method="post">
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

const buildHTMLResponse = (results) => {
    let htmlResponse = '<html><body><h1>Search Results</h1>';
    results.forEach(company => {
        htmlResponse += `<p>Name: ${company.company_name}, Ticker: ${company.stock_ticker}, Price: ${company.stock_price}</p>`;
    });
    htmlResponse += '</body></html>';
    return htmlResponse;
};

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

