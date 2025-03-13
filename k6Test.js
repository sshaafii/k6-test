// Imports
import http from 'k6/http';
import { check, sleep } from 'k6';
import {Trend} from 'k6/metrics';
import { Rate } from 'k6/metrics';
import { ErrorHandler } from './ErrorHandler.js'; 

// Options - configure execution of tests
const scenarios = {
  smoke_test: {
    executor: 'constant-vus',
    vus: 3, // Minimal users for basic functionality check
    duration: '30s',
   
  },
  load_test: {
    executor: 'ramping-vus',
    startVUs: 1,
    stages: [
        { duration: '30s', target: 30 }, 
        { duration: '1m', target: 30 },  
        { duration: '10s', target: 0 }, 
    ],
    
},
  stress_test: {
    executor: 'ramping-vus',
    startVUs: 10,
    stages: [
        { duration: '1m', target: 50 },  
        { duration: '1m', target: 100 }, 
        { duration: '1m', target: 150 }, 
        { duration: '30s', target: 10 }, 
    ],
},
  soak_test: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
          { duration: '1m', target: 10 },
          { duration: '3m', target: 30 },
          { duration: '1m', target: 0 },
      ],
  },
  spike_test: {
    executor: 'ramping-vus',
    startVUs: 1,
    stages: [
        { duration: '5s', target: 10 },   
        { duration: '0s', target: 200 },  
        { duration: '30s', target: 200 }, 
        { duration: '10s', target: 10 },  
    ],
},
  breakpoint_test: {
    executor: 'ramping-vus',
    startVUs: 5,
    stages: [
        { duration: '30s', target: 10 }, 
        { duration: '30s', target: 50 }, 
        { duration: '30s', target: 100 }, 
        { duration: '30s', target: 200 }, 
        { duration: '30s', target: 300 }, 
        { duration: '30s', target: 400 }, 
        { duration: '30s', target: 500 }, 
        { duration: '30s', target: 600 }, 
        { duration: '30s', target: 700 }, 
        { duration: '30s', target: 800 }, 
        { duration: '30s', target: 900 }, 
        { duration: '30s', target: 1000 }, 
    ],
    

},
breakpoint_test2: {
  executor: 'ramping-vus',
  startVUs: 5,
  stages: [
      { duration: '30s', target: 10 }, 
      { duration: '30s', target: 15 }, 
      { duration: '30s', target: 20 }, 
      { duration: '30s', target: 30 }, 
      
      { duration: '30s', target: 40 }, 
      { duration: '30s', target: 50 }, 
      { duration: '30s', target: 60 }, 
      { duration: '30s', target: 70 }, 
      { duration: '30s', target: 80 }, 
      { duration: '30s', target: 90 }, 
      { duration: '30s', target: 100 }, 
  ],

},
};

const { SCENARIO } = __ENV;
export const options = {
  // if a scenario is passed via a CLI env variable, then run that scenario. Otherwise, run
  // using the pre-configured scenarios above.
  scenarios: SCENARIO ? { [SCENARIO]: scenarios[SCENARIO] } : scenarios,

};

// Set up the error handler to log errors to the console
const errorHandler = new ErrorHandler((error) => {
  console.error(error);
});

//Define Custom Metrics

let responseTime1 = new Trend('request1_response_time');
let responseTime2 = new Trend('request2_response_time');
let request1FailureRate = new Rate('request1_failure_rate');
let request2FailureRate = new Rate('request2_failure_rate');

// Default function - test logic resides here
export default function () {
    const url = 'https://test-api.k6.io/public/crocodiles/';
    
    // First HTTP GET request
    const res = http.get(url);

    responseTime1.add(res.timings.duration);
    //request1FailureRate.add(res.status !== 200);

    // Check if the first request was successful
    let checkStatus = check(res, {
        ' res status is 200': (r) => r.status === 200,
        'verify body text': (r) => r.body.includes('"id":'),
    });
    errorHandler.logError(!checkStatus, res);
    request1FailureRate.add(!checkStatus);

    // Parse the response and extract crocodile IDs
    let crocodiles = res.json();
    const id_arr = [];

    for (let crocodile of crocodiles) {
        id_arr.push(crocodile.id);
    }
    // Log the retrieved IDs
    //console.log('Crocodile IDs:', id_arr);

    // Randomly select an ID from the array
    let index = Math.floor(Math.random() * id_arr.length);
    let selectedId = id_arr[index];

    // Log the selected ID
    //console.log('Selected Crocodile ID:', selectedId);

    sleep(1); // Optional sleep to simulate user wait time

    // Make another HTTP GET request with the selected ID
    const res2 = http.get(`${url}${selectedId}`);

    responseTime2.add(res2.timings.duration);
    //request2FailureRate.add(res.status !== 200);

    // Check if the second request was successful
    let checkStatus1 = check(res2, {
        'res 2 status is 200': (r) => r.status === 200,
        'verify2 body text': (r) => r.body.includes('"id":'),
    });
    errorHandler.logError(!checkStatus1, res);
    request2FailureRate.add(!checkStatus1);

    
}