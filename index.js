require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();

app.use(express.static());


const mongo_uri = process.env.MONGO_URI || 'mongodb+srv://rajat27999:8hgkx026QbWXE3mF@cluster0.rvrxaef.mongodb.net/?retryWrites=true&w=majority';

app.get('/search', async (req, res) => {
    let client;
    try {
        client = await MongoClient.connect(mongo_uri);
        const db = client.db("Stock");
        const collection = db.collection("PublicCompanies");
        const searchType = req.query.searchType;
        const searchText = req.query.search;
        const query = searchType === "ticker" ? { stock_ticker: searchText } : { company_name: searchText };

        const results = await collection.find(query).toArray();
        res.json(results);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Error fetching data' });
    } finally {
        if (client) {
            await client.close();
        }
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
