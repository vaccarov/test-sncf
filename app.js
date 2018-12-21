const fs = require('fs');
const cheerio = require('cheerio');
const moment = require('moment');

const obj = {
    'status': 'ok',
    'result': {
        'trips': [{
            'code': '',
            'name': '',
            'details': {
                'price': 0,
                'roundTrips': []
            }
        }],
        'custom': {
            'prices': []
        }
    }
};

// Read test.html and clean file
// Find data :
    // code & name
    // price
    // Round trips
    // passangers
    // custom price
// Generate json from the object

/******************************************
 * Read test.html and clean file
 *****************************************/
const clean = fs.readFileSync('./test.html', 'utf8')
    .replace(/\\r\\n/g, '')
    .replace(/\\"/g, '"')
    .replace('" " ', '" ')
    .replace(/&nbsp;/g, ' ');

const $ = cheerio.load(clean);

/******************************************
 * Find data
 *****************************************/

// trips code and name
$('.pnr-info').each((i, item) => {
    const value = item.children[0].data.trim();
    switch(i) {
        case 4: obj.result.trips[0].code = value; break;
        case 5: obj.result.trips[0].name = value; break;
    }
});

// Price
obj.result.trips[0].details.price = getDecimal($('.very-important').text());

// Round trips
const trips = $('.product-details');
var tripValues = [];
for (var i = 0; i < trips.length; i++) {
    getTripInfo(trips.eq(i), tripValues);
    setDateInfo(i);
    pushTripInfo();
    tripValues = [];
}

const p = {'type': 'échangeable', 'age': '(26 à 59 ans)'};
// Passengers
const passengers = [p, p, p, p];
obj.result.trips[0].details.roundTrips[3].trains[0].passengers = passengers;

// Custom prices
$('.product-header td:last-child').each((i, item) => {
    obj.result.custom.prices.push({'value': getDecimal(item.children[0].data)});
});


fs.writeFileSync('res.json', JSON.stringify(obj, null, 2));

function getDecimal(val) {
    return parseFloat(val.trim().replace(',', '.').slice(0, -2));
}

/******************************************
 * Functions
 *****************************************/

function getTripInfo(list, array) {
    for (var i = 0; i < list.length; i++) {
        elem = list[i];
        if (elem.type === 'text' && elem.data.trim().length) array.push(elem.data.trim());
        else if (elem.children && elem.type !== 'comment' && elem.tagName !== 'script' && elem.tagName !== 'style') {
            getTripInfo(elem.children, array);
        }
    }
}

function setDateInfo(i) {
    var date;
    if (i === 0) {
        date = $('.pnr-summary').eq(0).text().trim().slice(-24, -14);
    } else if (i === 1) {
        date = $('.pnr-summary').eq(0).text().trim().slice(-10);
    } else if (i === 2) {
        date = $('.pnr-summary').eq(1).text().trim().slice(-24, -14);
    } else if (i === 3) {
        date = $('.pnr-summary').eq(1).text().trim().slice(-10);
    }
    tripValues.date = moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD 00:00:00.000') + 'Z';
}

function pushTripInfo(i) {
    obj.result.trips[0].details.roundTrips.push({
        'type': tripValues[0],
        'date': tripValues.date,
        'trains': [{
            'departureTime': tripValues[1].replace('h', ':'),
            'departureStation': tripValues[2],
            'arrivalTime': tripValues[6].replace('h', ':'),
            'arrivalStation': tripValues[7],
            'type': tripValues[3],
            'number': tripValues[4]
        }]
    });
}