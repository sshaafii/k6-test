// Imports
import http from 'k6/http';
import { check, sleep } from 'k6';

// Options - configure execution of tests

// Default function - test logic resides here
export default function () {
    const url = 'https://test-api.k6.io/public/crocodiles/';
    
    // First HTTP GET request
    const res = http.get(url);

    // Check if the first request was successful
    check(res, {
        'status is 200': (r) => r.status === 200,
    });

    // Parse the response and extract crocodile IDs
    let crocodiles = res.json();
    const id_arr = [];

    for (let crocodile of crocodiles) {
        id_arr.push(crocodile.id);
    }

    // Log the retrieved IDs
    console.log('Crocodile IDs:', id_arr);

    // Randomly select an ID from the array
    let index = Math.floor(Math.random() * id_arr.length);
    let selectedId = id_arr[index];

    // Log the selected ID
    console.log('Selected Crocodile ID:', selectedId);

    // Make another HTTP GET request with the selected ID
    const res2 = http.get(`${url}${selectedId}`);

    // Check if the second request was successful
    check(res2, {
        'status is 200': (r) => r.status === 200,
    });

    sleep(1); // Optional sleep to simulate user wait time
}