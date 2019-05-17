let mydata = require('./nlp/testData');
let myUuids = ['u1','u2','u3','u4','u5','u6','u7'];
let feat = require('./nlp/models/features');

let survs = new feat.Surveys(mydata, myUuids);
let feats = new feat.Features(survs, 3);

// console.log("First Matrix : ",result[0]);
// console.log("Second Matrix : ",result[1]);
