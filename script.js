document.getElementById('searchForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the form from submitting traditionally
    const searchType = document.querySelector('input[name="searchType"]:checked').value;
    const searchText = document.getElementById('searchInput').value;

    fetch(`/search?searchType=${encodeURIComponent(searchType)}&search=${encodeURIComponent(searchText)}`)
        .then(response => response.json()) // Convert the response to JSON
        .then(data => {
            const resultsContainer = document.getElementById('results');
            resultsContainer.innerHTML = ''; // Clear previous results

            if (data.length > 0) {
                data.forEach(item => {
                    const content = `<p>${item.company_name} - ${item.stock_ticker} - $${item.stock_price}</p>`;
                    resultsContainer.innerHTML += content;
                    console.log(`Result: ${item.company_name}, ${item.stock_ticker}, $${item.stock_price}`); // Also log each result to the console
                });
            } else {
                resultsContainer.innerHTML = '<p>No results found.</p>';
                console.log('No results found'); // Log when no results are found
            }
        })
        .catch((error) => {
            console.error('Fetch Error:', error);
            document.getElementById('results').innerHTML = '<p>Error loading data.</p>';
            console.error('Error loading data from server.'); // Log any fetch errors
        });
});
