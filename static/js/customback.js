(function() {
    // Function to handle custom back navigation
    function customBack() {
        var currentPath = window.location.pathname;
        var currentSearch = window.location.search;
        
        if (currentSearch) {
            // If there's a query string, remove it
            history.pushState(null, '', currentPath);
        } else {
            // If no query string, remove the last part of the path
            var newPath = currentPath.split('/').slice(0, -1).join('/') || '/';
            history.pushState(null, '', newPath);
        }
        
        // Reload the page to reflect the new URL
        location.reload();
    }

    // Override browser's back button
    window.addEventListener('popstate', function(event) {
        customBack();
        // Prevent the default back action
        history.pushState(null, '', window.location.pathname);
    });


})();

function recordView(character) {
    fetch('./api/record_view', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ character: character }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log(data.message);
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
    });
}