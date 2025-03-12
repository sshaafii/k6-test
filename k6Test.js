// Imports
import http from 'k6/http';
import { check, sleep } from 'k6';
import {Trend} from 'k6/metrics';

// Options - configure execution of tests

export const options = {
    scenarios: {
      smoke_test: {
        executor: 'ramping_vus',
        vus:3,
        duration: '20s',
        /* Smoke Test Scenario validates if script runs without errors*/
      },
      load_test: {
        executor: 'ramping_vus',
        vus:20,
        duration: '60s',
        /* Smoke Test Scenario validates if script runs without errors*/
      },
      stress_test: {
        executor: 'ramping_vus',
        vus:120,
        duration: '60s',
        /* Stress Test Scenario validates if script runs without errors*/
      },
      soak_test: {
        executor: 'ramping_vus',
        vus:20,
        duration: '5m',
        /* Soak Test Scenario validates if script runs without errors*/
      },
      spike_test: {
        executor: 'ramping-vus',
        startVUs: 3,
        stages: [
            { target: 20, duration: '10s' }, 
            { target: 200, duration: '0' }, 
            { target: 200, duration: '60s' }, 
          ],
          /* Spike Test Scenario validates if script runs without errors*/
      },

    },
  };

//Define Custom Metrics

let responseTime = new Trend('response_time');
let responseTime1 = new Trend('response_time1');

// Default function - test logic resides here
export default function () {
    const url = 'https://test-api.k6.io/public/crocodiles/';
    
    // First HTTP GET request
    const res = http.get(url);

    responseTime.add(res.timings.duration);

    // Check if the first request was successful
    check(res, {
        ' res status is 200': (r) => r.status === 200,
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

    responseTime1.add(res2.timings.duration);

    // Check if the second request was successful
    check(res2, {
        'res 2 status is 200': (r) => r.status === 200,
    });

    sleep(1); // Optional sleep to simulate user wait time
}